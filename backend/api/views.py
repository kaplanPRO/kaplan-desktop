# Django Imports
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .models import File, KaplanDatabase, Project, ProjectReport

# Installed libraries
import kaplan
from kaplan.kdb import KDB # Translation memory
from kaplan.kxliff import KXLIFF # Bilingual file
from kaplan.project import Project as KaplanProject

from lxml import etree

import mysql.connector

# Standard Python libraries
from datetime import datetime
import difflib
import html
from io import BytesIO
import json
import os
import zipfile

# Create your views here.

@csrf_exempt
def import_project(request):
    path_to_package = request.POST['path']
    project_dir = request.POST['directory']

    if os.path.isfile(project_dir) or (os.path.isdir(project_dir) and len(os.listdir(project_dir))>0):
        return JsonResponse({'error': 'Project directory must be an empty folder!'}, status=500)

    project_metadata = KaplanProject.extract(path_to_package, project_dir)

    new_project = Project()
    new_project.title = project_metadata['title']
    new_project.directory = project_dir
    new_project.source_language = project_metadata['src']
    new_project.target_language = project_metadata['trg']
    new_project.is_imported = True
    new_project.task = project_metadata.get('task', 'translation')
    new_project.save()

    for i in project_metadata['files']:
        new_file = File()
        if 'source' in project_metadata['files'][i]:
            new_file.title = os.path.basename(project_metadata['files'][i]['source'])
            new_file.is_kxliff = True
        else:
            new_file.title = os.path.basename(project_metadata['files'][i]['originalBF'])
        new_file.project = new_project
        new_file.save()

    if 'tms' in project_metadata:
        for i in project_metadata['tms']:
            new_kdb = KaplanDatabase()
            new_kdb.title = os.path.basename(project_metadata['tms'][i])
            new_kdb.path = os.path.join(project_dir, project_metadata['tms'][i])
            new_kdb.source_language = project_metadata['src']
            new_kdb.target_language = project_metadata['trg']
            new_kdb.is_project_specific = True
            new_kdb.role = 'tm'
            new_kdb.save()

            new_project.language_resources.add(new_kdb)

    if 'tbs' in project_metadata:
        for i in project_metadata['tbs']:
            new_kdb = KaplanDatabase()
            new_kdb.title = os.path.basename(project_metadata['tbs'][i])
            new_kdb.path = os.path.join(project_dir, project_metadata['tbs'][i])
            new_kdb.source_language = project_metadata['src']
            new_kdb.target_language = project_metadata['trg']
            new_kdb.is_project_specific = True
            new_kdb.role = 'tb'
            new_kdb.save()

            new_project.language_resources.add(new_kdb)

        new_project.save()

    if 'reports' in project_metadata:
        for i in project_metadata['reports']:
            new_project_report = ProjectReport()
            new_project_report.content = json.dumps(project_metadata['reports'][i]['json'])
            new_project_report.project = new_project
            new_project_report.save()
            new_project_report.created_at = datetime.fromisoformat(project_metadata['reports'][i]['created_at'])
            new_project_report.save()

    return JsonResponse({new_project.id: {'title': new_project.title,
                                          'source_language': new_project.get_source_language(),
                                          'target_language': new_project.get_target_language()}})

@csrf_exempt
def new_project(request):
    project_title = request.POST['title']
    project_dir = request.POST['directory']
    project_source = request.POST['source_language']
    project_target = request.POST['target_language']
    project_lrs = [KaplanDatabase.objects.get(id=int(kdb_id)) for kdb_id in request.POST.get('language_resources', '').split(';') if kdb_id]
    project_clrs = request.POST.get('cloud_language_resources', '{}')
    project_files = [project_file for project_file in request.POST['files'].split(';') if kaplan.can_process(project_file)]

    if len(project_files) == 0:
        return JsonResponse({'error': 'No compatible files selected!'}, status=500)

    if not os.path.exists(project_dir):
        os.makedirs(project_dir)
    elif len(os.listdir(project_dir)) > 0:
        return JsonResponse({'error': 'Project directory must be an empty folder!'}, status=500)

    project = Project()
    project.title = project_title
    project.directory = project_dir
    project.source_language = project_source
    project.target_language = project_target
    project.save()
    for project_lr in project_lrs:
        project.language_resources.add(project_lr)
    project.miscellaneous = project_clrs
    project.save()

    source_dir = os.path.join(project_dir, project.source_language)
    os.mkdir(source_dir)
    target_dir = os.path.join(project_dir, project.target_language)
    os.mkdir(target_dir)

    for project_file in project_files:
        file_title = os.path.basename(project_file)
        new_file = File()
        new_file.title = file_title
        new_file.project = project
        new_file.is_kxliff = not file_title.lower().endswith(('.xliff', '.sdlxliff', '.kxliff'))
        new_file.save()

        with open(project_file, 'rb') as infile:
            with open(os.path.join(source_dir, file_title), 'wb') as outfile:
                for line in infile:
                    outfile.write(line)

        try:
            kxliff = KXLIFF.new(os.path.join(source_dir, file_title), project_source, project_target)
            kxliff.save(source_dir)
            kxliff.save(target_dir)
        except:
            _xliff = kaplan.open_bilingualfile(os.path.join(source_dir, file_title))
            _xliff.save(target_dir)

    return JsonResponse({'status': 'success'})

@csrf_exempt
def new_kdb(request):
    kdb_title = request.POST['title']
    kdb_path = request.POST['path']
    kdb_source_language = request.POST['source_language']
    kdb_target_language = request.POST['target_language']
    kdb_role = request.POST['role']

    new_kdb = KaplanDatabase()
    new_kdb.title = kdb_title
    new_kdb.path = kdb_path if kdb_path.lower().endswith('.kdb') else kdb_path + '.kdb'
    new_kdb.source_language = kdb_source_language
    new_kdb.target_language = kdb_target_language
    new_kdb.role = kdb_role

    kdb = KDB.new(new_kdb.path,
                  new_kdb.source_language,
                  new_kdb.target_language)

    new_kdb.save()

    return JsonResponse({'status': 'success'})

@csrf_exempt
def package(request):
    project_package = request.POST['project_package']

    project_manifest = KaplanProject.get_manifest(project_package)

    return JsonResponse(project_manifest)

def project_directory(request):
    projects_dict = {}

    for project in Project.objects.all():
        projects_dict[project.id] = {'title': html.escape(project.title),
                                    'source_language': project.get_source_language(),
                                    'source_language_code': project.source_language,
                                    'target_language': project.get_target_language(),
                                    'target_language_code': project.target_language,
                                    'is_exported': project.is_exported,
                                    'is_imported': project.is_imported,
                                    'task': project.task}

    return JsonResponse(projects_dict)

@csrf_exempt
def project_file(request, project_id, file_id):
    project = Project.objects.get(id=project_id)
    project_misc = json.loads(project.miscellaneous)
    project_mysql = {}
    if 'mysql' in project_misc:
        project_mysql = project_misc['mysql']
    project_file = File.objects.filter(project=project)
    project_file = project_file.get(id=file_id)

    filename = project_file.title + '.kxliff' if project_file.is_kxliff else project_file.title
    bf = kaplan.open_bilingualfile(os.path.join(project.get_target_dir(), filename))

    if request.method == 'POST':
        if request.POST.get('task') == 'add_comment':
            bf.add_comment(request.POST['segment'],
                           request.POST['comment'],
                           request.POST['author'])
            bf.save(project.get_target_dir())

            return JsonResponse({'status': 'success'})

        elif request.POST.get('task') == 'add_lqi':
            bf.add_loc_quality_issue(request.POST['tu'],
                                     request.POST['segment'],
                                     request.POST['type'],
                                     request.POST['comment'],
                                     request.POST['severity'],
                                     request.POST['author'])

            bf.save(project.get_target_dir())

            return JsonResponse({'status': 'success'})

        elif request.POST.get('task') == 'generate_target_translation':
            bf.generate_target_translation(project.get_target_dir(),
                                           os.path.join(project.get_source_dir(), project_file.title))

            return JsonResponse({'status': 'success'})

        elif request.POST.get('task') == 'merge_segments':

            bf.merge_segments(request.POST['segment_list'].split(';'))
            bf.save(project.get_target_dir())

            return JsonResponse({'status': 'success'})

        elif request.POST.get('task') == 'resolve_comment':
            bf.resolve_comment(request.POST['segment'],
                               request.POST['comment'],
                               request.POST['author'])
            bf.save(project.get_target_dir())

            return JsonResponse({'status': 'success'})

        elif request.POST.get('task') == 'resolve_lqi':
            bf.resolve_loc_quality_issue(request.POST['segment'],
                                         request.POST['comment'],
                                         request.POST['author'])
            bf.save(project.get_target_dir())

            return JsonResponse({'status': 'success'})

        else:
            editor_mode = request.POST['editor_mode']
            segment_state = request.POST['segment_state']
            source_segment = request.POST['source_segment']
            target_segment = request.POST['target_segment']
            author_id = request.POST['author_id']

            if editor_mode == 'review' and segment_state == 'translated':
                if float(bf.xliff_version) > 2.0:
                    segment_state = 'reviewed'
                else:
                    segment_state = 'signed-off'

            bf.update_segment(target_segment,
                              request.POST['paragraph_no'],
                              request.POST.get('segment_no'),
                              segment_state,
                              author_id)
            bf.save(project.get_target_dir())

            if segment_state == 'translated':
                source_entry, tags = KDB.segment_to_entry(etree.fromstring(source_segment), {})
                target_entry, _ = KDB.segment_to_entry(etree.fromstring(target_segment), tags)
                for project_tm in project.language_resources.all().filter(role='tm'):
                    kdb = KDB(project_tm.path,
                              project.source_language,
                              project.target_language)

                    kdb.submit_entry(source_entry,
                                     target_entry,
                                     author_id)
                if project_mysql != {}:
                    cloud_db = mysql.connector.connect(user=project_mysql['user'],
                                                       password=project_mysql['password'],
                                                       database=project_mysql['database'],
                                                       host=project_mysql['host'])

                    cur = cloud_db.cursor()

                    cur.execute('''SELECT * FROM `kaplan_entries`
                                WHERE `src_lang` = '{0}'
                                    AND `source` = '{1}'
                                    AND `trg_lang` = '{2}'
                                    AND `table_i` = {3};'''.format(project.source_language,
                                                                   source_entry.replace("'", "\'"),
                                                                   project.target_language,
                                                                   project_mysql['table']))

                    rows = cur.fetchall()

                    if len(rows) > 0:
                        for row in rows:
                            cur.execute('''UPDATE `kaplan_entries` SET `target` = '{0}'
                                        WHERE `kaplan_entries`.`id` = {1}'''.format(target_entry.replace("'", "\'"),
                                                                                    row[-1]))

                    else:
                        cur.execute('''INSERT INTO `kaplan_entries` (`src_lang`, `source`, `trg_lang`, `target`, `table_i`, `id`)
                                     VALUES ('{0}', '{1}', '{2}', '{3}', '{4}', NULL);'''.format(project.source_language,
                                                                                                source_entry.replace("'", "\'"),
                                                                                                project.target_language,
                                                                                                target_entry.replace("'", "\'"),
                                                                                                project_mysql['table']))

            return JsonResponse({'status': 'success'})

    elif request.GET.get('task') == 'lookup':
        source_segment = request.GET['source_segment']

        tm_hits = []
        for project_tm in project.language_resources.all().filter(role='tm'):
            project_tm = KDB(project_tm.path,
                             project.source_language,
                             project.target_language)

            for tm_result in project_tm.lookup_segment(source_segment):
                tm_result = (int(tm_result[0]*100),
                             etree.tostring(tm_result[1], encoding='UTF-8').decode(),
                             etree.tostring(tm_result[2], encoding='UTF-8').decode(),
                             etree.tostring(tm_result[3], encoding='UTF-8').decode(),
                             'Local TM')

                if tm_result not in tm_hits:
                    tm_hits.append(tm_result)

        if project_mysql != {}:
            cloud_db = mysql.connector.connect(user=project_mysql['user'],
                                               password=project_mysql['password'],
                                               database=project_mysql['database'],
                                               host=project_mysql['host'])

            cur = cloud_db.cursor()

            cur.execute('''SELECT `source`, `target`
                        FROM `kaplan_entries`
                        WHERE `src_lang` = '{0}'
                            AND `trg_lang` = '{1}'
                            AND `table_i` = {2};'''.format(project.source_language,
                                                           project.target_language,
                                                           project_mysql['table']))

            source_entry, tags = KDB.segment_to_entry(etree.fromstring(source_segment), {})

            sm = difflib.SequenceMatcher()
            sm.set_seq1(source_entry)

            for row in cur.fetchall():
                sm.set_seq2(row[0])
                if sm.ratio() >= 0.5:
                    tm_result = (int(sm.ratio()*100),
                                 '<difference>' + row[0] + '</difference>',
                                 '<source>' + row[0] + '</source>',
                                 '<target>' + row[1] + '</target>',
                                 'TM Server')

                    if tm_result not in tm_hits:
                        tm_hits.append(tm_result)

        tm_hits.sort(reverse=True)

        for i in range(len(tm_hits)):
            tm_hits[i] = {'ratio': tm_hits[i][0],
                          'difference': tm_hits[i][1],
                          'source': tm_hits[i][2],
                          'target': tm_hits[i][3],
                          'origin': tm_hits[i][4]}

        tb_hits = []
        for project_tb in project.language_resources.all().filter(role='tb'):
            project_tb = KDB(project_tb.path,
                             project.source_language,
                             project.target_language)

            for tb_result in project_tb.lookup_terms(etree.fromstring(source_segment)):
                tb_result = {'ratio': int(tb_result[0]*100),
                             'source': tb_result[1],
                             'target': tb_result[2],
                             'origin': 'Local TB'}

                if tb_result not in tb_hits:
                    tb_hits.append(tb_result)

        return JsonResponse({'tm':tm_hits, 'tb':tb_hits})

    else:
        translation_units = bf.get_translation_units()

        for tu in translation_units:
            for segment in tu:
                segment_notes = []
                if isinstance(bf, KXLIFF):
                    for segment_lqi in bf.get_segment_lqi(segment.attrib.get('id', 0)):
                        if segment_lqi.attrib.get('resolved'):
                            continue
                        lqi_comment = segment_lqi.attrib.get('comment')
                        if lqi_comment is None:
                            lqi_comment == ''
                        segment_lqi.tag = 'lqi'
                        segment_lqi.text = lqi_comment
                        segment_notes.append((datetime.fromisoformat(segment_lqi.attrib['added_at']), segment_lqi))
                for child in segment:
                    if child.tag == 'notes':
                        for segment_note in child:
                            segment_notes.append((datetime.fromisoformat(segment_note.attrib['added_at']), segment_note))
                        segment.remove(child)

                if len(segment_notes) > 0:
                    sorted(segment_notes)
                    notes = etree.Element('notes')
                    for datetime_iso, segment_note in segment_notes:
                        notes.append(segment_note)
                    segment.append(notes)

        return HttpResponse(etree.tostring(translation_units, encoding="UTF-8"))

@csrf_exempt
def project_view(request, project_id):
    project = Project.objects.get(id=project_id)

    if request.method == 'POST':
        if request.POST.get('task') == 'analyze_files':
            kaplan_project = KaplanProject(project.get_project_metadata())
            kaplan_project_report = kaplan_project.analyze()
            project_report = ProjectReport()
            project_report.content = json.dumps(kaplan_project_report)
            project_report.project = project
            project_report.save()

            return JsonResponse({project_report.id: {'timestamp': project_report.created_at.isoformat(),
                                                     'json': project_report.content}})
        elif request.POST.get('task') == 'create_new_project_package':
            path = request.POST['project_package']
            files = request.POST.get('files', '').split(';')
            if files == ['']:
                raise ValueError('No files selected.')

            KaplanProject(project.get_project_metadata()).export(path,
                                                                 files,
                                                                 task=request.POST['linguist_task'])

            project.is_exported = True
            project.save()

            return JsonResponse({'message': 'Project package created.'})
        elif request.POST.get('task') == 'create_return_project_package':

            KaplanProject(project.get_project_metadata()).export(request.POST['project_package'],
                                                                 request.POST['files'].split(';'),
                                                                 False)

            return JsonResponse({'message': 'Project package created.'})
        elif request.POST.get('task') == 'update_from_project_package':

            KaplanProject.extract_target_files(request.POST['project_package'],
                                               project.directory,
                                               request.POST['files'].split(';'))

            return JsonResponse({'message': 'Target files updated.'})
    else:
        if request.GET.get('task') == 'get_manifest':
            return JsonResponse(project.get_project_metadata())
        else:
            files_dict = {}
            reports_dict = {}

            for project_file in File.objects.filter(project=project):
                filename = project_file.title + '.kxliff' if project_file.is_kxliff else project_file.title
                files_dict[project_file.id] = {'title':project_file.title,
                                               'path':os.path.join(project.get_target_dir(), filename),
                                               'can_generate_target_file':project_file.is_kxliff}

            for project_report in ProjectReport.objects.filter(project=project):
                reports_dict[project_report.id] = {'timestamp': project_report.created_at.isoformat(),
                                                   'json': project_report.content}

            return JsonResponse({'files':files_dict, 'reports':reports_dict})

def kdb_directory(request):
    kdbs = KaplanDatabase.objects.filter(is_project_specific=False)
    if request.GET.get('source_language') and request.GET.get('target_language'):
        kdbs = kdbs.filter(source_language=request.GET['source_language'],
                                               target_language=request.GET['target_language'],
                                               is_project_specific=False)
    if request.GET.get('role'):
        kdbs = kdbs.filter(role=request.GET['role'])

    kdbs_dict = {}
    for kdb in kdbs:
        kdb_dict = {
            'id': kdb.id,
            'title': kdb.title,
            'source_language': kdb.get_source_language(),
            'target_language': kdb.get_target_language(),
            'path': kdb.path,
            'is_outdated': KDB(kdb.path).is_outdated
        }
        kdbs_dict[kdb.id] = kdb_dict

    return JsonResponse(kdbs_dict)

@csrf_exempt
def kdb_view(request, kdb_id):
    if request.GET.get('role'):
        kdb = KaplanDatabase.objects.filter(role=request.GET['role']).get(id=kdb_id)
    else:
        kdb = KaplanDatabase.objects.get(id=kdb_id)

    kdb = KDB(kdb.path)

    if request.method == 'POST':
        if request.POST.get('task') == 'import':
            file_path = request.POST['path']
            file_type = request.POST['file_type']

            if file_type == 'csv':
                kdb.import_csv(file_path)

                return JsonResponse({'status': 'success'})

            elif file_type == 'xliff':
                kdb.import_xliff(file_path)

                return JsonResponse({'status': 'success'})

            else:
                raise TypeError('File type not supported for import.')
        elif request.POST.get('task') == 'upgrade':
            kdb.upgrade()

            return JsonResponse({'status': 'success'})

    else:
        if request.GET.get('task') == 'export':
            kdb.export_xliff(request.GET['path'])

            return JsonResponse({'status': 'success'})
        else:
            kdb_entries = {}
            kdb_entry_i = 0
            for kdb_entry in kdb.get_entries():
                source = KDB.entry_to_segment(kdb_entry[1], 'source', safe_mode=False)
                for child in source:
                    if child.attrib.get('equiv'):
                        child.text = html.unescape(child.attrib.get('equiv'))
                target = KDB.entry_to_segment(kdb_entry[2], 'target', safe_mode=False)
                for child in target:
                    if child.attrib.get('equiv'):
                        child.text = html.unescape(child.attrib.get('equiv'))
                kdb_entries[kdb_entry_i] = {
                    'id': kdb_entry[0],
                    'source': etree.tostring(source, encoding='UTF-8').decode(),
                    'target': etree.tostring(target, encoding='UTF-8').decode(),
                    'state': kdb_entry[3],
                    'time': kdb_entry[4],
                    'submitted_by': kdb_entry[5]
                }
                kdb_entry_i += 1

            return JsonResponse(kdb_entries)

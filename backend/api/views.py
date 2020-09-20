from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .models import File, Project, TranslationMemory

from kaplan.kxliff import KXLIFF
from kaplan.translationmemory import TranslationMemory as TM
from kaplan.utils import create_new_project_package, create_return_project_package, html_to_segment, open_new_project_package, segment_to_html, supported_file_formats

from lxml import etree

from io import BytesIO
import os
import zipfile

# Create your views here.

@csrf_exempt
def import_project(request):
    path_to_package = request.POST['path']
    project_dir = request.POST['directory']

    if os.path.isfile(project_dir) or (os.path.isdir(project_dir) and len(os.listdir(project_dir))>0):
        return JsonResponse({'error': 'Project directory must be an empty folder!'}, status=500)

    project_metadata = open_new_project_package(path_to_package, project_dir)

    imported_project = Project()
    imported_project.title = project_metadata['title']
    imported_project.directory = project_dir
    imported_project.source_language = project_metadata['src']
    imported_project.target_language = project_metadata['trgt']
    imported_project.is_imported = True
    imported_project.save()

    for filename in project_metadata['files']:
        imported_file = File()
        imported_file.title = filename
        imported_file.project = imported_project
        imported_file.save()

    return JsonResponse({imported_project.id: {'title': imported_project.title,
                                               'source_language': imported_project.get_source_language(),
                                               'target_language': imported_project.get_target_language()}})

@csrf_exempt
def new_project(request):
    project_title = request.POST['title']
    project_dir = request.POST['directory']
    project_source = request.POST['source_language']
    project_target = request.POST['target_language']
    project_tms = [TranslationMemory.objects.get(id=int(tm_id)) for tm_id in request.POST['translation_memories'].split(';') if tm_id]
    project_files = [project_file for project_file in request.POST.get('files').split(';') if KXLIFF.can_process(project_file)]

    if len(project_files) == 0:
        return JsonResponse({'error': 'No compatible files selected!'}, status=500)

    if not os.path.exists(project_dir):
        os.makedirs(project_dir)
    elif len(os.listdir(project_dir)) > 0:
        return JsonResponse({'error': 'Dir not empty!'}, status=500)

    project = Project()
    project.title = project_title
    project.directory = project_dir
    project.source_language = project_source
    project.target_language = project_target
    project.save()
    for project_tm in project_tms:
        project.translation_memories.add(project_tm)
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
        new_file.is_kxliff = not file_title.lower().endswith(('.xliff', '.sdlxliff'))
        new_file.save()

        with open(project_file, 'rb') as infile:
            with open(os.path.join(source_dir, file_title), 'wb') as outfile:
                for line in infile:
                    outfile.write(line)

        kxliff = KXLIFF.new(os.path.join(source_dir, file_title), project_source)
        kxliff.save(source_dir)
        kxliff.save(target_dir)

    return JsonResponse({'status': 'success'})

@csrf_exempt
def new_tm(request):
    tm_title = request.POST['title']
    tm_path = request.POST['path']
    tm_source_language = request.POST['source_language']
    tm_target_language = request.POST['target_language']

    tm = TranslationMemory()
    tm.title = tm_title
    tm.path = tm_path
    tm.source_language = tm_source_language
    tm.target_language = tm_target_language

    TM.new(tm.path,
       tm.source_language,
       tm.target_language)

    tm.save()

    return JsonResponse({'status': 'success'})

@csrf_exempt
def package(request):
    path_to_package = request.POST['path_to_package']

    with zipfile.ZipFile(path_to_package) as return_project_package:
        metadata_xml = etree.parse(BytesIO(return_project_package.open('project.xml').read())).getroot()

    files_to_unpack = []

    for file_to_unpack in metadata_xml[-1]:
        files_to_unpack.append(file_to_unpack.text)

    return JsonResponse({'files_to_unpack': files_to_unpack})

def project_directory(request):
    projects_dict = {}

    for project in Project.objects.all():
        projects_dict[project.id] = {'title': project.title,
                                    'source_language': project.get_source_language(),
                                    'source_language_code': project.source_language,
                                    'target_language': project.get_target_language(),
                                    'target_language_code': project.target_language,
                                    'is_exported': project.is_exported,
                                    'is_imported': project.is_imported}

    return JsonResponse(projects_dict)

@csrf_exempt
def project_file(request, project_id, file_id):
    project = Project.objects.get(id=project_id)
    project_file = File.objects.filter(project=project)
    project_file = project_file.get(id=file_id)

    filename = project_file.title + '.kxliff' if project_file.is_kxliff else project_file.title
    kxliff = KXLIFF(os.path.join(project.get_target_dir(), filename))

    if request.method == 'POST':
        if request.POST.get('task') == 'generate_target_translation':
            kxliff.generate_target_translation(project.get_target_dir())

            return JsonResponse({'status': 'success'})

        elif request.POST.get('task') == 'merge_segments':

            return JsonResponse({'status': 'failed'},
                                {'message': 'Feature temporarily unavailable.'})

        else:
            segment_state = request.POST['segment_state']
            target_segment = request.POST['target_segment']
            author_id = request.POST['author_id']

            kxliff.update_segment(segment_state,
                                 target_segment,
                                 request.POST['paragraph_no'],
                                 request.POST['segment_no'])
            kxliff.save(project.get_target_dir())

            if segment_state == 'translated':
                for project_tm in project.translation_memories.all():
                    project_tm = TM(project_tm.path,
                                project.source_language,
                                project.target_language)

                    project_tm.submit_segment(source_segment,
                                              target_segment,
                                              author_id)

            return JsonResponse({'status': 'success'})

    elif request.GET.get('task') == 'lookup':
        source_segment = html_to_segment(request.GET['source_segment'], 'source')

        tm_hits = []
        for project_tm in project.translation_memories.all():
            project_tm = TM(project_tm.path,
                         project.source_language,
                         project.target_language)

            for tm_result in project_tm.lookup(source_segment):
                tm_result = {'ratio': int(tm_result[0]*100),
                             'source': segment_to_html(tm_result[1]),
                             'target': segment_to_html(tm_result[2])}

                if tm_result not in tm_hits:
                    tm_hits.append(tm_result)

        tm_hits_dict = {}
        for tm_hit in tm_hits:
            tm_hits_dict[tm_hit['ratio']] = tm_hit

        return JsonResponse(tm_hits_dict)

    else:
        return HttpResponse(etree.tostring(kxliff.translation_units, encoding="UTF-8"))

@csrf_exempt
def project_view(request, project_id):
    project = Project.objects.get(id=project_id)

    if request.method == 'POST':
        if request.POST.get('task') == 'create_new_project_package':
            files_to_package = request.POST['files_to_package'].split(';')

            for i in range(len(files_to_package)):
                file_to_package = files_to_package[i]
                files_to_package[i] = (
                    os.path.join(project.get_source_dir(), file_to_package),
                    os.path.join(project.get_source_dir(), file_to_package) + '.xml',
                    os.path.join(project.get_target_dir(), file_to_package) + '.xml'
                )

            create_new_project_package(project.get_project_metadata(),
                                       files_to_package,
                                       os.path.join(project.directory, 'packages'))

            project.is_exported = true
            project.save()

            return JsonResponse({'status': 'success'})
        elif request.POST.get('task') == 'create_return_project_package':
            files_to_package = request.POST['files_to_package'].split(';')

            for i in range(len(files_to_package)):
                files_to_package[i] = os.path.join(project.get_target_dir(), files_to_package[i]) + '.xml'

            create_return_project_package(project.get_project_metadata(),
                                          files_to_package,
                                          os.path.join(project.directory, 'packages'))

            return JsonResponse({'status': 'success'})
        elif request.POST.get('task') == 'update_from_krpp':
            path_to_krpp = request.POST['path_to_krpp']
            files_to_unpack = request.POST['files_to_package'].split(';')

            with zipfile.ZipFile(path_to_krpp) as krpp:
                for file_to_unpack in files_to_unpack:
                    BilingualFile(os.path.join(project.get_target_dir(), file_to_unpack))
                    krpp.extract(os.path.join(os.path.basename(project.get_target_dir()), file_to_unpack),
                                 project.directory)

            return JsonResponse({'status': 'success'})
    else:
        files_dict = {}

        for project_file in File.objects.filter(project=project):
            files_dict[project_file.id] = {'title':project_file.title}

        return JsonResponse(files_dict)

def tm_directory(request):
    if request.GET.get('source_language') and request.GET.get('target_language'):
        tms = TranslationMemory.objects.filter(source_language=request.GET['source_language'],
                                               target_language=request.GET['target_language'])
    else:
        tms = TranslationMemory.objects.all()

    tms_dict = {}
    for tm in tms:
        tm_dict = {
            'id': tm.id,
            'title': tm.title,
            'source_language': tm.get_source_language(),
            'target_language': tm.get_target_language()
        }
        tms_dict[tm.title] = tm_dict

    return JsonResponse(tms_dict)

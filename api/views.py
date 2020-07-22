from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .models import File, Project, TranslationMemory

from kaplan.bilingualfile import BilingualFile
from kaplan.sourcefile import SourceFile
from kaplan.translationmemory import TranslationMemory as TM
from kaplan.utils import create_new_project_package, html_to_segment, open_new_project_package, segment_to_html, supported_file_formats

import os

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
    project_files = [project_file for project_file in request.POST.get('files').split(';') if project_file.endswith(supported_file_formats)]

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
        new_file.save()

        with open(project_file, 'rb') as infile:
            with open(os.path.join(source_dir, file_title), 'wb') as outfile:
                for line in infile:
                    outfile.write(line)

        sf = SourceFile(os.path.join(source_dir, file_title))
        sf.write_bilingual_file(source_dir)
        sf.write_bilingual_file(target_dir)

    return HttpResponse('Tamam')

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

    return HttpResponse("Success!")

def project_directory(request):
    projects_dict = {}

    for project in Project.objects.all():
        projects_dict[project.id] = {'title': project.title,
                                    'source_language': project.get_source_language(),
                                    'target_language': project.get_target_language(),
                                    'is_imported': project.is_imported}

    return JsonResponse(projects_dict)

@csrf_exempt
def project_file(request, project_id, file_id):
    project = Project.objects.get(id=project_id)
    project_file = File.objects.filter(project=project)
    project_file = project_file.get(id=file_id)

    bf = BilingualFile(os.path.join(project.directory, project.target_language, (project_file.title + '.xml')))

    if request.method == 'POST':
        if request.POST.get('task') == 'generate_target_translation':
            bf.generate_target_translation(os.path.join(project.get_source_dir(), project_file.title),
                                                        project.get_target_dir())

            return HttpResponse("Success!")

        elif request.POST.get('task') == 'merge_segments':
            bf.merge_segments(request.POST['segment_list'].split(';'))
            bf.save(project.get_target_dir())

            return HttpResponse("Success!")

        else:
            segment_status = request.POST['segment_status']
            source_segment = html_to_segment(request.POST['source_segment'], 'source')
            target_segment = html_to_segment(request.POST['target_segment'], 'target')
            author_id = request.POST['author_id']

            bf.update_segment(segment_status,
                            target_segment,
                            int(request.POST['paragraph_no']),
                            int(request.POST['segment_no']),
                            request.POST['author_id'])
            bf.save(project.get_target_dir())

            if segment_status == 'translated':
                for project_tm in project.translation_memories.all():
                    project_tm = TM(project_tm.path,
                                project.source_language,
                                project.target_language)

                    project_tm.submit_segment(source_segment,
                                              target_segment,
                                              author_id)

            return HttpResponse("Success!")

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
        segments = {}
        for paragraph in bf.paragraphs:
            for segment in paragraph:
                current_segment = {}
                current_segment['source'] = segment_to_html(segment[0])
                current_segment['status'] = segment[1].text
                current_segment['target'] = segment_to_html(segment[2])
                current_segment['paragraph'] = segment[-2]
                segments[segment[-1]] = current_segment

        return JsonResponse(segments)

@csrf_exempt
def project_view(request, project_id):
    project = Project.objects.get(id=project_id)

    if request.method == 'POST':
        files_to_package = request.POST['files_to_package'].split(';')

        for i in range(len(files_to_package)):
            file_to_package = files_to_package[i]
            files_to_package[i] = (
                os.path.join(project.get_source_dir(), file_to_package),
                os.path.join(project.get_source_dir(), file_to_package) + '.xml',
                os.path.join(project.get_target_dir(), file_to_package) + '.xml'
            )
        if request.POST.get('task') == 'create_new_project_package':
            create_new_project_package(project.get_project_metadata(),
                                       files_to_package,
                                       os.path.join(project.directory, 'packages'))

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

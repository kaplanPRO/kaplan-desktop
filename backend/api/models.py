from django.db import models

from kaplan.language_codes import language_codes

LANGUAGES = dict((code, language) for language, code in language_codes)

import os
# Create your models here.

class File(models.Model):
    title = models.CharField(max_length=60)
    project = models.ForeignKey('Project', on_delete=models.CASCADE)
    is_kxliff = models.BooleanField(default=False)


class Project(models.Model):
    title = models.CharField(max_length=60)
    directory = models.TextField()
    source_language = models.CharField(max_length=20)
    target_language = models.CharField(max_length=20)
    translation_memories = models.ManyToManyField('TranslationMemory', blank=True)
    is_exported = models.BooleanField(default=False)
    is_imported = models.BooleanField(default=False)

    def get_project_metadata(self):
        project_metadata = {
            'title': self.title,
            'directory': self.directory,
            'source_language': self.source_language,
            'target_language': self.target_language
        }

        project_metadata['files'] = {}
        for project_file in File.objects.filter(project=self):
            file_dict = {}
            if project_file.is_kxliff:
                file_dict['source'] = os.path.join(self.get_source_dir(), project_file.title)
                file_dict['originalBF'] = file_dict['source'] + '.kxliff'
                file_dict['targetBF'] = os.path.join(self.get_target_dir(), project_file.title) + '.kxliff'
            else:
                file_dict['originalBF'] = os.path.join(self.get_source_dir(), project_file.title)
                file_dict['targetBF'] = os.path.join(self.get_target_dir(), project_file.title)

            project_metadata['files'][str(len(project_metadata['files']))] = file_dict

        if self.translation_memories.count() > 0:
            project_metadata['translation_memories'] = {}
            for project_tm in self.translation_memories.all():
                project_metadata['translation_memories'][len(project_metadata['translation_memories'])] = project_tm.path

        return project_metadata

    def get_source_dir(self):
        return os.path.join(self.directory, self.source_language)

    def get_source_language(self):
        return LANGUAGES.get(self.source_language, 'N/A')

    def get_target_dir(self):
        return os.path.join(self.directory, self.target_language)

    def get_target_language(self):
        return LANGUAGES.get(self.target_language, 'N/A')


class TranslationMemory(models.Model):
    title = models.CharField(max_length=60)
    path = models.TextField()
    source_language = models.CharField(max_length=20)
    target_language = models.CharField(max_length=20)
    is_project_specific = models.BooleanField(default=False)

    def get_source_language(self):
        return LANGUAGES.get(self.source_language, 'N/A')

    def get_target_language(self):
        return LANGUAGES.get(self.target_language, 'N/A')

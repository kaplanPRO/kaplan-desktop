from django.db import models

import json
import os
# Create your models here.

class LanguageProfile(models.Model):
    TEXT_DIRECTION_CHOICES = [
        ('ltr', 'Left to Right'),
        ('rtl', 'Right to Left')
    ]

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=60)
    direction = models.CharField(max_length=3, choices=TEXT_DIRECTION_CHOICES, default='ltr')

    class Meta:
        ordering = ['name']

    @staticmethod
    def get_language_direction(language_code):
        try:
            return LanguageProfile.objects.get(code=language_code).direction
        except:
            return 'ltr'

    @staticmethod
    def get_language_name(language_code):
        try:
            return LanguageProfile.objects.get(code=language_code).name
        except:
            return 'N/A'


class File(models.Model):
    title = models.CharField(max_length=60)
    project = models.ForeignKey('Project', on_delete=models.CASCADE)
    is_kxliff = models.BooleanField(default=False)


class KaplanDatabase(models.Model):
    title = models.CharField(max_length=60)
    path = models.TextField()
    source_language = models.CharField(max_length=20)
    target_language = models.CharField(max_length=20)
    is_project_specific = models.BooleanField(default=False)
    role = models.CharField(max_length=2, choices=(('tm', 'Translation Memory'), ('tb', 'Termbase')))

    def get_source_language(self):
        return LanguageProfile.get_language_name(self.source_language)

    def get_target_language(self):
        return LanguageProfile.get_language_name(self.target_language)


class ProjectReport(models.Model):
    content = models.TextField(default='{}')
    created_at = models.DateTimeField(auto_now_add=True)
    project = models.ForeignKey('Project', on_delete=models.CASCADE)


class Project(models.Model):
    TEXT_DIRECTION_CHOICES = [
        ('ltr', 'Left to Right'),
        ('rtl', 'Right to Left')
    ]

    title = models.CharField(max_length=60)
    directory = models.TextField()
    source_language = models.CharField(max_length=20)
    target_language = models.CharField(max_length=20)
    language_resources = models.ManyToManyField('KaplanDatabase', blank=True)
    is_exported = models.BooleanField(default=False)
    is_imported = models.BooleanField(default=False)
    task = models.CharField(max_length=10, blank=True, null=True)
    due_datetime = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    source_language_name = models.CharField(max_length=60, blank=True, null=True)
    source_direction = models.CharField(max_length=3, choices=TEXT_DIRECTION_CHOICES, blank=True, null=True)
    target_language_name = models.CharField(max_length=60, blank=True, null=True)
    target_direction = models.CharField(max_length=3, choices=TEXT_DIRECTION_CHOICES, blank=True, null=True)
    miscellaneous = models.TextField(default='{}')

    def get_project_metadata(self):
        project_metadata = {
            'title': self.title,
            'directory': self.directory,
            'source_language': self.source_language,
            'source_language_name': self.get_source_language(),
            'source_language_direction': self.get_source_direction(),
            'target_language': self.target_language,
            'target_language_name': self.get_target_language(),
            'target_language_direction': self.get_target_direction()
        }

        project_metadata['files'] = {}
        for project_file in File.objects.filter(project=self):
            file_dict = {}
            file_dict['name'] = project_file.title
            if project_file.is_kxliff:
                file_dict['source'] = os.path.join(self.get_source_dir(), project_file.title)
                file_dict['originalBF'] = file_dict['source'] + '.kxliff'
                file_dict['targetBF'] = os.path.join(self.get_target_dir(), project_file.title) + '.kxliff'
            else:
                file_dict['originalBF'] = os.path.join(self.get_source_dir(), project_file.title)
                file_dict['targetBF'] = os.path.join(self.get_target_dir(), project_file.title)

            project_metadata['files'][str(len(project_metadata['files']))] = file_dict

        if self.language_resources.count() > 0:
            translation_memories = {}
            termbases = {}
            for project_tm in self.language_resources.all():
                if project_tm.role == 'tm':
                    translation_memories[len(translation_memories)] = project_tm.path
                elif project_tm.role == 'tb':
                    termbases[len(termbases)] = project_tm.path

            if translation_memories != {}:
                project_metadata['translation_memories'] = translation_memories

            if termbases != {}:
                project_metadata['termbases'] = termbases

        project_reports = ProjectReport.objects.filter(project=self)
        if len(project_reports) > 0:
            reports = {}
            for project_report in project_reports:
                reports[len(reports)+1] = {'created_at': project_report.created_at.isoformat(),
                                           'json': json.loads(project_report.content)}

            project_metadata['reports'] = reports

        if self.due_datetime:
            project_metadata['due_datetime'] = self.due_datetime.isoformat()

        return project_metadata

    def get_source_dir(self):
        return os.path.join(self.directory, self.source_language)

    def get_source_language(self):
        if self.source_language_name:
            return self.source_language_name
        else:
            return LanguageProfile.get_language_name(self.source_language)

    def get_target_dir(self):
        return os.path.join(self.directory, self.target_language)

    def get_target_language(self):
        if self.target_language_name:
            return self.target_language_name
        else:
            return LanguageProfile.get_language_name(self.target_language)

    def get_source_direction(self):
        if self.source_direction:
            return self.source_direction
        else:
            return LanguageProfile.get_language_direction(self.source_language)

    def get_target_direction(self):
        if self.target_direction:
            return self.target_direction
        else:
            return LanguageProfile.get_language_direction(self.target_language)

    def get_relevant_kdbs(self):
        project_kdbs = self.language_resources.all()
        relevant_kdbs_dict = {'tm':{}, 'tb':{}}
        for relevant_kdb in KaplanDatabase.objects \
                            .filter(source_language=self.source_language) \
                            .filter(target_language=self.target_language):

            relevant_kdb_dict = {
                'name': relevant_kdb.title,
                'selected': relevant_kdb in project_kdbs
            }

            relevant_kdbs_dict[relevant_kdb.role][relevant_kdb.id] = relevant_kdb_dict

        return relevant_kdbs_dict

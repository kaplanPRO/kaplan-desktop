from django.db import models

from kaplan.language_codes import language_codes

LANGUAGES = dict((code, language) for language, code in language_codes)

import os
# Create your models here.

class File(models.Model):
    title = models.CharField(max_length=60)
    project = models.ForeignKey('Project', on_delete=models.CASCADE)


class Project(models.Model):
    title = models.CharField(max_length=60)
    directory = models.TextField()
    source_language = models.CharField(max_length=20)
    target_language = models.CharField(max_length=20)
    translation_memories = models.ManyToManyField('TranslationMemory')

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

    def get_source_language(self):
        return LANGUAGES.get(self.source_language, 'N/A')

    def get_target_language(self):
        return LANGUAGES.get(self.target_language, 'N/A')

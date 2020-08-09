from django.contrib import admin

from .models import File, Project, TranslationMemory

# Register your models here.

admin.site.register(File)

admin.site.register(Project)

admin.site.register(TranslationMemory)
from django.contrib import admin

from .models import File, LanguageProfile, KaplanDatabase, Project, ProjectReport

# Register your models here.

admin.site.register(File)

admin.site.register(LanguageProfile)

admin.site.register(KaplanDatabase)

admin.site.register(Project)

admin.site.register(ProjectReport)

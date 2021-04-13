from django.urls import path

from . import views

urlpatterns = [
    path('', views.project_directory, name='project_directory'),
    path('package', views.package, name='package'),
    path('project/<int:project_id>', views.project_view, name='project_view'),
    path('project/<int:project_id>/file/<int:file_id>', views.project_file, name='project_file'),
    path('project/new', views.new_project, name='new_project'),
    path('project/import', views.import_project, name='import_project'),
    path('kdb', views.kdb_directory, name='kdb_directory'),
    path('kdb/new', views.new_kdb, name='new_kdb'),
    path('kdb/<int:kdb_id>', views.kdb_view, name='kdb_view'),
    path('languages', views.languages, name='languages')
]

from django.urls import path

from . import views

urlpatterns = [
    path('', views.project_directory, name='project_directory'),
    path('project/<int:project_id>', views.project_view, name='project_view'),
    path('project/<int:project_id>/file/<int:file_id>', views.project_file, name='project_file'),
    path('project/new', views.new_project, name='new_project'),
    path('project/import', views.import_project, name='import_project'),
    path('tms', views.tm_directory, name='tm_directory'),
    path('tm/new', views.new_tm, name='new_tm'),
]
# Generated by Django 3.2 on 2021-04-08 12:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_project_notes'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='due_datetime',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

# Generated by Django 2.2.19 on 2021-03-07 11:54

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='KaplanDatabase',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=60)),
                ('path', models.TextField()),
                ('source_language', models.CharField(max_length=20)),
                ('target_language', models.CharField(max_length=20)),
                ('is_project_specific', models.BooleanField(default=False)),
                ('role', models.CharField(choices=[('tm', 'Translation Memory'), ('tb', 'Termbase')], max_length=2)),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=60)),
                ('directory', models.TextField()),
                ('source_language', models.CharField(max_length=20)),
                ('target_language', models.CharField(max_length=20)),
                ('is_exported', models.BooleanField(default=False)),
                ('is_imported', models.BooleanField(default=False)),
                ('miscellaneous', models.TextField(default='{}')),
                ('language_resources', models.ManyToManyField(blank=True, to='api.KaplanDatabase')),
            ],
        ),
        migrations.CreateModel(
            name='ProjectReport',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(default='{}')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.Project')),
            ],
        ),
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=60)),
                ('is_kxliff', models.BooleanField(default=False)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.Project')),
            ],
        ),
    ]

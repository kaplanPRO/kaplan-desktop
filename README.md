# Kaplan Desktop
1. Introduction
2. Installation
3. Links

## Introduction

Hello. Welcome to the source repo for Kaplan Desktop. It’s been in the works for quite some time and it is exciting to go out and show it to fellow linguists. Please do not hesitate to reach out to contact@kaplan.pro should you have any inquiries.

The documentation for the app itself is available [here](https://kaplan.pro/#/docs).

## Installation
There are a few options:
1. Microsoft Store
2. .exe, .deb, and .rpm releases
3. Building from source (for advanced users)

#### Microsoft Store
The Microsoft Store page for Kaplan Desktop is located [here](https://www.microsoft.com/en-us/p/kaplan-desktop/9nb1v5xzbmx2).

#### .exe, .deb, and .rpm
The releases are available [here](https://github.com/kaplanPRO/kaplan-desktop/releases/latest).

**NB:** Ubuntu users may experience a bug where they cannot run the .deb file, unless they save it in a directory other than the default download directory.

#### Building from source

This is by far the most efficient method and the steps are more or less the same for all operating systems.

1. Install Python 3, if it’s not installed on your computer.

2. Get the source code from the repo.

3. Navigate to /backend/ and create a Python 3 virtual environment.

4. Activate the virtual environment.

5. Update pip and install the required Python libraries:

  > pip install --upgrade pip
  >
  > pip install -r requirements.txt
  >
  > pip install pyinstaller

6. Create a .spec file for pyinstaller:

  > pyi-makespec --name=backend manage.py

7. Open the backend.spec file with a text editor and change two lines:

  > hiddenimports=['api.urls'],
  >
  > .
  >
  > .
  >
  > excludes=['db-sqlite3'],

8. We’re ready to have pyinstaller build the executable:

  > pyinstaller --clean --noconfirm backend.spec

  This will create a folder called “backend” under /backend/dist/ Move this folder to the /app/ directory.

9. Install yarn.

10. Navigate to /app/ and have yarn install the Nodejs libraries:

  > yarn install

11. (Windows-specific step) Remove the following line from package.json

  > "executableName": "kaplan-desktop",

12. Have yarn build the executable:

  > yarn make

13. The resulting executable(s) will be under /app/out/

## Links:
1. [Kaplan Homepage](https://kaplan.pro)
1. [Docs](https://kaplan.pro/#/docs)
1. [Kaplan Desktop@Microsoft Store](https://www.microsoft.com/en-us/p/kaplan-desktop/9nb1v5xzbmx2)

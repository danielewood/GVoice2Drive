# GVoice2Drive
 Google App Script that automatically downloads Google Voicemail Audio files and archives them to Google Drive

## Setup
1. Enable [Google Apps Script API](https://script.google.com/home/usersettings) in your account.
1. Clone this repo
    ```bash
    git clone https://github.com/danielewood/GVoice2Drive
    cd GVoice2Drive
    ```
1. Install Google clasp and login:
    ```bash
    npm install @google/clasp -g
    clasp login; # Use "--no-localhost" on a headless server
    ```
1. Create your App Script Project 
    ```bash
    clasp create --type webapp --title GVoice2Drive
    ```
1.  Push this repo's scripts into the newly created project
    ```bash
    clasp push --force
    └─ GVoice2Drive.js
    └─ appsscript.json
    Pushed 2 files.
    ```
1. Go to the edit URL from when you ran `clasp create` to run the app
1. Review and Accept the app permissions
1. If you want to change the timer behavior, go to `Edit --> Current Project's Triggers`
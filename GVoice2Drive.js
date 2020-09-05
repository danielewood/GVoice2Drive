function GVoice2Drive() {
    // User Adjustable Variables
    var fileNamePrefix = "Voicemail_";        // Prefix applies to all MP3 files
    var folder, folder_name = "Google Voice"; // Folder or path in Google Drive where MP3s are saved
    var archive, gmail_label = "GV2Drive";    // Gmail label applied to processed voicemails
    var enableDebugging = false;              // Enables extra logging info for debugging purposes

    // Function to set file modified date to custom value  
    function DriveAPI_setFileModifiedDate(newModifiedTime, fileId) {
        var url = "https://www.googleapis.com/drive/v3/files/" + fileId;
        var params = {
            method: "patch",
            headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
            payload: JSON.stringify({ modifiedTime: newModifiedTime }),
            contentType: "application/json",
        };
        UrlFetchApp.fetch(url, params);
    }

    // Create CRON trigger if none exists.
    if (ScriptApp.getProjectTriggers()[0] == null) {
        // Trigger every 5 minutes.
        let timerMinutes = 5;
        Logger.log('No Triggers found for this project, creating default %s minute timer.', timerMinutes);
        // If you change the function name from GVoice2Drive, change below to catch the trigger.
        ScriptApp.newTrigger('GVoice2Drive')
            .timeBased()
            .everyMinutes(timerMinutes)
            .create();
    }

    // Find unprocessed Google Voice messages in Gmail
    var filter = "from:voice-noreply@google.com -label:" + gmail_label;

    // Process up to 10 emails per call.
    var threads = GmailApp.search(filter, 0, 10);
    if (threads.length) {

        // Google Drive folder where the MP3 files will be saved
        let folders = DriveApp.getFoldersByName(folder_name);
        let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folder_name);

        /* Gmail Label that is applied to processed voice mails */
        archive = GmailApp.getUserLabelByName(gmail_label) ?
            GmailApp.getUserLabelByName(gmail_label) : GmailApp.createLabel(gmail_label);

        for (var x = 0; x < threads.length; x++) {

            var msg = threads[x].getMessages()[0];

            /* Find the link to play the voice mail message */
            regexp = /https\:\/\/www.google.com\/voice\/fm[^\"]*/;
            var url = msg.getBody().match(regexp);

            if (url) {
                Logger.log('URL: %s', url);
                Logger.log('SUBJ: %s', msg.getSubject());

                // Extract the name or number of the voice sender
                regexp = /new voicemail from (.*)/i;
                var subject = msg.getSubject().match(regexp);

                // Add the voice mail datetime to the file name
                var file_date = Utilities.formatDate(
                    msg.getDate(), Session.getScriptTimeZone(), "yyyyMMddHHmm");

                if (subject) {
                    // Strip non-alphanumerics
                    regexp = /[^0-9a-z]/gi;
                    let callerID = subject[1].replace(regexp, '');
                    Logger.log('CallerID: %s', callerID);


                    // Extract the audio url and save it to Drive
                    var mp3 = url[0].replace("/voice/fm/", "/voice/media/svm/");
                    var file = folder.createFile(UrlFetchApp.fetch(mp3).getBlob());

                    // Ignore "https://voice.google.com>", capture any text, ignore "play message\r\n\https://www.google.com/voice/fm"
                    regexp = /(?:\<https\:\/\/voice\.google\.com\>[\s]{2})([\s\S]*)(?:play\ message[\s]{1,2}\<https\:\/\/www\.google\.com\/voice\/fm\/)/;
                    let Transcript = msg.getPlainBody().match(regexp);
                    if (Transcript[1]) {
                        fileDescription = 'Transcript: ' + Transcript[1];
                        file.setName(fileNamePrefix + callerID + "_" + file_date + ".mp3");
                    } else {
                        file.setName(fileNamePrefix + callerID + "_" + file_date + "_NoTranscript.mp3");
                        fileDescription = 'Transcript: ' + Transcript[1];
                    }
                    // Save the voice mail transcript as the GDrive File Description.
                    file.setDescription(fileDescription);
                    Logger.log(fileDescription);

                    if (enableDebugging) {
                        Logger.log('Transcript: %s', Transcript);
                        Logger.log('Transcript.stringify: %s', JSON.stringify(Transcript));
                        Logger.log('Transcript[0]: %s', Transcript[0]);
                        Logger.log('Transcript[1].stringify: %s', JSON.stringify(Transcript[1]));
                        Logger.log('getPlainBody: %s', encodeURI(msg.getPlainBody()));
                        Logger.log('getPlainBody: %s', msg.getPlainBody());
                        Logger.log('getBody: %s', msg.getBody());
                        Logger.log('file.getName: %s', file.getName());
                        Logger.log('file.getId: %s', file.getId());
                    }
                    // Change the modified datetime to when the email arrived.
                    DriveAPI_setFileModifiedDate(msg.getDate(), file.getId());

                } else {
                    Logger.log('No Matching Subject.');
                }
            } else {
                Logger.log('No Matching URL found.');
            }
            // Only archive processed emails.
            threads[x].addLabel(archive);
        }
    } else {
        Logger.log('No New Voicemails found.');
    }
}
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

/*
 * Authorization information is stored in the file system, so the next 
 * time you run the sample code, you aren't prompted for authorization.
 */

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

const extract = require('./extract');
const update = require('./update');

function init() {
    readline.question("Would you like to clear the membership log [1] or update it [2]? ", response => {
        if(response == "1") {
            authorize().then(clearLog).catch(console.error);
        } else if(response == "2") {
            authorize().then(updateLog).catch(console.error);
        } else {
            console.log("Invalid response. Ending program.")
        }
        readline.close();
    });
}

// Update the AACC Membership Log
async function updateLog(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    extract.initialize(sheets, auth);
    update.initialize(sheets, auth);

    // Create the dictionary containing mappings for the values of each event
    let event_values = {};
    let events = await extract.getEventInfo(event_values);
    console.log("result: ");
    console.log(event_values);
    console.log(events);

    // Extract member information from the current membership log
    console.log();
    let members = {};
    let numExisting = await extract.getCurrentMembers(members);
    console.log("result: ");
    console.log(members);

    // Extract (more) membership information from the spreadsheets in the events log
    console.log();
    await extract.getAllMembers(members, events, event_values);
    console.log("result: ");
    console.log(members);

    // Update the membership log with the correct membership points of each member
    console.log();
    update.updateMembershipLog(members, numExisting, event_values);
}

// Clear the membership log
async function clearLog(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    update.initialize(sheets, auth);
    update.clearMembershipLog();
}

// Do the authorization down here here //
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}
  
/**
 * Serializes credentials to a file comptible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

    /**
     * Load or request or authorization to call APIs.
     */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

init();
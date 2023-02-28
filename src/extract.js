const {google} = require('googleapis');
const constants = require('./constants');

// Cells to use
const membership_point_cells = "Membership!B4:I10";

const event_log_cells = "Membership!N4:O4";
const membership_log_cells = "Membership!S4:X4";

methods = {

    sheets: null,
    auth: null,

    initialize: function(_sheets, _auth) {
        sheets = _sheets;
        auth = _auth;
    },

    // Get the info for each event in the event log based on their values from
    // the membership log calculator
    // Returns a list of the spreadsheets corresponding to each event in the event log
    getEventInfo: async function(event_values) {
        console.log("getEventInfo()");

        // Scan the cells of the membership points calculator
        event_types = {};
        await this.readFromSpreadsheet(constants.log_id, constants.membership_point_cells, 
            (row) => {
                event_types[row[0]] = parseInt(row[7]);
            });

        console.log(event_types);
        console.log("types");

        // Scan the cells of the event log
        let rows = await this.readFromSpreadsheet(constants.log_id, constants.event_log_cells, 
            (row) => {
                console.log(row);
                event_values[row[0]] = event_types[row[1]];
            });

        // Return the info for each event (name, type, and link to spreadsheet responses)
        return rows;
    },

    getCurrentMembers: async function(members) {
        console.log("getCurrentMembers()");
        let numExisting = 0;
        let result = await this.readFromSpreadsheet(constants.log_id, constants.membership_log_cells, 
            (row) => {
                console.log(row);
                member = {
                    firstName: row[0],
                    lastName: row[1],
                    email: row[3],
                    phone: row[4],
                    points: 0,
                    attendance: []
                };
                members[row[2]] = member;
                numExisting++;
            });
        
        if(result == null) {
            return null;
        }

        console.log(members);
        return numExisting;
    },

    // Parsing Rules
        // When parsing First Name, capitalize and ignore whitespace, and ignore (max) 3 char differences
        // When parsing Last Name, capitalize and ignore whitespace, and ignore (max) 3 char differences
        // When parsing UT EID, lowercase and ignore whitespace, don't ignore char differences
        // When parsing Email, don't ignore char differences
        // When parsing Phone Number, ignore ()- and whitespace, don't ignore char differences
    getAllMembers: async function(members, events, event_values) {
        console.log("getAllMembers()");
        let firstNameDiff = 3;
        let lastNameDiff = 3;
        
        // Extract member information from each link
        for (i = 0; i < events.length; i++) {
            let eventRow = events[i];
            let result = await this.readFromSpreadsheet(eventRow[2], constants.sign_in_cells,
                (row) => {
                    let member;
                    if(row[2] in members) {
                        // A member that we've already found
                        member = members[row[2]]
                    } else {
                        // A new member that we've haven't seen before -- add them to
                        // the dictionary
                        member = {
                            firstName: row[0],
                            lastName: row[1],
                            email: row[3],
                            phone: row[4],
                            points: 0,
                            attendance: []
                        };
                        members[row[2]] = member;
                    }
                    member.attendance.push(eventRow[0]);
                    member.points += event_values[eventRow[0]];
                });
        }
    },

    // Helper method to read from spreadsheet -- utilize during refactoring
    // false = no data found, true = data found
    readFromSpreadsheet: async function(sheetID, sheetRange, foreach) {
        let res = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetID,
            range: sheetRange,
        })
        
        let rows = res.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found.');
            return null;
        }

        rows.forEach(foreach);
        return rows;
    }
}


module.exports = methods;
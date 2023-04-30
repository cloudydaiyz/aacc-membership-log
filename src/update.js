const {google} = require('googleapis');
const constants = require('./constants');

methods = {

    sheets: null,
    auth: null,

    initialize: function(_sheets, _auth) {
        sheets = _sheets;
        auth = _auth;
    },

    updateMembershipLog: async function(members, numExisting, events) {
        console.log("updateMembershipLog()");
        
        let existingMembers = [];
        let newMembers = [];
        let eventAttendance = [];

        // Add the first row to event attendance
        let eventNames = [];
        for(eventName in events) {
            eventNames.push(eventName);
        }
        eventAttendance.push(eventNames);

        // Add information for each member
        for(let eid in members) {
            console.log(eid);
            let member = members[eid];
            let row = [member.firstName, member.lastName, eid, member.email, member.phone, member.points]

            // Append the events that the member attended 
            let attendance = [];
            let eventIndex = 0;
            for(eventName in events) {
                if(eventIndex < member.attendance.length && eventName == member.attendance[eventIndex]) {
                    attendance.push('X');
                    eventIndex++;
                } else {
                    attendance.push('');
                }
            }
            eventAttendance.push(attendance);

            if(numExisting > 0) {
                existingMembers.push(row);
                numExisting--;
            } else {
                newMembers.push(row);
            }
        }

        // Call update() to the existing members, and append() to the new members
        this.updateSpreadsheet(constants.log_id, constants.membership_log_cells, existingMembers);
        this.appendSpreadsheet(constants.log_id, constants.membership_log_cells, newMembers);
        this.updateSpreadsheet(constants.log_id, constants.attendance_log_cells, eventAttendance);
    },

    clearMembershipLog: async function() {
        this.clearSpreadsheet(constants.log_id, constants.membership_log_cells);
        this.clearSpreadsheet(constants.log_id, constants.attendance_log_cells);
        // this.clearSpreadsheet(constants.log_id, constants.membership_matrix_cells);
    },

    updateSpreadsheet: async function(sheetID, sheetRange, values) {
        const resource = { values };

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetID,
            range: sheetRange,
            valueInputOption: 'RAW',
            resource: resource
        });
    },

    appendSpreadsheet: async function(sheetID, sheetRange, values) {
        const resource = { values };

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetID,
            range: sheetRange,
            valueInputOption: 'RAW',
            resource: resource
        });
    },

    clearSpreadsheet: async function(sheetID, sheetRange) {
        await sheets.spreadsheets.values.clear({
            spreadsheetId: sheetID,
            range: sheetRange
        });
    }
}

module.exports = methods;
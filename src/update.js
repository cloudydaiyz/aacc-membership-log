const {google} = require('googleapis');
const constants = require('./constants');

methods = {

    sheets: null,
    auth: null,

    initialize: function(_sheets, _auth) {
        sheets = _sheets;
        auth = _auth;
    },

    createMembershipMatrix: async function(members, event_values) {
        console.log("createMembershipMatrix()");
    },

    updateMembershipLog: async function(members, numExisting) {
        console.log("updateMembershipLog()");
        
        let existingMembers = [];
        let newMembers = [];
        for(let eid in members) {
            console.log(eid);
            let member = members[eid];
            let row = [member.firstName, member.lastName, eid, member.email, member.phone, member.points]
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
    },

    clearMembershipLog: async function() {
        this.clearSpreadsheet(constants.log_id, constants.membership_log_cells);
    },

    updateSpreadsheet: async function(sheetID, sheetRange, values) {
        const resource = { values };

        const res = await sheets.spreadsheets.values.update({
            spreadsheetId: sheetID,
            range: sheetRange,
            valueInputOption: 'RAW',
            resource: resource
        });
    },

    appendSpreadsheet: async function(sheetID, sheetRange, values) {
        const resource = { values };

        const res = await sheets.spreadsheets.values.append({
            spreadsheetId: sheetID,
            range: sheetRange,
            valueInputOption: 'RAW',
            resource: resource
        });
    },

    clearSpreadsheet: async function(sheetID, sheetRange) {
        const res = await sheets.spreadsheets.values.clear({
            spreadsheetId: sheetID,
            range: sheetRange
        });
    }
}

module.exports = methods;
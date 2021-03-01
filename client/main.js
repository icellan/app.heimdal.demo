import {Template} from 'meteor/templating';

import './main.html';

Template.main.helpers({
    getFieldValues() {
        const fields = Meteor.settings?.public?.fields;

        if (fields) {
            const fieldValues = [];
            const profile = Meteor.user().profile;
            fields.forEach((f) => {
                fieldValues.push(profile[f]);
            });
            return fieldValues;
        }
    }
});
Template.main.events({
    'click .logout'(e) {
        e.preventDefault();
        Meteor.logout();
    }
});

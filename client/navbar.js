import {Template} from 'meteor/templating';

import './navbar.html';

Template.navbar.helpers({
    getSiteName() {
        return Meteor.settings?.public?.siteName || "Heimdal Demo - Anonymous";
    }
});

Template.navbar.events({
    'click .logout'(e) {
        e.preventDefault();
        Meteor.logout();
    }
});

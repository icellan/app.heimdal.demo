import {Template} from 'meteor/templating';

import './navbar.html';

Template.navbar.events({
    'click .logout'(e) {
        e.preventDefault();
        Meteor.logout();
    }
});

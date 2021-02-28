import {Template} from 'meteor/templating';

import './main.html';

Template.main.events({
    'click .logout'(e) {
        e.preventDefault();
        Meteor.logout();
    }
});

import './authorize.html';

// Get the login token to pass to oauth
// This is the best way to identify the logged user
Template.authorize.helpers({
  validOAuthRequest() {
    return this.client_id && this.redirect_uri;
  },
  getToken() {
    return localStorage.getItem('Meteor.loginToken');
  }
});

Template.authorize.events({
  'click .logout'(e) {
    e.preventDefault();
    Meteor.logout();
    document.location.href = '/';
  }
})

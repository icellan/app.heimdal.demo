Heimdal = {};

Heimdal.getChallengeKey = function() {
    return Session.get('challengeKey');
};

Heimdal.Collections = {};
Heimdal.Collections.loginKeys = new Mongo.Collection("login-keys");

Meteor.startup(function() {
    if (Meteor.isServer) {
        Heimdal.Collections.loginKeys._ensureIndex({"secret" : 1});
    }
});

Heimdal.Collections.loginKeys.allow({
    insert: function (userId, doc) {
        return false;
    },
    update: function (userId, doc, fieldNames, modifier) {
        return false;
    },
    remove: function (userId, doc) {
        return true;
    }
});

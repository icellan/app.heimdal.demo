export const getChallengeKey = function() {
    return Session.get('challengeKey');
};

export const Collections = {};

Collections.loginKeys = new Mongo.Collection("_login-keys");
Collections.connectionSecrets = new Mongo.Collection("_connection-secrets");

Meteor.startup(function() {
    if (Meteor.isServer) {
        Collections.loginKeys._ensureIndex({"secret" : 1});
        Collections.connectionSecrets._ensureIndex({"secret" : 1});
    }
});

Collections.loginKeys.allow({
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

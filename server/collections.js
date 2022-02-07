import { Collections } from '../lib/collections';

Collections.loginKeys = new Mongo.Collection(null);

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

Collections.connectionSecrets = new Mongo.Collection(null);

Collections.connectionSecrets.allow({
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

Collections.signedData = new Mongo.Collection(null);

Collections.signedData.allow({
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

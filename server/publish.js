import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Collections } from '../lib/collections';

Meteor.publish('login-keys', function (secret) {
  const cursor = Collections.loginKeys.find({
    secret: secret,
  });

  Mongo.Collection._publishCursor(cursor, this, 'login-keys');
  this.ready();
});

Meteor.publish('signed-data', function (secret) {
  const cursor = Collections.signedData.find({
    secret: secret,
  });

  Mongo.Collection._publishCursor(cursor, this, 'signed-data');
  this.ready();
});

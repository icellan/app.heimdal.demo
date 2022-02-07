import { Collections } from '../lib/collections';

Collections.loginKeys = new Meteor.Collection('login-keys');
Collections.connectionSecrets = new Mongo.Collection('connection-secrets');
Collections.signedData = new Mongo.Collection('signed-data');

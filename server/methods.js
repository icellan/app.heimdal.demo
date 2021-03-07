import bsv from 'bsv';
import Message from 'bsv/message';
import moment from 'moment';
import { Collections } from '../lib/collections';

export const handleLoginViaQR = function (serverUrl, secret, address, time, signature, fields) {
  // check the time, it should be within 30 seconds
  const mTime = moment.unix(time);
  if (!mTime.isValid()) {
    throw new Meteor.Error(500, 'Invalid time');
  }
  if (mTime.isAfter(moment())) {
    throw new Meteor.Error(500, 'Time is in the future');
  }
  if (mTime.add(30, 'seconds').isBefore(moment())) {
    throw new Meteor.Error(500, 'Token has expired');
  }

  // check the signature from this user and validate the public key
  // server url includes the protocol, but not the trailing slash - https://demo.heimdal.app
  const message = serverUrl + secret + '&time=' + time;
  const messageBuffer = Buffer.from(message);
  if (Message.verify(messageBuffer, address, signature)) {
    // if everything is OK, check whether the user exists, and create if not
    const userName = address;
    let user = Meteor.users.findOne({
      username: userName,
    });
    let userId;
    if (!user) {
      // create user
      userId = Accounts.createUser({
        username: userName,
        password: Random.secret(32),
      });
      user = Meteor.users.findOne({
        _id: userId,
      });
    } else {
      userId = user._id;
    }

    Meteor.users.update({
      _id: userId,
    }, {
      $set: {
        profile: fields,
      },
    });

    // log in the user
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(userId, stampedLoginToken);
    Collections.loginKeys.insert({
      secret: secret,
      loginToken: stampedLoginToken,
    }, function (err) {
      //console.log('data inserted', err);
    });
    Collections.connectionSecrets.remove({
      secret,
    });
  } else {
    throw new Meteor.Error(401, 'Failed verifying signature');
  }
};

Meteor.methods({
  getChallengeKey: function(data) {
    const secret = Random.secret(64);

    if (Meteor.settings?.public?.siteKey) {
      const privateKey = bsv.PrivateKey.fromWIF(Meteor.settings.public.siteKey);
      data.sig = Message(Buffer.from(secret)).sign(privateKey);
      data.id = Meteor.settings.public.siteAddress;
    }

    Collections.connectionSecrets.upsert({
      _id: this.connection.id,
    },{
      $set: {
        _id: this.connection.id,
        date: new Date(),
        secret,
        data,
      }
    });
    return secret;
  },

  loginViaQR: function(secret, publicKey, time, signature, fields) {
    // authenticate the user if the secret was sent with a correct signature from the users publicKey
    const savedSecret = Collections.connectionSecrets.findOne({_id: this.connection.id})
    if (savedSecret && secret === savedSecret.secret) {
      handleLoginViaQR(secret, publicKey, time, signature, fields);
    } else {
      throw new Meteor.Error(401, 'Incorrect secret used for logging in');
    }
  }
});

Meteor.publish('login-keys', function(secret) {
  // TODO: this can be hardened by checking the connection id
  return Collections.loginKeys.find({
    secret: secret,
  });
});

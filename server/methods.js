import Message from 'bsv/message';
import moment from 'moment';
import { Collections } from '../lib/collections';

const HeimdalKeys = {};
export const handleLoginViaQR = function (secret, address, time, signature, profile) {
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
  const messageBuffer = Buffer.from(secret + '&time=' + time);
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
        profile: profile,
      },
    });

    // log in the user
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(userId, stampedLoginToken);
    Collections.loginKeys.insert({
      secret: secret,
      loginToken: stampedLoginToken,
    }, function (err) {
      console.log('data inserted', err);
    });
  } else {
    throw new Meteor.Error(404, 'Failed verifying signature');
  }
};

Meteor.methods({
  getChallengeKey: function() {
    HeimdalKeys[this.connection.id] = Random.secret(64);
    return HeimdalKeys[this.connection.id];
  },

  loginViaQR: function(secret, publicKey, time, signature, profile) {
    // authenticate the user if the secret was sent with a correct signature from the users publicKey
    if (secret === HeimdalKeys[this.connection.id]) {
      handleLoginViaQR(secret, publicKey, time, signature, profile);
    } else {
      throw new Meteor.Error(404, 'Incorrect secret used for logging in');
    }
  }
});


Meteor.publish('login-keys', function(secret) {
  return Collections.loginKeys.find({
    secret: secret
  });
});

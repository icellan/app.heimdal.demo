import { Collections } from '../lib/collections';
import { HeimdalId } from 'heimdal-id';
import { Meteor } from 'meteor/meteor';

export const handleLoginViaQR = function (serverUrl, responseBody) {
  const heimdal = new HeimdalId();
  const heimdalResponse = heimdal.newResponse(serverUrl, responseBody);
  if (heimdalResponse.isValid()) {
    // if everything is OK, check whether the user exists, and create if not
    const userName = heimdalResponse.getId();
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
        profile: heimdalResponse.getFields(),
      },
    });

    // log in the user
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(userId, stampedLoginToken);

    Collections.loginKeys.insert({
      secret: heimdalResponse.getChallenge(),
      loginToken: stampedLoginToken,
    }, function (err) {
      //console.log('data inserted', err);
    });

    Collections.connectionSecrets.remove({
      secret: heimdalResponse.getChallenge(),
    });
  } else {
    throw new Meteor.Error(401, 'Failed verifying signature');
  }
};

Meteor.methods({
  getLoginQr: function () {
    const privateKey = Meteor.settings?.public?.siteKey;
    const heimdal = new HeimdalId(privateKey);
    const site = Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\//g, '');
    heimdal.newRequest(site);
    heimdal.setAction('/api/v1/loginViaQr');

    const data = {}
    if (Meteor.settings.public.fetchData) {
      heimdal.setType('fetch');
      heimdal.setAction('/api/v1/dataForQrLogin');

      data.t = 'api';
      data.a = '/api/v1/loginViaQr';
      if (Meteor.settings.public && Meteor.settings.public.fields) {
        data.f = Meteor.settings.public.fields.join(',');
      }
    } else {
      if (Meteor.settings?.public?.fields) {
        Meteor.settings.public.fields.forEach((f) => {
          heimdal.addField(f);
        });
      }
    }

    Collections.connectionSecrets.upsert({
      _id: this.connection.id,
    }, {
      $set: {
        _id: this.connection.id,
        date: new Date(),
        secret: heimdal.getChallenge(),
        data,
      },
    });

    return privateKey ? heimdal.getSignedRequest() : heimdal.getRequest();
  },
});

Meteor.publish('login-keys', function (secret) {
  return Collections.loginKeys.find({
    secret: secret,
  });
});

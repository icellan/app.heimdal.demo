import { Meteor } from 'meteor/meteor';
import fetch from 'node-fetch';
import { HeimdalId } from 'heimdal-id';
import { Collections } from '../lib/collections';

export const handleSignedData = function (serverUrl, responseBody) {
  const heimdal = new HeimdalId();
  const heimdalResponse = heimdal.newResponse(serverUrl, responseBody);
  if (heimdalResponse.isValid()) {
    Collections.signedData.insert({
      secret: heimdalResponse.getChallenge(),
      signedData: responseBody.signed
    }, function (err) {
      //console.log('data inserted', err);
    });
  } else {
    throw new Meteor.Error(401, 'Failed verifying signature');
  }
}

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
      });
      user = Meteor.users.findOne({
        _id: userId,
      });
    } else {
      userId = user._id;
    }

    const profile = heimdalResponse.getFields();
    if (heimdalResponse.bap) {
      // just add the BAP fields to the profile in this test
      // in a production app, this should be processed further
      profile.bap = heimdalResponse.bap;
    }

    Meteor.users.update({
      _id: userId,
    }, {
      $set: {
        profile,
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
  getDataQr: function (settingsIndex) {
    const privateKey = Meteor.settings?.public?.siteKey;
    const heimdal = new HeimdalId(privateKey);
    const site = (process.env.ROOT_URL || Meteor.absoluteUrl()).replace(/^https?:\/\//, '').replace(/\//g, '');
    heimdal.newRequest(site);
    heimdal.setType('fetch');
    heimdal.setAction('/api/v1/dataForQrLogin');

    const data = {
      t: 'sign',
      a: '/api/v1/signedData',
      sign: Meteor.settings.public.signData[settingsIndex],
    }

    const _id = `${this.connection.id}-data-${settingsIndex}`;
    Collections.connectionSecrets.upsert({
      _id,
    }, {
      $set: {
        _id,
        date: new Date(),
        secret: heimdal.getChallenge(),
        data,
      },
    });

    return privateKey ? heimdal.getSignedRequest() : heimdal.getRequest();
  },
  getLoginQr: function () {
    const privateKey = Meteor.settings?.public?.siteKey;
    const heimdal = new HeimdalId(privateKey);
    const site = (process.env.ROOT_URL || Meteor.absoluteUrl()).replace(/^https?:\/\//, '').replace(/\//g, '');
    console.log(process.env.ROOT_URL, site);
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
  isAttestationValid: async function(address, attribute, value, nonce) {
    if (Meteor.settings?.bap?.apiUrl) {
      // TODO: Move to BAP class
      const url = `${Meteor.settings.bap.apiUrl}/attestation/valid`;
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          attribute,
          value,
          nonce,
        }),
      });

      return rawResponse.json();
    }

    return false;
  }
});

import bsv from 'bsv';
import Message from 'bsv/message';
import { Template } from 'meteor/templating';
import QRCode from 'qrcode';
import { getChallengeKey, Collections } from '../lib/collections';

import './login.html';

export const getQrCodeChecksum = function (qrCode) {
  const qrHex = bsv.crypto.Hash.sha256(Buffer.from(qrCode));
  const address = bsv.PrivateKey.fromHex(qrHex).publicKey.toAddress().toString();
  return `${address.substr(-8,4)}-${address.substr(-4)}`;
}

Template.login.onCreated(function () {
  this.qrCode = new ReactiveVar('');
  this.qrCodeChecksum = new ReactiveVar('');

  this.autorun(() => {
    const userId = Meteor.userId();
    // if user not logged in, get challenge key and set in Session
    if (!userId) {
      const data = {};
      if (Meteor.settings.public.fetchData === true) {
        // add the data to the login request, it will be fetch before login
        data.t = 'api';
        data.a = '/api/v1/loginViaQr';
        if (Meteor.settings.public && Meteor.settings.public.fields) {
          data.f = Meteor.settings.public.fields.join(',');
        }
      }

      Meteor.call('getChallengeKey', data, function(err, key) {
        if (err) {
          console.log(err);
        } else {
          Session.set('challengeKey', key);
        }
      });
    }
  });

  this.autorun(() => {
    this.subscribe('login-keys', getChallengeKey());
  });

  this.autorun(() => {
    const loginKey = Collections.loginKeys.findOne({
      secret: getChallengeKey(),
    });
    if (loginKey) {
      Meteor.loginWithToken(loginKey.loginToken.token);
      Collections.loginKeys.remove({
        _id: loginKey._id,
      });
    }
  });
});

Template.login.onRendered(function () {
  const template = this;
  this.autorun(() => {
    let challengeKey = getChallengeKey();
    if (challengeKey) {
      const site = Meteor.settings && Meteor.settings.heimdal && Meteor.settings.heimdal.site ? Meteor.settings.heimdal.site : window.location.host;
      let qrCode = 'heimdal://' + site + '/' + challengeKey;
      if (Meteor.settings.public.fetchData === true) {
        qrCode += '?t=fetch&a=/api/v1/dataForQrLogin';
      } else {
        qrCode += '?t=api&a=/api/v1/loginViaQr';
        if (Meteor.settings.public && Meteor.settings.public.fields) {
          qrCode += '&f=' + Meteor.settings.public.fields.join(',');
        }
        if (Meteor.settings?.public?.siteKey) {
          const privateKey = bsv.PrivateKey.fromWIF(Meteor.settings.public.siteKey);
          const signature = Message(Buffer.from(challengeKey)).sign(privateKey);
          qrCode += `&sig=${signature}&id=${Meteor.settings.public.siteAddress}`;
        }
      }

      console.log(qrCode);
      template.qrCode.set(qrCode);
      template.qrCodeChecksum.set(getQrCodeChecksum(qrCode));

      Tracker.afterFlush(function () {
        QRCode.toCanvas(document.getElementById('qr-canvas'), qrCode,  {
          scale: 8,
          width: 400,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark:"#000",
            light:"#fff"
          }
        }, function (error) {
          if (error) console.error(error)
        });
      });
    }
  });
});

Template.login.helpers({
  qrCode() {
    return Template.instance().qrCode.get();
  },
  qrCodeChecksum() {
    return Template.instance().qrCodeChecksum.get();
  },
});

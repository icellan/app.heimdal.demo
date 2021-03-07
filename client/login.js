import bsv from 'bsv';
import { Template } from 'meteor/templating';
import QRCode from 'qrcode';
import { getChallengeKey, Collections } from '../lib/collections';

import './login.html';

const getQrCodeChecksum = function (qrCode) {
  const qrHex = bsv.crypto.Hash.sha256(Buffer.from(qrCode));
  const address = bsv.PrivateKey.fromHex(qrHex).publicKey.toAddress().toString();
  return `${address.substr(-8,4)}-${address.substr(-4)}`;
}

Template.login.onCreated(function () {
  this.qrCode = new ReactiveVar('');
  this.qrCodeChecksum = new ReactiveVar('');

  this.autorun(() => {
    this.subscribe('login-keys', getChallengeKey());
  });

  this.autorun(() => {
    var loginKey = Collections.loginKeys.findOne({
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
      let qrCode = 'heimdal://' + site + '/' + challengeKey + '?t=api&a=/api/v1/loginViaQr';
      if (Meteor.settings.public && Meteor.settings.public.fields) {
        qrCode += '&f=' + Meteor.settings.public.fields.join(',');
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

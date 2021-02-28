import { Template } from 'meteor/templating';
import { getChallengeKey, Collections } from '../lib/collections';

import './login.html';

Template.login.onCreated(function () {
  this.qrCode = new ReactiveVar('');

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
      const qrCode = 'heimdal://' + site + '/' + challengeKey + '?type=api&api=/api/v1/loginViaQr';
      console.log(qrCode);
      template.qrCode.set(qrCode);

      Tracker.afterFlush(function () {
        $('#qr').empty();
        $('#qr').qrcode({
          width: 250,
          height: 250,
          text: qrCode,
          ecLevel: 'L',
          bgColor: '#fff',
        });
      });
    }
  });
});

Template.login.helpers({
  qrCode() {
    return Template.instance().qrCode.get();
  },
});

import { Template } from 'meteor/templating';
import QRCode from 'qrcode';
import { Collections } from '../lib/collections';
import { HeimdalId } from 'heimdal-id';

import './login.html';

Template.login.onCreated(function () {
  this.qrCode = new ReactiveVar('');
  this.qrCodeChecksum = new ReactiveVar('');

  this.autorun(() => {
    const userId = Meteor.userId();
    // if user not logged in, get challenge key and set in Session
    if (!userId) {
      Meteor.call('getLoginQr', function(err, loginQr) {
        if (err) {
          console.log(err);
        } else {
          Session.set('loginQr', loginQr);
        }
      });
    }
  });

  this.autorun(() => {
    const qrCode = Session.get('loginQr');
    if (qrCode) {
      const heimdal = new HeimdalId();
      heimdal.fromUrl(qrCode);

      this.subscribe('login-keys', heimdal.getChallenge());
    }
  });

  this.autorun(() => {
    const qrCode = Session.get('loginQr');
    if (qrCode) {
      const heimdal = new HeimdalId();
      heimdal.fromUrl(qrCode);

      const loginKey = Collections.loginKeys.findOne({
        secret: heimdal.getChallenge(),
      });

      if (loginKey) {
        Meteor.loginWithToken(loginKey.loginToken.token);
        Collections.loginKeys.remove({
          _id: loginKey._id,
        });
      }
    }
  });
});

Template.login.onRendered(function () {
  const template = this;
  this.autorun(() => {
    const qrCode = Session.get('loginQr');
    if (qrCode) {
      const heimdal = new HeimdalId();
      heimdal.fromUrl(qrCode);

      console.log(qrCode);
      template.qrCode.set(qrCode);
      template.qrCodeChecksum.set(heimdal.checksum);

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

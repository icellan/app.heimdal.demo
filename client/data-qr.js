import { Template } from 'meteor/templating';
import { HeimdalId } from 'heimdal-id';
import QRCode from 'qrcode';
import { Collections } from '../lib/collections';

Template.dataQrCode.onCreated(function () {
  const template = this;
  this.qrCode = new ReactiveVar();
  this.qrChecksum = new ReactiveVar();
  this.challenge = new ReactiveVar();
  this.signedData = new ReactiveVar();

  Meteor.call('getDataQr', template.data.dataIndex, (err, qrCode) => {
    const heimdal = new HeimdalId();
    const request = heimdal.requestFromUrl(qrCode);

    template.qrChecksum.set(heimdal.getChecksum(qrCode));
    template.challenge.set(heimdal.getChallenge());

    Tracker.afterFlush(function () {
      console.log('QR', qrCode);
      template.qrCode.set(qrCode);
      QRCode.toCanvas(template.$('#qr-canvas')[0], qrCode, {
        scale: 8,
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000',
          light: '#fff',
        },
      }, function (error) {
        if (error) console.error(error);
      });
    });
  });

  this.autorun(() => {
    const challenge = template.challenge.get();
    if (challenge) {
      this.subscribe('signed-data', challenge);
    }
  });

  this.autorun(() => {
    const secret = Template.instance().challenge.get();

    if (secret) {
      const signedData = Collections.signedData.findOne({
        secret,
      });

      if (signedData) {
        template.signedData.set(signedData);

        Collections.signedData.remove({
          _id: signedData._id,
        });
      }
    }
  });
});

Template.dataQrCode.helpers({
  qrCode() {
    const testingPrefix = Meteor.settings.public.qrClickPrefix || '';
    return testingPrefix + Template.instance().qrCode.get();
  },
  qrCodeChecksum() {
    return Template.instance().qrChecksum.get();
  },
  getSignedData() {
    console.log(JSON.stringify(Template.instance().signedData.get()));
    return Template.instance().signedData.get();
  },
  parseOpReturn(opReturn) {
    return opReturn.map((op) => {
      return Buffer.from(op, 'hex').toString();
    }).join(`<br/>`);
  },
});

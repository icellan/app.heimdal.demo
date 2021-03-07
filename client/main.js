import bsv from 'bsv';
import Message from 'bsv/Message';
import {Template} from 'meteor/templating';
import QRCode from 'qrcode';
import { getQrCodeChecksum } from './login';

import './main.html';

Template.main.helpers({
    getFieldValues() {
        const fields = Meteor.settings?.public?.fields;

        if (fields) {
            const fieldValues = [];
            const profile = Meteor.user().profile;
            fields.forEach((f) => {
                f = f.replace('*', '');
                fieldValues.push({
                    key: f,
                    value: profile[f]
                });
            });
            return fieldValues;
        }
    },
    addDataAfterLogin() {
        const profile = Meteor.user().profile;
        if (Meteor.settings?.public?.addDataAfterLogin) {
            const dataAfterLogin = [];
            const keys = Object.keys(Meteor.settings.public.addDataAfterLogin);
            keys.forEach((key) => {
                if (!profile.hasOwnProperty(key)) {
                    dataAfterLogin.push({
                        key,
                        value: Meteor.settings.public.addDataAfterLogin[key],
                    });
                }
            });

            return dataAfterLogin.length > 0 ? dataAfterLogin : false;
        }

        return false;
    },
    isImage() {
        return this.value && this.value.match(/^data:image\//);
    }
});
Template.main.events({
    'click .logout'(e) {
        e.preventDefault();
        Meteor.logout();
    }
});

Template.valueQrCode.onCreated(function() {
    const template = this;
    const site = Meteor.settings && Meteor.settings.heimdal && Meteor.settings.heimdal.site ? Meteor.settings.heimdal.site : window.location.host;
    template.qrCode = `heimdal://${site}/?t=add&f=${encodeURIComponent(template.data.attribute)}&v=${template.data.value}`;
    if (Meteor.settings?.public?.siteKey) {
        const privateKey = bsv.PrivateKey.fromWIF(Meteor.settings.public.siteKey);
        const signature = Message(Buffer.from(`${template.data.attribute}:${template.data.value}`)).sign(privateKey);
        template.qrCode += `&sig=${signature}&id=${Meteor.settings.public.siteAddress}`;
    }

    template.qrChecksum = new ReactiveVar(getQrCodeChecksum(template.qrCode));

    this.autorun(() => {
        Tracker.afterFlush(function () {
            console.log(this.qrCode);
            QRCode.toCanvas(template.$('#qr-canvas')[0], template.qrCode,  {
                scale: 8,
                width: 200,
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
    });
});

Template.valueQrCode.helpers({
    qrCodeChecksum() {
        return Template.instance().qrChecksum.get();
    }
});

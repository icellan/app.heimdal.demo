import {Template} from 'meteor/templating';
import QRCode from 'qrcode';
import { HeimdalId } from 'heimdal-id';

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

    const heimdal = new HeimdalId(Meteor.settings?.public?.siteKey);
    heimdal.newRequest(site);
    heimdal.addFieldValue(template.data.attribute, template.data.value);
    if (Meteor.settings?.public?.siteKey) {
        template.qrCode = heimdal.getSignedRequest();
    } else {
        template.qrCode = heimdal.getRequest();
    }

    console.log(heimdal);
    console.log(template.qrCode);
    template.qrChecksum = new ReactiveVar(heimdal.getChecksum(template.qrCode));

    this.autorun(() => {
        Tracker.afterFlush(function () {
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

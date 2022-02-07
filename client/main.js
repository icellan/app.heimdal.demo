import { Template } from 'meteor/templating';
import { ReactiveMethod } from 'meteor/simple:reactive-method';
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
                if (!f.match(/^bap\[/)) {
                    f = f.replace('*', '');
                    fieldValues.push({
                        key: f,
                        value: profile[f]
                    });
                }
            });
            return fieldValues;
        }
    },
    getBAPFieldValues() {
        const fields = Meteor.settings?.public?.fields;

        if (fields) {
            const fieldValues = [];
            const profile = Meteor.user().profile;
            fields.forEach((field) => {
                let bap = field.match(/^bap\[([^\]]+)\]/);
                if (bap && bap[1]) {
                    bap = bap[1].split(';');
                    bap.forEach((f) => {
                        f = f.replace('*', '');
                        fieldValues.push({
                            key: f,
                            value: profile?.bap?.attributes[f].value,
                            nonce: profile?.bap?.attributes[f].nonce,
                        });
                    });
                }
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
    },
    isAttestationValid() {
        const bap = Meteor.user()?.profile?.bap;

        const attestationValid = ReactiveMethod.call('isAttestationValid', bap.address, this.key, this.value, this.nonce);
        if (attestationValid !== undefined) {
            console.log(attestationValid);
            if (attestationValid) {
                if (attestationValid.status === 'ERROR') {
                    return '⛔ ERROR: ' + attestationValid.message;
                } else if (attestationValid.status === 'OK') {
                    return attestationValid.result.valid === true ? '✅ Valid' : '❌️ NOT valid';
                }
            }
        }

        return '';
    }
});

Template.main.events({
    'click .logout'(e) {
        e.preventDefault();
        Meteor.logout();
    }
});

Template.valueQrCode.onCreated(function() {
    this.qrCode = new ReactiveVar();
    const template = this;

    const site = Meteor.settings && Meteor.settings.heimdal && Meteor.settings.heimdal.site ? Meteor.settings.heimdal.site : window.location.host;
    const heimdal = new HeimdalId(Meteor.settings?.public?.siteKey);

    heimdal.newRequest(site);
    heimdal.addFieldValue(template.data.attribute, template.data.value);
    if (Meteor.settings?.public?.siteKey) {
        template.qrCode.set(heimdal.getSignedRequest());
    } else {
        template.qrCode.set(heimdal.getRequest());
    }

    console.log(JSON.stringify(heimdal));
    console.log(heimdal.getSigningMessage());
    template.qrChecksum = new ReactiveVar(heimdal.getChecksum(template.qrCode.get()));

    this.autorun(() => {
        Tracker.afterFlush(function () {
            console.log('QR', template.qrCode.get())
            QRCode.toCanvas(template.$('#qr-canvas')[0], template.qrCode.get(),  {
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
    qrCode() {
        const testingPrefix = Meteor.settings.public.qrClickPrefix || '';
        return testingPrefix + Template.instance().qrCode.get();
    },
    qrCodeChecksum() {
        return Template.instance().qrChecksum.get();
    }
});

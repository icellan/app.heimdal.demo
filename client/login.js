import { Template } from 'meteor/templating';

import './login.html';

Template.login.onCreated(function() {
    this.autorun(() => {
        this.subscribe('login-keys', Heimdal.getChallengeKey());
    });

    this.autorun(() => {
        var loginKey = Heimdal.Collections.loginKeys.findOne({
            secret: Heimdal.getChallengeKey()
        });
        if (loginKey) {
            Meteor.loginWithToken(loginKey.loginToken.token);
            Heimdal.Collections.loginKeys.remove({
                _id: loginKey._id
            });
        }
    });
});

Template.login.onRendered(function() {
    this.autorun(() => {
        let challengeKey = Heimdal.getChallengeKey();
        if (challengeKey) {
            var site = Meteor.settings && Meteor.settings.heimdal && Meteor.settings.heimdal.site ? Meteor.settings.heimdal.site : window.location.host;
            var qrCode = "heimdal://" + site + "/" + challengeKey;
            Tracker.afterFlush(function() {
                $('#qr').qrcode({
                    width: 250,
                    height: 250,
                    text: qrCode,
                    ecLevel: 'L',
                    bgColor: '#fff'
                });
            });
        }
    });
});

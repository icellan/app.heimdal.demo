Meteor.startup(function() {
    // if user not logged in, get challenge key and set in Session
    if (!Session.get('challengeKey')) {
        Meteor.call('getChallengeKey', function(err, key) {
            if (err) {
                console.log(err);
            } else {
                Session.set('challengeKey', key);
            }
        });
    }
});

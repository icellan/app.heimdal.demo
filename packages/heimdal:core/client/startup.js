Meteor.startup(function() {
    var userId = Meteor.userId();
    // if user not logged in, get challenge key and set in Session
    Tracker.autorun(function() {
        if (!Session.get('challengeKey') || Meteor.userId() !== userId) {
            Meteor.call('getChallengeKey', function(err, key) {
                if (err) {
                    console.log(err);
                } else {
                    userId = Meteor.userId();
                    Session.set('challengeKey', key);
                }
            });
        }
    });
});

HeimdalKeys = {};
Meteor.methods({
    getChallengeKey: function() {
        HeimdalKeys[this.connection.id] = Random.secret(64);
        return HeimdalKeys[this.connection.id];
    },

    loginViaQR: function(secret, publicKey, signature, profile) {
        // authenticate the user if the secret was sent with a correct signature from the users publicKey
        //if (secret === HeimdalKeys[this.connection.id]) {
            // check the signature from this user and validate the public key
            var encryption = new Heimdal.encryption();
            if (encryption.verify(secret, signature, publicKey)) {
                // if everything is OK, check whether the user exists, and create if not
                var userName = encryption.sha256(publicKey);
                var user = Meteor.users.findOne({
                    username: userName
                });
                if (!user) {
                    // create user
                    var userId = Accounts.createUser({
                        username: userName,
                        password: Random.secret(32)
                    });
                    user = Meteor.users.findOne({
                        _id: userId
                    });
                } else {
                    var userId = user._id;
                }

                Meteor.users.update({
                    _id: userId
                }, {
                    $set: {
                        profile: profile
                    }
                });

                // log in the user
                var stampedLoginToken = Accounts._generateStampedLoginToken();
                Accounts._insertLoginToken(userId, stampedLoginToken);
                Heimdal.Collections.loginKeys.insert({
                    secret: secret,
                    loginToken: stampedLoginToken
                }, function(err) {
                    console.log('data inserted', err);
                });
            } else {
                throw new Meteor.Error(404, "Failed verifying signature");
            }

        //} else {
        //    throw new Meteor.Error(404, "Incorrect secret used for logging in");
        //}
    }
});


Meteor.publish('login-keys', function(secret) {
    return Heimdal.Collections.loginKeys.find({
        secret: secret
    })
});

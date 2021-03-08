Accounts.onLogout(function(account) {
  Meteor.defer(() => {
    if (account && account.user) {
      Meteor.users.update({
        _id: account.user._id,
      },{
        $set: {
          profile: {},
        }
      });
    }
  });
});

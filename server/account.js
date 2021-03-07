Accounts.onLogout(function(account) {
  Meteor.defer(() => {
    Meteor.users.update({
      _id: account.user._id,
    },{
      $set: {
        profile: {},
      }
    });
  });
});

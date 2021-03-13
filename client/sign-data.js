Template.signData.helpers({
  hasSignData() {
    return Meteor.settings.public?.signData;
  }
});

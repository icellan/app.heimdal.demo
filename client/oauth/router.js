import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './authorize'

// Define the route to render the popup view
FlowRouter.route('/oauth2/authorize', {
  action: function (params, queryParams) {
    this.render('layout', 'authorize', queryParams)
  }
})

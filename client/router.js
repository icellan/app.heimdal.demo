import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './main';

// Define the route to render the popup view
FlowRouter.route('/', {
  action: function (params, queryParams) {
    this.render('layout', 'main', queryParams)
  }
})

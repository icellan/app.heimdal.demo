import { Meteor } from 'meteor/meteor';
import bodyParser from 'body-parser';

import { handleLoginViaQR, handleSignedData } from './methods';
import { Collections } from '../lib/collections';

WebApp.connectHandlers.use('/api/v1/loginViaQr', bodyParser.json({
  limit: '15mb', // increase limit for avatar images
  extended: true,
  parameterLimit: 15*1024,
}));

WebApp.connectHandlers.use('/', bodyParser.json());

WebApp.connectHandlers.use('/api/v1/loginViaQr', Meteor.bindEnvironment((req, res, next) => {
  // Heimdal only support https:// urls - this is just for the local demo sites
  const serverUrl = Meteor.absoluteUrl().replace('http://', 'https://');

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    });
    res.end('');
  } else if (req.method === 'POST') {
    try {
      const { challenge } = req.body;
      const savedSecret = Collections.connectionSecrets.findOne({secret: challenge})
      // we can only check here whether it actually exists
      if (!savedSecret) {
        throw new Meteor.Error('Invalid challenge key given');
      }

      handleLoginViaQR(serverUrl, req.body);

      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });
      res.end(JSON.stringify({
        message: 'OK'
      }));
    } catch(e) {
      console.error(e);
      res.writeHead(500, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });
      res.end(JSON.stringify({
        error: e.message
      }));
    }
  }
}));

WebApp.connectHandlers.use('/api/v1/dataForQrLogin', Meteor.bindEnvironment((req, res, next) => {
  // Heimdal only support https:// urls - this is just for the local demo sites
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    });
    res.end('');
  } else if (req.method === 'POST') {
    try {
      const { challenge } = req.body;
      const savedSecret = Collections.connectionSecrets.findOne({secret: challenge})
      // we can only check here whether it actually exists
      if (!savedSecret || !savedSecret.data) {
        throw new Meteor.Error('Invalid challenge key given');
      }

      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({
        message: 'OK',
        data: savedSecret.data,
      }));
    } catch(e) {
      console.error(e);
      res.writeHead(500, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });
      res.end(JSON.stringify({
        error: e.message
      }));
    }
  }
}));

WebApp.connectHandlers.use('/api/v1/signedData', Meteor.bindEnvironment((req, res, next) => {
  // Heimdal only support https:// urls - this is just for the local demo sites
  const serverUrl = Meteor.absoluteUrl().replace('http://', 'https://');

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    });
    res.end('');
  } else if (req.method === 'POST') {
    try {
      const { challenge } = req.body;
      const savedSecret = Collections.connectionSecrets.findOne({secret: challenge})
      // we can only check here whether it actually exists
      if (!savedSecret || !savedSecret.data) {
        throw new Meteor.Error('Invalid challenge key given');
      }

      handleSignedData(serverUrl, req.body);

      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({
        message: 'OK',
        data: savedSecret.data,
      }));
    } catch(e) {
      console.error(e);
      res.writeHead(500, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });
      res.end(JSON.stringify({
        error: e.message
      }));
    }
  }
}));

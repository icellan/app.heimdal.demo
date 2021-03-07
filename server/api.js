import { Meteor } from 'meteor/meteor';
import bodyParser from 'body-parser';
import { parseUri } from '../lib/parseUri';

import { handleLoginViaQR  } from './methods';
import { Collections } from '../lib/collections';

WebApp.connectHandlers.use('/api/v1/loginViaQr', bodyParser.json());
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
    const { challenge, address, time, signature, fields } = req.body;
    try {
      const savedSecret = Collections.connectionSecrets.findOne({secret: challenge})
      // we can only check here whether it actually exists
      if (!savedSecret) {
        throw new Meteor.Error('Invalid challenge key given');
      }

      handleLoginViaQR(serverUrl, challenge, address, time, signature, fields);

      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });
      res.end(JSON.stringify({
        message: 'OK'
      }));
    } catch(e) {
      console.log(e);
      res.writeHead(500, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });
      res.end(JSON.stringify({
        error: e.error
      }));
    }
  }
}));

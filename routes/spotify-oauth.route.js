import express from 'express';
const router = express.Router();
import fetch from 'node-fetch';

import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

var generateRandomString = function (length) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

router.get('/auth/spotify', function (req, res) {
  var state = generateRandomString(16);
  var scope =
    'streaming user-top-read user-read-recently-played user-library-read user-modify-playback-state user-read-private user-read-email user-read-currently-playing user-read-playback-state';

  var auth_query_parameters = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri,
    state: state,
  });

  res.redirect(
    'https://accounts.spotify.com/authorize/?' +
      auth_query_parameters.toString(),
  );
});

router.get('/spotify/callback', async (req, res) => {
  try {
    const code = req.query.code;

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);
    params.append('grant_type', 'authorization_code');

    const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      'base64',
    );

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      return res.status(500).send('Token exchange failed');
    }

    const body = await response.json();
    const access_token = body.access_token;
    req.session.spotifyToken = access_token;

    res.redirect('/boom');
  } catch (err) {
    console.log(err);
  }
});

export default router;

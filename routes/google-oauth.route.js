const express = require('express');
const router = express.Router();
const oauth2Client = require('../utils/googleAuth');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

router.get('/auth/google', (_, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    console.log('CODE', code);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('TOKEN', tokens);
    // Store securely (example: session)
    req.session.token = tokens;

    res.redirect('/boom'); // or your frontend route
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

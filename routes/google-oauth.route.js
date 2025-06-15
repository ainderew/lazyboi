import express from 'express';
const router = express.Router();
import oauth2Client from '../utils/googleAuth.js';

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
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    req.session.token = tokens;

    res.redirect('/boom');
  } catch (err) {
    console.log(err);
  }
});

export default router;

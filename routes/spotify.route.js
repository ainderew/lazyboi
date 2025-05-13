const express = require('express');
const router = express.Router();
const SpotifyController = require('../controller/Spotify.controller');

const spotifyCont = new SpotifyController();

router.get('/spotify/get-token', spotifyCont.getToken);

module.exports = router;

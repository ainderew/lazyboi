import express from 'express';
import SpotifyController from '../controller/Spotify.controller.js';

const router = express.Router();
const spotifyCont = new SpotifyController();

router.get('/spotify/get-token', spotifyCont.getToken);

export default router;

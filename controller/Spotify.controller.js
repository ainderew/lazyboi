import SpotifyService from '../service/Spotify.service.js';

class SpotifyController {
  #spotifyService;

  constructor() {
    this.#spotifyService = new SpotifyService();
    this.getToken = this.getToken.bind(this);
  }

  //GET
  async getToken(req, res) {
    try {
      const token = this.#spotifyService.verifyToken(req);
      res.json({ token });
    } catch (err) {
      console.log(err);
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

export default SpotifyController;

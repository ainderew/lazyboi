class SpotifyService {
  verifyToken(req) {
    const token = req.session?.spotifyToken;

    if (!token) {
      throw new Error('Unauthorized - get spotify token');
    }

    return token;
  }
}

export default SpotifyService;

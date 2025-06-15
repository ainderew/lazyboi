const SPOTIFY_LOCALSTORAGE_KEY = 'spotify_token';
const spotifyLoginBtn = document.getElementById('spotify-login-btn');

//TODO: change before pushing
const isProd = true;
const API_ENDPOINT = isProd ? 'https://workdash.site' : 'http://127.0.0.1:4200';

async function handleToken() {
  try {
    const resData = await fetch(`${API_ENDPOINT}/spotify/get-token`);
    const localStoreToken = localStorage.getItem(SPOTIFY_LOCALSTORAGE_KEY);

    if (resData.status > 400 || resData.status === 204) {
      if (localStoreToken) {
        localStorage.removeItem(SPOTIFY_LOCALSTORAGE_KEY);
      }

      return;
    }

    const { token } = await resData.json();

    if (!token) {
      console.error('NO SPOTIFY TOKEN');
      return;
    }

    if (localStoreToken === token) {
      console.log(localStoreToken);
      spotifyLoginBtn.remove();
      return;
    }

    localStorage.setItem(SPOTIFY_LOCALSTORAGE_KEY, token);
    spotifyLoginBtn.remove();
  } catch (err) {
    console.error('Error fetching Spotify token:', err);
    throw new Error(err);
  }
}

await handleToken();

const script = document.createElement('script');
script.src = 'https://sdk.scdn.co/spotify-player.js';
script.async = true;
document.body.appendChild(script);
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = localStorage.getItem(SPOTIFY_LOCALSTORAGE_KEY);
  const player = new Spotify.Player({
    name: 'workdash',
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 1,
  });

  // Ready State
  player.addListener('ready', async ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    // Transfer playback here
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [device_id],
        play: true,
      }),
    });

    //Get Image
    const res = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.status === 204 || res.status > 400) {
      console.log('Nothing is currently playing');
      return null;
    }
    const currentTrack = await res.json();

    const processedTrackData = processCurrentTrackData(currentTrack.item);
    const { imageUrl, songTitle, artistName } = processedTrackData;
    renderCurrentSongImage(imageUrl);
    renderSongTitle(songTitle);
    renderArtistName(artistName);
    renderTogglePlayButton(currentTrack.is_playing);
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  //Errors
  player.addListener('initialization_error', ({ message }) => {
    console.error(message);
  });

  player.addListener('authentication_error', ({ message }) => {
    console.error(message);
  });

  player.addListener('account_error', ({ message }) => {
    console.error(message);
  });

  //Track state change
  player.addListener('player_state_changed', ({ track_window }) => {
    const processedTrackData = processCurrentTrackData(
      track_window.current_track,
    );
    const { imageUrl, songTitle, artistName } = processedTrackData;
    renderCurrentSongImage(imageUrl);
    renderSongTitle(songTitle);
    renderArtistName(artistName);
  });

  //Controls events

  //Toggle Play and Pause
  document.querySelector('.music-play-btn').onclick = async function () {
    await player.togglePlay();

    /** state
    paused: boolean, loading: boolean, duration: number, position: number
    **/
    const state = await player.getCurrentState();
    renderTogglePlayButton(state.paused);
  };

  //Next Song
  document.querySelector('.btn-control-next').onclick = async function () {
    await player.nextTrack();
  };

  //Prev Song
  document.querySelector('.btn-control-prev').onclick = async function () {
    await player.previousTrack();
  };

  player.connect();
};

// Rendering functions

function renderCurrentSongImage(imgUrl) {
  const songImageContainer = document.querySelector('.album-cover-img');

  songImageContainer.src = imgUrl;
}

function renderSongTitle(songTitle) {
  const songTitleContainer = document.querySelector('.player-song-title');
  songTitleContainer.innerText = songTitle;
}

function renderArtistName(artistName) {
  const artistNameContainer = document.querySelector('.player-song-artist');
  artistNameContainer.innerText = artistName;
}

function renderTogglePlayButton(state) {
  const toggleButton = document.querySelector('.music-play-btn');

  if (!state) {
    toggleButton.src = './assets/music_controls_svgs/play.svg';
  } else {
    toggleButton.src = './assets/music_controls_svgs/pause.svg';
  }
}

// Helper functions
function processCurrentTrackData(trackData) {
  const imageUrl = trackData.album.images[0].url;
  const songTitle = trackData.name;
  const artistName = trackData.artists.map((a) => a.name).join(', ');

  return {
    imageUrl,
    songTitle,
    artistName,
  };
}

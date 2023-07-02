const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');
const clientId = '8e81373db75b4fc1ab89d7e246c17c73';
const redirectUri = 'https://www.trippbarker.com/projects/tempotrax';

let codeVerifier = localStorage.getItem('code_verifier');
let playlistSongs = '';

let body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier
});
async function getAccessToken(){
  const response = fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  }).then(response => {
      if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
      }
      return response.json();
  }).then(data => {
      localStorage.setItem('access_token', data.access_token);
  }).catch(error => {
      console.error('Error:', error);
  });
}

async function populateUI() {
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  profile = await response.json();
  document.getElementById("displayName").innerText = profile.display_name;
  if (profile.images[0]) {
      const profileImage = new Image(200, 200);
      profileImage.src = profile.images[0].url;
      document.getElementById("avatar").appendChild(profileImage);
      document.getElementById("imgUrl").innerText = profile.images[0].url;
  }
  document.getElementById("id").innerText = profile.id;
  localStorage.setItem('userID', profile.id)
  document.getElementById("email").innerText = profile.email;
  document.getElementById("uri").innerText = profile.uri;
  document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url").innerText = profile.href;
  document.getElementById("url").setAttribute("href", profile.href);
}

async function getPlaylists(){
  let playlistSongs = '';
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  const playlists =  await response.json();
  for (let i = 0; i < playlists.items.length; i ++){
    playlistSongs += readPlaylist(playlists.items[i].id, playlistSongs);
  }
  return playlistSongs;
}

async function readPlaylist(playlistID, playlistSongs){
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/playlists/'+playlistID+'/tracks', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  const tracks = await response.json();
  for (let i = 0; i < tracks.items.length; i++){
    const trackFeat = await fetch('https://api.spotify.com/v1/audio-features?ids=' + tracks.items[i].track.id,{
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })
    const trackTempo = await trackFeat.json();
    const audioFeatures = trackTempo.audio_features;
    if (audioFeatures[0].tempo > 110 && audioFeatures[0].tempo < 125){
      songID = tracks.items[i].track.id
      console.log(songID);
      playlistSongs += '"spotify:track:"'+songID+'", ';
    }
    return playlistSongs;
  }
}

async function createPlaylist(){
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/users/'+localStorage.getItem('userID')+'/playlists',{
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({name: "Testy Test", description: "A playlist created with TempoTrax https://www.trippbarker.com/projects/tempotraxinit", public: false})
  })
  const data = await response.json();
  addSongsToPlaylist(data.id);
}

async function addSongsToPlaylist(playlistID){
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/playlists/'+playlistID+'/tracks',{
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body:'{"uris": ['+playlistSongs+']}'
  })
  const addSongsRes = await response.json();
}

getAccessToken();
populateUI();
getPlaylists();
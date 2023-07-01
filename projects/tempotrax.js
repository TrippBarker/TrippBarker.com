const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');
const clientId = '8e81373db75b4fc1ab89d7e246c17c73';
const redirectUri = 'https://www.trippbarker.com/projects/tempotrax';

let codeVerifier = localStorage.getItem('code_verifier');

let body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier
});

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
    console.log(data);
    localStorage.setItem('access_token', data.access_token);
}).catch(error => {
    console.error('Error:', error);
});

function populateUI() {
  accessToken = localStorage.getItem('access_token');
  const response = fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  profile = response.json();
  console.log(profile.display_name + " two");
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

function getPlaylists(){
  accessToken = localStorage.getItem('access_token');
  const response = fetch('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  const playlists =  response.json();
  for (let i = 0; i < playlists.items.length; i ++){
    console.log(playlists.items[i].id);
    readPlaylist(playlists.items[i].id);
  }
}

function readPlaylist(playlistID){
  accessToken = localStorage.getItem('access_token');
  const response = fetch('https://api.spotify.com/v1/playlists/'+playlistID+'/tracks', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  const tracks = response.json();
  console.log(tracks);
}

function createPlaylist(){
  accessToken = localStorage.getItem('access_token');
  const response = fetch('https://api.spotify.com/v1/users/'+localStorage.getItem('userID')+'/playlists',{
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({name: "TempoTrax Playlist", description: "A playlist created with TempoTrax https://www.trippbarker.com/projects/tempotraxinit", public: false})
  })
  const data = response.json();
  console.log(data);

}

populateUI();
getPlaylists();
getPlaylists();
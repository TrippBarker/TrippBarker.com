// HTML elements live here
const app = document.querySelector('#application');
const infoBtn = document.querySelector('#info');
const infoBox = document.querySelector('#infoBox');
const maxTempoSLDR = document.querySelector('#maxTempoSLDR');
const minTempoSLDR = document.querySelector('#minTempoSLDR');
const maxDanceSLDR = document.querySelector('#maxDanceSLDR');
const minDanceSLDR = document.querySelector('#minDanceSLDR');
const maxEnergySLDR = document.querySelector('#maxEnergySLDR');
const minEnergySLDR = document.querySelector('#minEnergySLDR');
const maxTempoVal = document.querySelector('#maxTempoVal');
const minTempoVal = document.querySelector('#minTempoVal');
const maxDanceVal = document.querySelector('#maxDanceVal');
const minDanceVal = document.querySelector('#minDanceVal');
const maxEnergyVal = document.querySelector('#maxEnergyVal');
const minEnergyVal = document.querySelector('#minEnergyVal');
const trackTBL = document.querySelector('#trackTBL');

const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');
const clientId = '8e81373db75b4fc1ab89d7e246c17c73';
const redirectUri = 'https://www.trippbarker.com/projects/tempotrax';

let codeVerifier = localStorage.getItem('code_verifier');
let playlistSongs = '';
const maxSize = 99;
let allTracks = [];
let playlistSize = 0;
let minBPM = 1;
let maxBPM = 200;
let minDanceability = 0;
let maxDanceability = 1;
let minEnergy = 0;
let maxEnergy = 1;
let userTrackOffset = 0;

let body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier
});


// EVENT HANDLERS
// Function called to make the information box visible
function displayInfo(e){
  infoBox.classList.toggle("visible");
  app.classList.toggle("dimmed");
}

function updateVal(e){
  if(e.srcElement.id == 'maxTempoSLDR'){
    maxBPM = e.srcElement.value;
    maxTempoVal.innerHTML = e.srcElement.value;
    if (parseInt(minTempoSLDR.value) > parseInt(e.srcElement.value)){
      minTempoSLDR.value = e.srcElement.value;
      minBPM = e.srcElement.value;
      minTempoVal.innerHTML = e.srcElement.value;
    }
  } else if(e.srcElement.id == 'minTempoSLDR'){
    minBPM = e.srcElement.value;
    minTempoVal.innerHTML = e.srcElement.value;
    if (parseInt(maxTempoSLDR.value) < parseInt(e.srcElement.value)){
      maxTempoSLDR.value = e.srcElement.value;
      maxBPM = e.srcElement.value;
      maxTempoVal.innerHTML = e.srcElement.value;
    }
  } else if (e.srcElement.id == 'maxDanceSLDR'){
    maxDanceability = (e.srcElement.value * 0.01).toFixed(2);
    maxDanceVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    if (parseInt(minDanceSLDR.value) > parseInt(e.srcElement.value)){
      minDanceSLDR.value = e.srcElement.value;
      minDanceability = (e.srcElement.value * 0.01).toFixed(2);
      minDanceVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    }
  } else if (e.srcElement.id == 'minDanceSLDR'){
    minDanceability -= (e.srcElement.value * 0.01).toFixed(2);
    minDanceVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    if (parseInt(maxDanceSLDR.value) < parseInt(e.srcElement.value)){
      maxDanceSLDR.value = e.srcElement.value;
      maxDanceability = (e.srcElement.value * 0.01).toFixed(2);
      maxDanceVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    }
  } else if (e.srcElement.id == 'maxEnergySLDR'){
    maxEnergy = (e.srcElement.value * 0.01).toFixed(2);
    maxEnergyVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    if (parseInt(minEnergySLDR.value) > parseInt(e.srcElement.value)){
      minEnergySLDR.value = e.srcElement.value;
      minEnergy = (e.srcElement.value * 0.01).toFixed(2);
      minEnergyVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    }
  } else if (e.srcElement.id == 'minEnergySLDR'){
    minEnergy = (e.srcElement.value * 0.01).toFixed(2);
    minEnergyVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    if (parseInt(maxEnergySLDR.value) < parseInt(e.srcElement.value)){
      maxEnergySLDR.value = e.srcElement.value;
      maxEnergy = (e.srcElement.value * 0.01).toFixed(2);
      maxEnergyVal.innerHTML = (e.srcElement.value * 0.01).toFixed(2);
    }
  }
}

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

async function getUsersTracks(){
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/me/tracks?offset='+userTrackOffset+'&limit=50', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  const usersTracks =  await response.json();
  userTrackOffset += 50;
  for (let i = 0; i < usersTracks.items.length; i++){
    console.log(usersTracks.items[i].track);
    readTrack(usersTracks.items[i].track.id);
  }
  if (usersTracks.items.length == 50){
    getUsersTracks();
  }
}

async function readTrack(trackID){
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/tracks/'+trackID, {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  trackInfo = await response.json();
  const trackFeat = await fetch('https://api.spotify.com/v1/audio-features?ids='+trackID,{
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  const trackTempo = await trackFeat.json();
  const audioFeatures = trackTempo.audio_features;
  if (audioFeatures[0].tempo > minBPM && 
      audioFeatures[0].tempo < maxBPM && 
      audioFeatures[0].danceability > minDanceability &&
      audioFeatures[0].danceability < maxDanceability &&
      audioFeatures[0].energy > minEnergy &&
      audioFeatures[0].energy < maxEnergy &&
      playlistSize < maxSize){
    songArtist = trackInfo.artists.name;
    songAlbum = trackInfo.album.name;
    songID = trackInfo.id;
    songName = trackInfo.name;
    songBPM = audioFeatures[0].tempo;
    songDanceability = audioFeatures[0].danceability;
    songEnergy = audioFeatures[0].energy;
    let trackEntry = {name: songName, artist: songArtist, album: songAlbum, id: songID, tempo: songBPM, danceability: songDanceability, energy: songEnergy};
    allTracks.push(trackEntry);
    playlistSize++;
    if (playlistSongs.length == 0){
      playlistSongs += '"spotify:track:'+songID+'"';
    } else {
      playlistSongs += ',"spotify:track:'+songID+'"';
    }
    console.log(songID + ' ' + playlistSize);
  }
}

async function readPlaylist(playlistID){
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
    if (audioFeatures[0].tempo > minBPM && 
        audioFeatures[0].tempo < maxBPM && 
        audioFeatures[0].danceability > minDanceability &&
        audioFeatures[0].danceability < maxDanceability &&
        audioFeatures[0].energy > minEnergy &&
        audioFeatures[0].energy < maxEnergy &&
        playlistSize < maxSize){
      songArtist = tracks.items[i].track.artist;
      songAlbum = tracks.items[i].track.album.name;
      songID = tracks.items[i].track.id;
      songName = tracks.items[i].track.name;
      songBPM = audioFeatures[0].tempo;
      songDanceability = audioFeatures[0].danceability;
      songEnergy = audioFeatures[0].energy;
      let trackInfo = {name: songName, artist: songArtist, album: songAlbum, id: songID, tempo: songBPM, danceability: songDanceability, energy: songEnergy};
      allTracks.push(trackInfo);
      playlistSize++;
      if (playlistSongs.length == 0){
        playlistSongs += '"spotify:track:'+songID+'"';
      } else {
        playlistSongs += ',"spotify:track:'+songID+'"';
      }
      console.log(songID + ' ' + playlistSize);
    }
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
    body: JSON.stringify({name: "TempoTrax ("+minBPM+"-"+maxBPM+")", description: "A playlist created with TempoTrax https://www.trippbarker.com/projects/tempotraxinit", public: false})
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

function printSongs(){
  for (let i = 0; i < allTracks.length; i++){
    console.log('NAME: ' + allTracks[i].name + ' ARTIST: ' + allTracks[i].artist + ' ALBUM: ' + allTracks[i].album + ' ID: ' + allTracks[i].id + ' TEMPO: ' + allTracks[i].tempo + ' DANCEABILITY: ' + allTracks[i].danceability + ' ENERGY: ' + allTracks[i].energy);
  }
}

function displayTracks(){
  const trackEntry = document.createElement("tr");
  const trackTitle = document.createElement("td");
  const trackArtist = document.createElement("td");
  const trackBPM = document.createElement("td");
  trackEntry.appendChild(trackTitle);
  trackTitle.textContent = "Island in the sun";
  trackEntry.appendChild(trackArtist);
  trackArtist.textContent = "Weezer";
  trackEntry.append(trackBPM);
  trackBPM.textContent = "115";
  trackTBL.appendChild(trackEntry);
}


// Event listeners live here
infoBtn.addEventListener('click', displayInfo);
infoBox.addEventListener('click', displayInfo);
maxTempoSLDR.addEventListener('input', updateVal);
minTempoSLDR.addEventListener('input', updateVal);
maxDanceSLDR.addEventListener('input', updateVal);
minDanceSLDR.addEventListener('input', updateVal);
maxEnergySLDR.addEventListener('input', updateVal);
minEnergySLDR.addEventListener('input', updateVal);

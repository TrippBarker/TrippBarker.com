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
const createBTN = document.querySelector('#createBTN');

const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');
const clientId = '8e81373db75b4fc1ab89d7e246c17c73';
const redirectUri = 'https://www.trippbarker.com/projects/tempotrax';

// GLOBAL VARIABLES

let codeVerifier = localStorage.getItem('code_verifier');
let playlistSongs = '';
const maxSize = 100;
let currentTracks = [];
let allTracks = [];
let playlistSize = 0;
let minBPM = 1;
let maxBPM = 200;
let minDanceability = 0.40;
let maxDanceability = 0.75;
let minEnergy = 0.40;
let maxEnergy = 0.75;
let userTrackOffset = 0;

let body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier
});


// EVENT HANDLING FUNCTIONS

function displayInfo(e){
  infoBox.classList.toggle("visible");
  app.classList.toggle("dimmed");
}

function activateBTN(e){
  createBTN.classList.toggle("disabled");
  createBTN.classList.toggle("dimmed");
}

// Update track search parameters on slider input
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
  // Update current tracks with new search params
  getCurrentTracks();
}

// Get user access token
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

// Collect User's liked tracks and store in list
async function getUsersTracks(){
  accessToken = localStorage.getItem('access_token');
  const response = await fetch('https://api.spotify.com/v1/me/tracks?offset='+userTrackOffset+'&limit=3', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  const usersTracks =  await response.json();
  userTrackOffset += 1;
  readTrack(usersTracks.items);
  if (usersTracks.items.length == 50){
    setTimeout(getUsersTracks(), 1000);
  } else {
    getCurrentTracks();
  }
  activateBTN();
}

// Read the track information and store in list of all tracks
async function readTrack(rawTracks){
  console.log(rawTracks);
  let trackIDS = '';
  for (let i = rawTracks.length; i > 0; i--){
    if (trackIDS == ''){
      trackIDS = rawTracks[i-1].track.id;
    } else {
      trackIDS = rawTracks[i-1].track.id + '%2' + trackIDS;
    }
  }
  console.log(trackIDS);
  accessToken = localStorage.getItem('access_token');
  const trackFeat = await fetch('https://api.spotify.com/v1/audio-features?ids='+trackIDS,{
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  })
  const allTrackFeats = await trackFeat.json();
  console.log(allTrackFeats);
  const audioFeatures = allTrackFeats.audio_features;
  console.log(audioFeatures);
  //songArtist = trackInfo.artists[0].name;
  //songAlbum = trackInfo.album.name;
  //songID = trackInfo.id;
  //songName = trackInfo.name;
  //songBPM = audioFeatures[0].tempo;
  // Dyanmically adjust min/max BPM if new extreme tempo params are found
  //if (songBPM > maxBPM){
    //maxTempoSLDR.max = Math.ceil(songBPM);
    //minTempoSLDR.max = Math.ceil(songBPM);
  //} else if (songBPM < minBPM){
    //maxTempoSLDR.min = Math.floor(songBPM);
    //minTempoSLDR.min = Math.floor(songBPM);
  //}
  //songDanceability = audioFeatures[0].danceability;
  //songEnergy = audioFeatures[0].energy;
  //let trackEntry = {name: songName, artist: songArtist, album: songAlbum, id: songID, tempo: songBPM, danceability: songDanceability, energy: songEnergy};
  //allTracks.push(trackEntry);
}

// Create new list of all songs that match search params
function getCurrentTracks(){
  currentTracks = [];
  playlistSize = 0;
  playlistSongs = '';
  for (let i = 0; i < allTracks.length; i ++){
    if (allTracks[i].tempo > minBPM && 
      allTracks[i].tempo < maxBPM && 
      allTracks[i].danceability > minDanceability &&
      allTracks[i].danceability < maxDanceability &&
      allTracks[i].energy > minEnergy &&
      allTracks[i].energy < maxEnergy &&
      playlistSize < maxSize){
        currentTracks.push(allTracks[i]);
        playlistSize++;
        if (playlistSongs.length == 0){
          playlistSongs += '"spotify:track:'+allTracks[i].id+'"';
        } else {
          playlistSongs += ',"spotify:track:'+allTracks[i].id+'"';
        }
      }
  }
  displayTracks();
}

// Create a new playlist when user presses 'create' button
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

// add songs to the newly created playlist
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

// Display tracks that match slider search params in table
function displayTracks(){
  while (trackTBL.firstChild) {
    trackTBL.removeChild(trackTBL.firstChild);
  }
  const trackHeader = document.createElement("tr");
  const titleTH = document.createElement("th");
  const artistTH = document.createElement("th");
  const albumTH = document.createElement("th");
  const bpmTH = document.createElement("th");
  trackHeader.appendChild(titleTH);
  titleTH.textContent = 'TITLE';
  trackHeader.appendChild(artistTH);
  artistTH.textContent = 'ARTIST';
  trackHeader.appendChild(albumTH);
  albumTH.textContent = 'ALBUM';
  trackHeader.append(bpmTH);
  bpmTH.textContent = 'TEMPO';
  trackTBL.appendChild(trackHeader);
  for (let i = 0; i < currentTracks.length; i++){
    const trackEntry = document.createElement("tr");
    const trackTitle = document.createElement("td");
    const trackArtist = document.createElement("td");
    const trackAlbum = document.createElement("td");
    const trackBPM = document.createElement("td");
    trackEntry.appendChild(trackTitle);
    trackTitle.textContent = currentTracks[i].name;
    trackEntry.appendChild(trackArtist);
    trackArtist.textContent = currentTracks[i].artist;
    trackEntry.appendChild(trackAlbum);
    trackAlbum.textContent = currentTracks[i].album;
    trackEntry.append(trackBPM);
    trackBPM.textContent = currentTracks[i].tempo;
    trackTBL.appendChild(trackEntry);
  }
}

// HELPFUL BUG HUNTING FUNCTIONS

function printSongs(){
  console.log(allTracks);
  console.log(currentTracks);
}


// Event listeners live here
infoBtn.addEventListener('click', displayInfo);
infoBox.addEventListener('click', displayInfo);
createBTN.addEventListener('click', createPlaylist);
maxTempoSLDR.addEventListener('input', updateVal);
minTempoSLDR.addEventListener('input', updateVal);
maxDanceSLDR.addEventListener('input', updateVal);
minDanceSLDR.addEventListener('input', updateVal);
maxEnergySLDR.addEventListener('input', updateVal);
minEnergySLDR.addEventListener('input', updateVal);
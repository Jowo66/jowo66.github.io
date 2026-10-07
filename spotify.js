/* Spotify for the Casa Sofia club: browser-only login (Authorization Code + PKCE, no server, no secret) and the Web Playback SDK.
   Needs a Spotify Premium account. Exposes window.Spot. */
(function(g){
'use strict';
const AUTH='https://accounts.spotify.com/authorize',TOK='https://accounts.spotify.com/api/token',API='https://api.spotify.com/v1';
const SCOPES='streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative user-library-read';
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null};
const clientId=()=>String(g.SPOTIFY_CLIENT_ID||LS('jowo.spid')||'').trim();
const redirectUri=()=>location.origin+'/spotify-callback.html';
const b64u=buf=>btoa(String.fromCharCode.apply(null,new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const rnd=n=>{const a=new Uint8Array(n*2);crypto.getRandomValues(a);return b64u(a).slice(0,n)};
const challenge=async v=>b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
const ls={};const on=(k,f)=>{(ls[k]=ls[k]||[]).push(f)};const emit=(k,v)=>(ls[k]||[]).forEach(f=>{try{f(v)}catch(e){console.error(e)}});

const tok=()=>{try{return JSON.parse(LS('jowo.sp')||'null')}catch(e){return null}};
let refreshing=null;
function token(){
  const t=tok();if(!t)return Promise.resolve(null);
  if(Date.now()<t.e-30000)return Promise.resolve(t.a);
  if(!t.r)return Promise.resolve(null);
  if(!refreshing)refreshing=fetch(TOK,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:t.r,client_id:clientId()})})
    .then(async r=>{if(!r.ok){LS('jowo.sp',null);emit('auth',false);return null}const j=await r.json();
      const n={a:j.access_token,r:j.refresh_token||t.r,e:Date.now()+j.expires_in*1000};LS('jowo.sp',JSON.stringify(n));return n.a})
    .catch(()=>null).finally(()=>{refreshing=null});
  return refreshing;
}
async function api(path,opt){
  const a=await token();if(!a)throw new Error('not connected');
  const o=Object.assign({},opt);o.headers=Object.assign({Authorization:'Bearer '+a},o.headers||{});
  const r=await fetch(API+path,o);
  if(r.status===204)return null;
  if(!r.ok){const e=new Error('Spotify '+r.status);e.status=r.status;throw e}
  const tx=await r.text();return tx?JSON.parse(tx):null;
}
const JSONH={'Content-Type':'application/json'};

/* ---- login (popup) ---- */
async function connect(){
  const id=clientId();if(!id)throw new Error('Add your Spotify Client ID first.');
  const w=g.open('about:blank','jowo-spotify','width=480,height=740');
  if(!w)throw new Error('The login popup was blocked. Allow popups for this site and try again.');
  const v=rnd(96),st=rnd(16);LS('jowo.sp.v',v);LS('jowo.sp.s',st);
  w.location.href=AUTH+'?'+new URLSearchParams({client_id:id,response_type:'code',redirect_uri:redirectUri(),code_challenge_method:'S256',code_challenge:await challenge(v),scope:SCOPES,state:st});
}
function disconnect(){try{if(player)player.disconnect()}catch(e){}player=null;deviceId=null;state=null;LS('jowo.sp',null);emit('auth',false)}
g.addEventListener('storage',e=>{if(e.key==='jowo.sp')emit('auth',!!tok())});
g.addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.jowoSpotify)emit('auth',!!tok())});

/* ---- player ---- */
let player=null,deviceId=null,state=null;
function loadSDK(){return new Promise((res,rej)=>{
  if(g.Spotify&&g.Spotify.Player)return res();
  g.onSpotifyWebPlaybackSDKReady=()=>res();
  const s=document.createElement('script');s.src='https://sdk.scdn.co/spotify-player.js';s.onerror=()=>rej(new Error('Could not load the Spotify player (blocked network or ad blocker?).'));document.head.appendChild(s)})}
async function init(){
  if(player)return;
  await loadSDK();
  player=new g.Spotify.Player({name:'Neo-Jowo Underground',getOAuthToken:cb=>{token().then(cb)},volume:.8});
  player.addListener('ready',e=>{deviceId=e.device_id;emit('ready',deviceId)});
  player.addListener('not_ready',()=>{deviceId=null;emit('notready')});
  player.addListener('player_state_changed',s=>{state=s;emit('state',s)});
  ['initialization_error','authentication_error','account_error','playback_error'].forEach(k=>player.addListener(k,e=>emit('error',{kind:k,message:e&&e.message})));
  if(player.activateElement)try{player.activateElement()}catch(e){}
  await player.connect();
}
async function play(ctx){
  if(!deviceId)throw new Error('The player is still starting. Try again in a second.');
  try{await api('/me/player',{method:'PUT',headers:JSONH,body:JSON.stringify({device_ids:[deviceId],play:false})})}catch(e){}
  await api('/me/player/play?device_id='+encodeURIComponent(deviceId),{method:'PUT',headers:JSONH,body:JSON.stringify(ctx.uris?{uris:ctx.uris}:{context_uri:ctx.uri})});
}
const guard=f=>function(){return player?f.apply(null,arguments):Promise.resolve()};
const genreCache={};
async function artistGenres(id){
  if(genreCache[id])return genreCache[id];
  try{const a=await api('/artists/'+encodeURIComponent(id));return genreCache[id]=(a&&a.genres)||[]}catch(e){return[]}
}
const Spot={
  configured:()=>!!clientId(),connected:()=>!!tok(),clientId,redirectUri,setClientId:v=>LS('jowo.spid',String(v||'').trim()||null),
  on,connect,disconnect,init,play,api,artistGenres,
  me:()=>api('/me'),
  playlists:async()=>{const j=await api('/me/playlists?limit=50');return((j&&j.items)||[]).filter(Boolean).map(p=>({id:p.id,name:p.name,uri:p.uri}))},
  liked:async()=>{const j=await api('/me/tracks?limit=50');return((j&&j.items)||[]).map(i=>i.track&&i.track.uri).filter(Boolean)},
  toggle:guard(()=>player.togglePlay()),pause:guard(()=>player.pause()),resume:guard(()=>player.resume()),next:guard(()=>player.nextTrack()),prev:guard(()=>player.previousTrack()),
  activate:()=>{try{player&&player.activateElement&&player.activateElement()}catch(e){}},
  shuffle:b=>deviceId?api('/me/player/shuffle?state='+(b?'true':'false')+'&device_id='+encodeURIComponent(deviceId),{method:'PUT'}):Promise.resolve(),
  state:()=>state,
  /* PKCE helpers, exposed for the callback page and tests */
  _b64u:b64u,_challenge:challenge,_rnd:rnd
};
g.Spot=Spot;
})(window);

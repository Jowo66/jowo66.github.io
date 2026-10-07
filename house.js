/* house.js: a tiny four-on-the-floor house track synthesised live with the Web Audio API.
   No audio files. House.toggle() starts or stops it (browsers need a click first);
   House.shuffle() invents a brand-new track (key, tempo, chords, grooves). */
(function(g){
'use strict';
const mtof=m=>440*Math.pow(2,(m-69)/12);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const SCALES={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10]};
const KEYS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const PROGS=[[0,3,6,4],[0,5,2,6],[0,3,4,0],[5,3,0,4],[0,6,5,6],[0,2,3,6],[0,0,3,4],[3,2,0,0],[0,4,5,3]];
const BASSP=[
 [0,0,1,0, 0,0,1,0, 0,0,1,1, 0,0,1,0],
 [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
 [0,1,1,0, 0,1,1,0, 0,1,1,0, 0,1,1,1],
 [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
 [0,0,1,0, 0,1,0,1, 0,0,1,0, 0,1,0,0]];
const STABP=[
 [0,0,0,1, 0,0,1,0, 0,0,1,0, 0,1,0,0],
 [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,0,0,0],
 [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1],
 [1,0,0,1, 0,0,1,0, 0,0,0,1, 0,0,1,0],
 [0,0,1,0, 0,1,0,0, 0,0,1,0, 0,1,0,1]];
const KICKP=[[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],[1,0,0,0,1,0,0,0,1,0,0,1,1,0,0,0],[1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0]];
const HATP=[[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1],[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],[0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0]];
const PERCP=[null,[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],[0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0],[0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0]];
const ADJ=['Rain','Neon','Midnight','Velvet','Chrome','Lantern','Static','Electric','Basement','Glass','Wet','Slow','Jowo','Koi','Paper'];
const NOUN=['Groove','Circuit','Alley','Pulse','Echo','Shrine','Noodle','Elevator','Skyline','Signal','Disco','Ritual','Drift','Hologram','Taxi'];
let ac=null,master,duck,send,noise,timer=0,step=0,nextT=0,t0=0,on=false,nTrack=0;
let T=null,SPB=60/124,S16=SPB/4;
const subs=[],tsubs=[];
function makeTrack(first){
  const mode=first?'minor':pick(Object.keys(SCALES)),sc=SCALES[mode],key=first?9:Math.floor(Math.random()*12);
  const bpm=first?124:110+Math.floor(Math.random()*25);
  const prog=first?[0,3,6,4]:pick(PROGS),root=31+(((key-31)%12)+12)%12;   /* around A1 */
  const note=(d,oct)=>root+sc[d%7]+12*Math.floor(d/7)+oct;
  const chords=prog.map(d=>({b:(()=>{let b=note(d,12);while(b>51)b-=12;while(b<38)b+=12;return b})(),ch:[note(d,24),note(d+2,24),note(d+4,24),note(d+6,24)]}));
  nTrack++;
  return{name:(first?'Rain Groove':pick(ADJ)+' '+pick(NOUN)),no:nTrack,key:KEYS[key]+' '+(mode==='minor'?'min':mode),bpm,chords,
    bass:first?BASSP[0]:pick(BASSP),stab:first?STABP[0]:pick(STABP),cut:first?1100:700+Math.random()*1100,
    wave:first?'sawtooth':pick(['sawtooth','sawtooth','square']),hats:Math.random()<.5,wet:.2+Math.random()*.25,
    arp:first?2:Math.floor(Math.random()*4),kickp:first?KICKP[0]:pick(KICKP),hatp:first?HATP[0]:pick(HATP),percp:first?null:pick(PERCP),bwave:first?'sawtooth':pick(['sawtooth','square','triangle']),bcut:first?900:500+Math.random()*1400,clap:first?[4,12]:pick([[4,12],[4,12],[4,12,15],[4,10,12]]),open:first?true:Math.random()<.8,swing:first?0:Math.random()*.012};
}
function setTempo(){SPB=60/T.bpm;S16=SPB/4}
T=makeTrack(true);setTempo();
function init(){
  const AC=g.AudioContext||g.webkitAudioContext;if(!AC)return false;
  ac=new AC();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  master=ac.createGain();master.gain.value=0;master.connect(comp);comp.connect(ac.destination);
  duck=ac.createGain();duck.connect(master);
  const dl=ac.createDelay(1);dl.delayTime.value=.375;const fb=ac.createGain();fb.gain.value=.34;
  const wet=ac.createGain();wet.gain.value=.3;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
  send=ac.createGain();send.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(wet);wet.connect(duck);
  House._dl=dl;House._wet=wet;
  noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return true;
}
function env(gn,t,a,peak,dec){gn.gain.setValueAtTime(0.0001,t);gn.gain.linearRampToValueAtTime(peak,t+a);gn.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
function kick(t){
  const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';
  o.frequency.setValueAtTime(165,t);o.frequency.exponentialRampToValueAtTime(46,t+.11);
  gn.gain.setValueAtTime(1,t);gn.gain.exponentialRampToValueAtTime(.001,t+.42);
  o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.45);
  duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(.22,t);duck.gain.linearRampToValueAtTime(1,t+SPB*.72);
}
function nz(t,type,freq,q,peak,dec,dest){
  const s=ac.createBufferSource();s.buffer=noise;s.loop=true;
  const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
  const gn=ac.createGain();env(gn,t,.002,peak,dec);s.connect(f);f.connect(gn);gn.connect(dest);s.start(t,Math.random());s.stop(t+dec+.05);
}
function clap(t){[0,.012,.024].forEach((d,i)=>nz(t+d,'bandpass',1500,1.2,i==2?.55:.3,i==2?.16:.03,master))}
function hat(t,open){nz(t,'highpass',7500,.7,open?.22:.12,open?.2:.045,duck)}
function bass(t,m,len){
  const o=ac.createOscillator(),f=ac.createBiquadFilter(),gn=ac.createGain();
  o.type=T.bwave;o.frequency.value=mtof(m);f.type='lowpass';f.Q.value=6;
  f.frequency.setValueAtTime(T.bcut,t);f.frequency.exponentialRampToValueAtTime(140,t+len);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.34,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(f);f.connect(gn);gn.connect(duck);o.start(t);o.stop(t+len+.05);
}
function stab(t,notes,cut,wave){
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.Q.value=3;
  f.frequency.setValueAtTime(cut,t);f.frequency.exponentialRampToValueAtTime(cut*.35,t+.22);
  env(gn,t,.005,wave==='square'?.06:.085,.22);f.connect(gn);gn.connect(duck);gn.connect(send);
  notes.forEach(m=>[-7,7].forEach(dt=>{const o=ac.createOscillator();o.type=wave;o.frequency.value=mtof(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+.3)}));
}
function pluck(t,m){
  const o=ac.createOscillator(),gn=ac.createGain();o.type='triangle';o.frequency.value=mtof(m+12);
  env(gn,t,.003,.07,.12);o.connect(gn);gn.connect(duck);gn.connect(send);o.start(t);o.stop(t+.16);
}
function sched(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4;
  t+=(s%2?T.swing:0);
  if(T.kickp[s])kick(t);
  if(T.clap.indexOf(s)>=0)clap(t);
  if(T.hatp[s]&&(T.open||s%4!==2))hat(t,s%4===2);else if((phrase>0||T.hats)&&s%2===1)hat(t,false);
  if(T.percp&&T.percp[s])nz(t,'bandpass',3200,4,.16,.05,duck);
  if(T.bass[s])bass(t,s===15?ch.b+12:ch.b,S16*1.7);
  if(T.stab[s]&&phrase!==3)stab(t,ch.ch,T.cut+phrase*450+(s===13?350:0),T.wave);
  if(T.arp&&phrase>=4-T.arp&&s%2===0)pluck(t,ch.ch[(s/2)%4]);
  if(phrase===3&&bar%4===3&&s>=8&&s%2===0)nz(t,'bandpass',2200,1,.18,.08,master);
}
function swoosh(){
  const t=ac.currentTime,s=ac.createBufferSource();s.buffer=noise;s.loop=true;
  const f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=2;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+.45);
  const gn=ac.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.35,t+.35);gn.gain.exponentialRampToValueAtTime(.0001,t+.55);
  s.connect(f);f.connect(gn);gn.connect(master);s.start(t);s.stop(t+.6);
}
function tick(){while(nextT<ac.currentTime+.14){sched(step,nextT);nextT+=S16;step++}}
const House={
  get bpm(){return T.bpm},
  get track(){return T},
  get on(){return on},
  phase(){return on&&ac?Math.max(0,(ac.currentTime-t0)/SPB):-1},
  onchange(fn){subs.push(fn)},
  ontrack(fn){tsubs.push(fn)},
  toggle(){
    if(!ac&&!init())return false;
    if(!on){
      ac.resume();step=0;nextT=ac.currentTime+.1;t0=nextT;on=true;
      master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(.62,ac.currentTime+.4);
      tick();timer=setInterval(tick,25);
    }else{
      on=false;clearInterval(timer);master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(0,ac.currentTime+.25);
    }
    subs.forEach(f=>{try{f(on)}catch(e){}});return on;
  },
  shuffle(){
    T=makeTrack(false);setTempo();if(ac&&on)swoosh();
    if(ac&&on){step=0;nextT=Math.max(nextT,ac.currentTime+.05);t0=nextT;if(House._wet)House._wet.gain.value=T.wet}
    tsubs.forEach(f=>{try{f(T)}catch(e){}});return T;
  }
};
g.House=House;
})(window);

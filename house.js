/* house.js: a tiny four-on-the-floor house track synthesised live with the Web Audio API.
   No audio files. window.House.toggle() starts or stops it (browsers need a click first). */
(function(g){
'use strict';
const BPM=124,SPB=60/BPM,S16=SPB/4;
const mtof=m=>440*Math.pow(2,(m-69)/12);
/* one chord per bar: Am7, Dm7, G7, Cmaj7 */
const PROG=[{r:33,b:45,ch:[57,60,64,67]},{r:38,b:50,ch:[57,62,65,69]},{r:31,b:43,ch:[55,59,62,65]},{r:36,b:48,ch:[55,60,64,67]}];
const BASS=[0,0,1,0, 0,0,1,0, 0,0,1,1, 0,0,1,0];
const STAB=[0,0,0,1, 0,0,1,0, 0,0,1,0, 0,1,0,0];
let ac=null,master,duck,send,noise,timer=0,step=0,nextT=0,t0=0,on=false;
const subs=[];
function init(){
  const AC=g.AudioContext||g.webkitAudioContext;if(!AC)return false;
  ac=new AC();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  master=ac.createGain();master.gain.value=0;master.connect(comp);comp.connect(ac.destination);
  duck=ac.createGain();duck.connect(master);
  const dl=ac.createDelay(1);dl.delayTime.value=SPB*.75;const fb=ac.createGain();fb.gain.value=.34;
  const wet=ac.createGain();wet.gain.value=.3;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
  send=ac.createGain();send.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(wet);wet.connect(duck);
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
  o.type='sawtooth';o.frequency.value=mtof(m);f.type='lowpass';f.Q.value=6;
  f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(140,t+len);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.34,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(f);f.connect(gn);gn.connect(duck);o.start(t);o.stop(t+len+.05);
}
function stab(t,notes,cut){
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.Q.value=3;
  f.frequency.setValueAtTime(cut,t);f.frequency.exponentialRampToValueAtTime(cut*.35,t+.22);
  env(gn,t,.005,.085,.22);f.connect(gn);gn.connect(duck);gn.connect(send);
  notes.forEach((m,i)=>[-7,7].forEach(dt=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+.3)}));
}
function pluck(t,m){
  const o=ac.createOscillator(),gn=ac.createGain();o.type='triangle';o.frequency.value=mtof(m+12);
  env(gn,t,.003,.07,.12);o.connect(gn);gn.connect(duck);gn.connect(send);o.start(t);o.stop(t+.16);
}
function sched(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=PROG[bar%4],phrase=Math.floor(bar/4)%4;
  if(bar>=1||s>=0){if(s%4===0)kick(t)}
  if(s===4||s===12)clap(t);
  if(s%4===2)hat(t,true);else if(phrase>0&&s%2===1)hat(t,false);
  if(phrase!==0||bar>=0){if(BASS[s])bass(t,s===15?ch.b+12:ch.b,S16*1.7)}
  if(STAB[s]&&phrase!==3)stab(t,ch.ch,1100+phrase*500+(s===13?400:0));
  if(phrase>=2&&s%2===0)pluck(t,ch.ch[(s/2)%4]);
  if(phrase===3&&bar%4===3&&s>=8&&s%2===0)nz(t,'bandpass',2200,1,.18,.08,master);
}
function tick(){while(nextT<ac.currentTime+.14){sched(step,nextT);nextT+=S16;step++}}
const House={
  bpm:BPM,
  get on(){return on},
  phase(){return on&&ac?Math.max(0,(ac.currentTime-t0)/SPB):-1},
  onchange(fn){subs.push(fn)},
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
  }
};
g.House=House;
})(window);

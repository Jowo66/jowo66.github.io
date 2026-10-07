/* house.js: a tiny four-on-the-floor house track synthesised live with the Web Audio API.
   No audio files. House.toggle() starts or stops it (browsers need a click first);
   House.shuffle() invents a brand-new track (key, tempo, chords, grooves). */
(function(g){
'use strict';
const mtof=m=>440*Math.pow(2,(m-69)/12);
let R=Math.random;
const pick=a=>a[Math.floor(R()*a.length)];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const SCALES={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],major:[0,2,4,5,7,9,11],mixolydian:[0,2,4,5,7,9,10]};
const SOULP={major:[[0,3,5,4],[1,4,0,5],[0,5,3,4],[3,2,1,4],[0,2,3,4],[0,3,1,4]],mixolydian:[[0,3,0,6],[0,6,3,0],[0,3,5,6]],dorian:[[1,4,0,0],[0,3,0,4],[0,3,6,3],[1,4,1,4]]};
const SBASS=[[1,0,0,1,0,0,1,0, 0,1,0,0,1,0,0,0],[1,0,0,0,0,1,0,0, 1,0,0,1,0,0,0,1],[1,0,1,0,0,0,1,0, 0,0,1,0,0,1,0,0],[1,0,0,0,1,0,0,1, 0,0,1,0,0,0,1,0]];
const SKEYS=[[1,0,0,0,0,0,1,0, 0,0,1,0,0,1,0,0],[1,0,0,1,0,0,0,0, 1,0,0,0,0,1,0,0],[1,0,0,0,0,1,0,0, 0,0,1,0,0,0,1,0],[1,0,1,0,0,0,0,1, 0,0,1,0,0,0,0,0]];
const SADJ=['Sunday','Velvet','Golden','Honey','Midnight','Amber','Silk','Warm','Slow','Gospel','Lantern','Candle'];
const SNOUN=['Chapel','Kitchen','Balcony','Rooftop','Sunrise','Rhodes','Love Letter','Daydream','Porch','Soul Train','Jowo Sunset','Parlour'];
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
const LADJ=['Casa','Fuego','Noche','Caliente','Dulce','Bogotá','Havana','Luna','Sol','Mambo','Sabor','Candela'],LNOUN=['Sofia','Terraza','Rumba','Calle','Fiesta','Medianoche','Montuno','Tumbao','Azotea','Cumbia','Balcón','Corazón'];
const AADJ=['Savannah','Baobab','Kalahari','Lagos','Harmattan','Sahara','Orisha','Accra','Kilimanjaro','Palm Wine','Jollof','Zulu'],ANOUN=['Sunrise','Drum Circle','Ritual','Dust','Night Market','Rain','Dancefloor','Talking Drum','Ancestors','Horizon','Gathering','Ember'];
const LMONT=[[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],[1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,1],[0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0]];
const LTUMB=[[0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1],[1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0],[0,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0]];
const LCONG=[[0,0,1,1,2,0,1,0,0,0,1,1,2,0,1,1],[0,0,0,1,2,0,1,0,0,0,0,1,2,0,1,0]];
const ABASS=[[1,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0],[1,0,1,0,0,1,0,0,1,0,0,0,1,0,1,0]];
const AKAL=[[1,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0],[0,1,0,0,1,0,1,0,0,0,1,0,0,1,0,0]];
const ATOM=[[0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1],[0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1]];
const ADJ=['Rain','Neon','Midnight','Velvet','Chrome','Lantern','Static','Electric','Basement','Glass','Wet','Slow','Jowo','Koi','Paper'];
const NOUN=['Groove','Circuit','Alley','Pulse','Echo','Shrine','Noodle','Elevator','Skyline','Signal','Disco','Ritual','Drift','Hologram','Taxi'];
let ac=null,master,duck,send,noise,timer=0,step=0,nextT=0,t0=0,on=false;
let T=null,SPB=60/124,S16=SPB/4;
const subs=[],tsubs=[];
const PK='jowo.plays.v1';
function readPlays(){try{return JSON.parse(localStorage.getItem(PK)||'{}')||{}}catch(e){return{}}}
function bumpPlay(){try{const m=readPlays();m[T.id]=(m[T.id]||0)+1;localStorage.setItem(PK,JSON.stringify(m))}catch(e){}}
function makeTrack(seed){
  const first=seed===0;
  R=mulberry(first?7:seed);
  const soul=!first&&R()<.5;
  const mode=first?'minor':soul?pick(['major','major','mixolydian','dorian']):pick(['minor','dorian','phrygian']),sc=SCALES[mode],key=first?9:Math.floor(R()*12);
  const bpm=first?124:soul?116+Math.floor(R()*10):110+Math.floor(R()*25);
  const prog=first?[0,3,6,4]:soul?pick(SOULP[mode]||SOULP.major):pick(PROGS),root=31+(((key-31)%12)+12)%12;
  const note=(d,oct)=>root+sc[d%7]+12*Math.floor(d/7)+oct;
  const chords=prog.map(d=>({b:(()=>{let b=note(d,12);while(b>51)b-=12;while(b<38)b+=12;return b})(),ch:[note(d,24),note(d+2,24),note(d+4,24),note(d+6,24)],ext:[note(d,12),note(d+2,24),note(d+4,24),note(d+6,24),note(d+8,24)]}));
  const t={id:String(seed),seed,kind:soul?'soul':'club',name:first?'Rain Groove':soul?pick(SADJ)+' '+pick(SNOUN):pick(ADJ)+' '+pick(NOUN),key:KEYS[key]+' '+(mode==='minor'?'min':mode),bpm,chords,
    bass:first?BASSP[0]:pick(BASSP),stab:first?STABP[0]:pick(STABP),cut:first?1100:700+R()*1100,
    wave:first?'sawtooth':pick(['sawtooth','sawtooth','square']),hats:R()<.5,wet:.2+R()*.25,
    arp:first?2:Math.floor(R()*4),kickp:first?KICKP[0]:pick(KICKP),hatp:first?HATP[0]:pick(HATP),percp:first?null:pick(PERCP),bwave:first?'sawtooth':pick(['sawtooth','square','triangle']),bcut:first?900:500+R()*1400,clap:first?[4,12]:pick([[4,12],[4,12],[4,12,15],[4,10,12]]),
    open:first?true:R()<.8,swing:first?0:R()*.012,
    sbass:pick(SBASS),skeys:pick(SKEYS),pad:R()<.8,mel:Array.from({length:8},()=>Math.floor(R()*5)),melOn:R()<.7};
  if(soul){t.swing=.022+R()*.014;t.wet=.3+R()*.2}
  if(!first&&!soul){
    /* a separate roll so earlier seeds keep their sound; some club seeds become latin or afro house */
    const kr=mulberry((seed*2654435761)>>>0)();
    if(kr<.5){R=mulberry((seed^0x5bd1e995)>>>0);
      if(kr<.27){t.kind='latin';t.name=pick(LADJ)+' '+pick(LNOUN);t.bpm=120+Math.floor(R()*8);t.swing=.004+R()*.008;t.mont=pick(LMONT);t.tumb=pick(LTUMB);t.cong=pick(LCONG);t.brass=R()<.65;t.cow=R()<.6;t.wet=.22+R()*.12}
      else{t.kind='afro';t.name=pick(AADJ)+' '+pick(ANOUN);t.bpm=116+Math.floor(R()*8);t.swing=.018+R()*.012;t.abass=pick(ABASS);t.akal=pick(AKAL);t.tom=pick(ATOM);t.wet=.3+R()*.15;t.voice=R()<.75}
    }}
  R=Math.random;return t;
}
function newSeed(){return 1+Math.floor(Math.random()*999999999)}
function setTempo(){SPB=60/T.bpm;S16=SPB/4}
T=makeTrack(0);setTempo();
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
function soft(t,gainK){const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(48,t+.14);gn.gain.setValueAtTime(.8*gainK,t);gn.gain.exponentialRampToValueAtTime(.001,t+.34);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.38);duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(.45,t);duck.gain.linearRampToValueAtTime(1,t+SPB*.5)}
function sbass(t,m,len){
  const gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=1.5;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.42,t+.015);gn.gain.setTargetAtTime(.0001,t+len*.55,len*.22);
  [['sine',0,1],['triangle',0,.35]].forEach(([ty,dt,k])=>{const o=ac.createOscillator();o.type=ty;o.frequency.setValueAtTime(mtof(m),t);o.detune.value=dt;const g2=ac.createGain();g2.gain.value=k;o.connect(g2);g2.connect(f);o.start(t);o.stop(t+len+.4)});
  f.connect(gn);gn.connect(duck);
}
function rhodes(t,notes,vel){
  notes.forEach((m,i)=>{
    const tt=t+i*.011,gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=2600;
    gn.gain.setValueAtTime(.0001,tt);gn.gain.linearRampToValueAtTime(.075*vel,tt+.006);gn.gain.exponentialRampToValueAtTime(.0001,tt+1.1);
    const o=ac.createOscillator();o.type='sine';o.frequency.value=mtof(m);o.connect(f);
    const o2=ac.createOscillator();o2.type='sine';o2.frequency.value=mtof(m)*2.003;const g2=ac.createGain();g2.gain.setValueAtTime(.35,tt);g2.gain.exponentialRampToValueAtTime(.001,tt+.18);o2.connect(g2);g2.connect(f);
    f.connect(gn);gn.connect(duck);gn.connect(send);o.start(tt);o.stop(tt+1.2);o2.start(tt);o2.stop(tt+.3);
  });
}
function padv(t,notes,len){
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1300,t+len*.5);f.frequency.linearRampToValueAtTime(600,t+len);f.Q.value=.7;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.05,t+len*.25);gn.gain.linearRampToValueAtTime(.0001,t+len);
  notes.forEach(m=>[-9,9].forEach(dt=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m-12);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+len+.1)}));
  f.connect(gn);gn.connect(duck);gn.connect(send);
}
function lead(t,m,len){
  const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain();
  o.type='triangle';o.frequency.value=mtof(m);lfo.frequency.value=5.2;lg.gain.value=5;lfo.connect(lg);lg.connect(o.detune);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.06,t+.03);gn.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(gn);gn.connect(duck);gn.connect(send);o.start(t);lfo.start(t);o.stop(t+len+.05);lfo.stop(t+len+.05);
}
function conga(t,type){const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';const f0=type===2?420:300,f1=type===2?300:215;
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+.07);gn.gain.setValueAtTime(type===2?.5:.6,t);gn.gain.exponentialRampToValueAtTime(.001,t+(type===2?.09:.18));
  o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.22);if(type===2)nz(t,'bandpass',2600,2,.2,.04,master)}
function clave(t){const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.value=2450;env(gn,t,.001,.26,.07);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.1)}
function cowbell(t,acc){[562,845].forEach(fq=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),gn=ac.createGain();o.type='square';o.frequency.value=fq;f.type='bandpass';f.frequency.value=fq*1.2;f.Q.value=1.2;env(gn,t,.002,acc?.13:.08,.11);o.connect(f);f.connect(gn);gn.connect(master);o.start(t);o.stop(t+.15)})}
function timbale(t,hi){nz(t,'bandpass',hi?3600:2400,1.5,.25,.07,master);const o=ac.createOscillator(),gn=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(hi?900:520,t);o.frequency.exponentialRampToValueAtTime(hi?600:340,t+.06);env(gn,t,.001,.2,.1);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.14)}
function piano(t,m,vel){const gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(900,t+.4);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.2*vel,t+.004);gn.gain.exponentialRampToValueAtTime(.0001,t+.5);
  [['triangle',1],['sine',2.001],['sine',3.003]].forEach(([ty,k],i)=>{const o=ac.createOscillator(),g2=ac.createGain();o.type=ty;o.frequency.value=mtof(m)*k;g2.gain.value=i?.28/i:1;o.connect(g2);g2.connect(f);o.start(t);o.stop(t+.55)});
  f.connect(gn);gn.connect(master);if(send)gn.connect(send)}
function tom(t,fq){const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.setValueAtTime(fq*1.6,t);o.frequency.exponentialRampToValueAtTime(fq,t+.08);gn.gain.setValueAtTime(.5,t);gn.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.28)}
function kalimba(t,m){[[1,.22,.5],[5.4,.05,.12]].forEach(([k,pk,dc])=>{const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.value=mtof(m)*k;env(gn,t,.002,pk,dc);o.connect(gn);gn.connect(master);if(send)gn.connect(send);o.start(t);o.stop(t+dc+.1)})}
function voice(t,m,len){const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain(),sum=ac.createGain();o.type='sawtooth';o.frequency.value=mtof(m-12);lfo.frequency.value=5.2;lg.gain.value=9;lfo.connect(lg);lg.connect(o.detune);
  [[720,5],[1180,6]].forEach(([fq,q])=>{const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;f.Q.value=q;o.connect(f);f.connect(sum)});
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.2,t+.18);gn.gain.exponentialRampToValueAtTime(.0001,t+len);sum.connect(gn);gn.connect(master);if(send)gn.connect(send);o.start(t);lfo.start(t);o.stop(t+len+.05);lfo.stop(t+len+.05)}
function schedLatin(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4;
  t+=(s%2?T.swing:0);
  if(s%4===0)kick(t);
  if(s===4||s===12)nz(t,'bandpass',1900,3,.2,.05,master);
  nz(t,'highpass',8500,.5,s%2?.085:.05,.03,duck);
  if(s===14&&bar%2)hat(t,true);
  if(s===0||s===3||s===6||s===10||s===12)clave(t);
  if(T.cong[s])conga(t,T.cong[s]);
  if(T.cow&&phrase>=1&&(s===0||s===6||s===8||s===14))cowbell(t,s===0);
  if(phrase===3&&bar%4===3&&s>=12)timbale(t,s%2===0);
  if(T.tumb[s])sbass(t,s===14?ch.b+7:ch.b,S16*(s===6?3.4:2.6));
  if(T.mont[s]){let k=0;for(let i=0;i<s;i++)if(T.mont[i])k++;piano(t,ch.ch[(k+bar)%4],.8+(s%3)*.1)}
  if(T.brass&&phrase>=2&&(s===3||s===10))stab(t,ch.ch.slice(0,3),2400,'sawtooth');
  if(s===0&&T.pad)padv(t,ch.ch,S16*16);
}
function schedAfro(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4;
  t+=(s%2?T.swing:0);
  if(s%4===0)soft(t,1);
  if(s===4||s===12)nz(t,'bandpass',1700,2.5,.22,.06,master);
  nz(t,'highpass',s%2?8000:9000,.5,s%2?.09:.04,.035,duck);
  if(s===6||s===14)hat(t,true);
  if(T.tom[s])tom(t,[150,115,88][(s+bar)%3]);
  if(T.abass[s])sbass(t,s%8===5?ch.b+7:ch.b,S16*2.2);
  if(phrase>=1&&T.akal[s])kalimba(t,ch.ch[0]+[0,2,4,7,9][T.mel[(s+bar)%8]]);
  if(T.voice&&phrase>=2&&(s===0||s===8)&&bar%2===0)voice(t,ch.ch[((s/8)+bar)%4|0],S16*7);
  if(s===0&&T.pad)padv(t,ch.ch,S16*16);
}
function schedSoul(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4;
  t+=(s%2?T.swing:0);
  if(s%4===0)soft(t,s===0?1:.85);
  if(s===10&&(bar%2))soft(t,.45);
  if(s===4||s===12)nz(t,'bandpass',1100,1,.3,.14,master);
  if(s%2===0)nz(t,'highpass',9000,.5,.04,.03,duck);
  if(s%2===1)nz(t,'highpass',8000,.5,phrase>0?.07:.045,.04,duck);
  if(s===6||s===14)hat(t,true);
  if(T.sbass[s])sbass(t,s===15?ch.b+12:ch.b,S16*(s%4===3?2.4:3.2));
  if(T.skeys[s]&&phrase!==3)rhodes(t,ch.ext.slice(s%8===0?0:1),.8+((s*7+bar)%3)*.12);
  if(s===0&&T.pad)padv(t,ch.ch,S16*16);
  if(T.melOn&&phrase>=1&&s%2===0&&((s/2+bar)%3!==1)){const sc=[0,2,4,7,9];lead(t,ch.ch[0]+12+sc[T.mel[(s/2)%8]],S16*3.2)}
}
function sched(n,t){
  if(T.kind==='soul')return schedSoul(n,t);
  if(T.kind==='latin')return schedLatin(n,t);
  if(T.kind==='afro')return schedAfro(n,t);
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
function apply(nt){
  T=nt;setTempo();if(ac&&on)swoosh();
  if(ac&&on){bumpPlay();step=0;nextT=Math.max(nextT,ac.currentTime+.05);t0=nextT;if(House._wet)House._wet.gain.value=T.wet}
  tsubs.forEach(f=>{try{f(T)}catch(e){}});return T;
}
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
      ac.resume();step=0;nextT=ac.currentTime+.1;t0=nextT;on=true;bumpPlay();
      master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(.62,ac.currentTime+.4);
      tick();timer=setInterval(tick,25);
    }else{
      on=false;clearInterval(timer);master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(0,ac.currentTime+.25);
    }
    subs.forEach(f=>{try{f(on)}catch(e){}});return on;
  },
  shuffle(){return apply(makeTrack(newSeed()))},
  make(x){return(x&&typeof x==='object')?JSON.parse(JSON.stringify(x)):makeTrack(+x)},
  load(x){return apply(House.make(x))},
  plays(id){return readPlays()[id]||0}
};
g.House=House;
})(window);

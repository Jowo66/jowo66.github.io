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
const LMONT=[[1,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0],[0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1],[1,0,1,0,0,1,0,0,1,0,0,1,0,1,0,0]];
const LTUMB=[[0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1],[0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0],[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1]];
const LCONG=[[0,0,3,0,2,2,0,0,0,0,3,0,2,2,0,1],[0,0,3,3,2,0,1,0,0,0,3,3,2,0,1,1]];
const ABASS=[[1,0,0,0,0,0,0,0,1,0,0,0],[1,0,0,0,0,0,0,0,0,0,1,0]];
const AKAL=[[1,0,1,1,0,1,0,1,1,0,1,0],[1,0,0,1,0,1,1,0,0,1,0,1]];
const ATOM=[[0,0,1,0,0,1,0,1,0,0,1,0],[0,1,0,0,1,0,0,0,1,0,1,0]];
const CADJ=['Plastic','Midnight','Tokyo','Neon','Resort','Marine','Summer','Bayside','Shibuya','Cruising','Pink','Seaside'],CNOUN=['Lovers','Drive','Rendezvous','Highway','Boulevard','Windshield','Skyline','Aquarium','Cassette','Lounge','Sunset','Heartbeat'];
const GADJ=['Eski','Cold','Concrete','Estate','Night Bus','Bare','Rooftop','Pirate','Council','Chrome','Stormy','Dark'],GNOUN=['Sub','Sixteens','Radio','Freestyle','Cypher','Clash','Boom','Lick','Riddim','Wave','Block','Flex'];
const MADJ=['Soweto','Joburg','Shebeen','Township','Sunday','Rooftop','Sunshine','Kasi','Mzansi','Velvet','Weekend','Gauteng'],MNOUN=['Piano','Sundowner','Log Drum','Braai','Groove','Vibes','Lounge','Taxi Rank','Sessions','Dance','Whistle','Weekender'];
const QADJ=['Durban','Dark','Umlazi','Shadow','Bass','Wild','Midnight','Toxic','Hollow','Concrete','Rave','Thunder'],QNOUN=['Madness','Drum','Siren','Ritual','Beast','Warehouse','Rumble','Hustle','Heat','Chant','Boom','Trap'];
const CBASS=[[1,4,2,1,0,4,3,0,1,4,2,0,1,4,2,3],[1,0,2,4,1,0,2,0,3,4,1,2,0,1,4,2],[1,4,1,2,0,3,4,0,1,0,2,4,3,0,2,4]];
const CCOMP=[[0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0],[0,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0],[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]];
const CPROG=[[3,4,2,5],[3,2,1,4],[0,5,3,4],[3,2,5,1]];
const GPROG=[[0,0,5,5],[0,5,3,4],[0,3,0,6],[0,0,3,3]];
const GK=[[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0]];
const GSUB=[[2,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[2,0,0,0,0,0,0,1,0,0,2,0,0,0,0,0]];
const GST=[[0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],[0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0]];
const ALOG=[[1,0,0,1,0,0,2,0,0,1,0,0,3,0,1,0],[1,0,0,0,0,1,0,0,2,0,0,1,0,0,3,0],[1,0,1,0,0,0,2,0,0,0,3,0,1,0,0,2]];
const APIA=[[0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,1],[1,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0]];
const AMP=[[1,4,0,0],[0,3,0,4],[0,3,6,3],[1,4,1,4],[0,5,3,4]];
const QK=[[1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,1],[1,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0],[1,0,1,0,0,0,1,0,1,0,0,1,0,0,1,0]];
const QR=[[0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,1],[0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1]];
const QT=[[0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0]];
const QB=[[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0]];
const QS=[[0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0]];
const AWH=[[0,0,0,0,0,0,0,0,1,0,0,1,0,0,2,0],[0,0,1,0,0,0,2,0,0,0,0,0,1,0,0,2],[1,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0]];
const QPROG=[[0,0,3,0],[0,5,0,5],[0,0,6,5],[0,3,0,4]];
/* extra patterns for the sharpened genres (12-slot ones are triplet grids: 3 slots per beat) */
const SKICK=[[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],[1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0]];
const CKICK=[[1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0],[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0]];
const AKICK=[[1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0]];
const CASC=[1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0];
const CTOPA=[0,3,6,8,11,14],CTOPB=[0,3,6,10,12];
const PENT=[0,2,4,7,9],PENTM=[0,3,5,7,10];
const BMART=[0,0,1,0,2,0,1,0,0,0,1,0,2,0,1,2];
const ABONG=[0,0,1,0,0,2,0,1,0,0,1,0,0,2,0,1];
const AGOG=[1,0,2,0,1,2,0,1,0,2,0,1],DJMB=[1,0,3,0,2,3,0,0,1,0,2,3],AHRN=[1,0,0,0,1,0,0,1,0,0,1,0];
const SAXP=[[0,3,6,10,12],[2,6,8,11,14]],QT2=[0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1];
const PPROG=[[0,0,5,5],[0,5,0,4],[0,0,6,5],[0,3,0,5]],PADJ=['Favela','Baile','Carioca','Rio','Fumaça','Madrugada','Sombra','Morro','Noite','Fluxo'],PNOUN=['Phonk','Tamborzão','Pancadão','Cowbell','Mandela','Batida','Drift','Rolê','Sirene','Beat'];
const PHK=[[0,3,8,11],[0,3,8,11,14],[0,3,6,8,11],[0,3,8,10,11]];
const PCM=[[0,3,6,8,11,14],[0,2,3,6,8,10,11,14],[0,3,4,6,8,11,12,14],[0,3,6,7,8,11,14,15]],PCH=[[3,11],[3,7,11],[6,14],[3,6,11,14]];
function chordsFor(sc,root,prog){
  const note=(d,oct)=>root+sc[d%7]+12*Math.floor(d/7)+oct;
  return prog.map(d=>({b:(()=>{let b=note(d,12);while(b>51)b-=12;while(b<38)b+=12;return b})(),ch:[note(d,24),note(d+2,24),note(d+4,24),note(d+6,24)],ext:[note(d,12),note(d+2,24),note(d+4,24),note(d+6,24),note(d+8,24)],x11:note(d+3,24),x13:note(d+5,24)}));
}
function retune(t,mode,prog,k){
  t.chords=chordsFor(SCALES[mode],31+(((k-31)%12)+12)%12,prog);t.key=KEYS[k]+' '+(mode==='minor'?'min':mode);
}
/* city pop, grime, amapiano, gqom: configured after the base track, on the same seeded roll as latin/afro */
function newKind(t,kr){
  const band=(kr-.5)/.28,k=Math.floor(R()*12);
  if(band<.25){
    t.kind='citypop';t.genre='City pop';t.name=pick(CADJ)+' '+pick(CNOUN);retune(t,R()<.8?'major':'mixolydian',pick(CPROG),k);
    t.bpm=102+Math.floor(R()*16);t.swing=.006+R()*.008;t.cbass=pick(CBASS);t.ccomp=pick(CCOMP);t.cbrass=R()<.6;t.pad=R()<.85;t.wet=.28+R()*.1;
  }else if(band<.5){
    t.kind='grime';t.genre='Grime';t.name=pick(GADJ)+' '+pick(GNOUN);retune(t,R()<.7?'minor':'phrygian',pick(GPROG),k);
    t.bpm=138+Math.floor(R()*5);t.swing=0;t.gk=pick(GK);t.gsub=pick(GSUB);t.gst=pick(GST);t.pad=R()<.6;t.wet=.14+R()*.08;
  }else if(band<.75){
    t.kind='amapiano';t.genre='Amapiano';t.name=pick(MADJ)+' '+pick(MNOUN);const md=R()<.6?'dorian':'minor';retune(t,md,pick(md==='dorian'?AMP:[[0,3,0,4],[0,5,3,4],[0,0,3,4]]),k);
    t.bpm=108+Math.floor(R()*7);t.swing=(.004+R()*.008)*2;t.alog=pick(ALOG);t.apia=pick(APIA);t.pad=R()<.7;t.voice=R()<.6;t.wet=.3+R()*.1;t.awh=pick(AWH);
  }else{
    t.kind='gqom';t.genre='Gqom';t.name=pick(QADJ)+' '+pick(QNOUN);retune(t,R()<.6?'minor':'phrygian',pick(QPROG),k);
    t.bpm=122+Math.floor(R()*9);t.swing=.002+R()*.006;t.qk=pick(QK);t.qr=pick(QR);t.qt=pick(QT);t.qb=pick(QB);t.qs=pick(QS);t.voice=R()<.5;t.wet=.14+R()*.1;
  }
}
const ADJ=['Rain','Neon','Midnight','Velvet','Chrome','Lantern','Static','Electric','Basement','Glass','Wet','Slow','Jowo','Koi','Paper'];
const NOUN=['Groove','Circuit','Alley','Pulse','Echo','Shrine','Noodle','Elevator','Skyline','Signal','Disco','Ritual','Drift','Hologram','Taxi'];
/* per-genre mix colour: ls/hs = low/high shelf dB, lp = master lowpass Hz, dk = sidechain depth (lower = deeper pump), dl = pump release in beats, rev = reverb return, trim = level */
const MIX={
  club:{ls:1,hs:3,lp:17000,dk:.2,dl:.72,rev:.08,trim:1},
  soul:{ls:3.5,hs:-6,lp:5000,dk:.66,dl:.55,rev:.34,trim:1.08},
  latin:{ls:0,hs:3.5,lp:16000,dk:.5,dl:.55,rev:.1,trim:1},
  afro:{ls:4.5,hs:-3.5,lp:7000,dk:.55,dl:.6,rev:.34,trim:1.06},
  citypop:{ls:-1,hs:5,lp:18000,dk:.72,dl:.45,rev:.32,trim:.95},
  grime:{ls:3,hs:-5,lp:8500,dk:.5,dl:.5,rev:.05,trim:1},
  amapiano:{ls:2,hs:-1.5,lp:9000,dk:.62,dl:.6,rev:.2,trim:1},
  gqom:{ls:5.5,hs:-3,lp:6500,dk:.1,dl:.65,rev:.1,trim:.88},
  phonk:{ls:5,hs:2,lp:12500,dk:.3,dl:.5,rev:.08,trim:.9}};
let ac=null,master,duck,send,noise,timer=0,step=0,nextT=0,t0=0,on=false,eqLs,eqHs,eqLp,trim,rwet,DK=.22,DL=.72;
let T=null,SPB=60/124,S16=SPB/4;
const subs=[],tsubs=[];
const PK='jowo.plays.v1';
function readPlays(){try{return JSON.parse(localStorage.getItem(PK)||'{}')||{}}catch(e){return{}}}
function bumpPlay(){try{const m=readPlays();m[T.id]=(m[T.id]||0)+1;localStorage.setItem(PK,JSON.stringify(m))}catch(e){}}
function makePhonk(seed){
  const t=makeTrack((seed-1e9)||1);
  R=mulberry((seed^0x7f4a7c15)>>>0);
  t.id=String(seed);t.seed=seed;t.kind='phonk';t.genre='Brazilian phonk';t.name=pick(PADJ)+' '+pick(PNOUN);
  retune(t,R()<.6?'minor':'phrygian',pick(PPROG),Math.floor(R()*12));
  t.bpm=130+Math.floor(R()*21);t.swing=0;t.wet=.12+R()*.1;t.v=Math.floor(R()*4);
  R=Math.random;return t;
}
function makeTrack(seed){
  if(seed>=1e9)return makePhonk(seed);
  const first=seed===0;
  R=mulberry(first?7:seed);
  const soul=!first&&R()<.5;
  const mode=first?'minor':soul?pick(['major','major','mixolydian','dorian']):pick(['minor','dorian','phrygian']),sc=SCALES[mode],key=first?9:Math.floor(R()*12);
  const bpm=first?124:soul?116+Math.floor(R()*10):110+Math.floor(R()*25);
  const prog=first?[0,3,6,4]:soul?pick(SOULP[mode]||SOULP.major):pick(PROGS),root=31+(((key-31)%12)+12)%12;
  const chords=chordsFor(sc,root,prog);
  const t={id:String(seed),seed,kind:soul?'soul':'club',genre:soul?'Soul house':'House',name:first?'Rain Groove':soul?pick(SADJ)+' '+pick(SNOUN):pick(ADJ)+' '+pick(NOUN),key:KEYS[key]+' '+(mode==='minor'?'min':mode),bpm,chords,
    bass:first?BASSP[0]:pick(BASSP),stab:first?STABP[0]:pick(STABP),cut:first?1100:700+R()*1100,
    wave:first?'sawtooth':pick(['sawtooth','sawtooth','square']),hats:R()<.5,wet:.2+R()*.25,
    arp:first?2:Math.floor(R()*4),kickp:first?KICKP[0]:pick(KICKP),hatp:first?HATP[0]:pick(HATP),percp:first?null:pick(PERCP),bwave:first?'sawtooth':pick(['sawtooth','square','triangle']),bcut:first?900:500+R()*1400,clap:first?[4,12]:pick([[4,12],[4,12],[4,12,15],[4,10,12]]),
    open:first?true:R()<.8,swing:first?0:R()*.012,
    sbass:pick(SBASS),skeys:pick(SKEYS),pad:R()<.8,mel:Array.from({length:8},()=>Math.floor(R()*5)),melOn:R()<.7};
  if(soul){t.swing=.022+R()*.014;t.wet=.3+R()*.2}
  if(!first&&!soul){
    /* a separate roll so earlier seeds keep their sound; some club seeds become latin or afro house */
    const kr=mulberry((seed*2654435761)>>>0)();
    if(kr<.78){R=mulberry((seed^0x5bd1e995)>>>0);
      if(kr<.27){t.kind='latin';t.genre='Latin house';t.name=pick(LADJ)+' '+pick(LNOUN);t.bpm=120+Math.floor(R()*8);t.swing=.004+R()*.008;t.mont=pick(LMONT);t.tumb=pick(LTUMB);t.cong=pick(LCONG);t.brass=R()<.65;t.cow=R()<.6;t.wet=.22+R()*.12}
      else if(kr<.5){t.kind='afro';t.genre='Afro house';t.name=pick(AADJ)+' '+pick(ANOUN);t.bpm=116+Math.floor(R()*8);t.swing=.018+R()*.012;t.abass=pick(ABASS);t.akal=pick(AKAL);t.tom=pick(ATOM);t.wet=.3+R()*.15;t.voice=R()<.75}
      else newKind(t,kr)
    }}
  /* fold each genre's tempo into its own window (the rolls above are untouched, so names/keys/chords stay put) */
  const bp=t.bpm;
  if(!first){
    if(t.kind==='club')t.bpm=122+(bp-110)%5;
    else if(t.kind==='soul')t.bpm=118+(bp-116)%5;
    else if(t.kind==='latin')t.bpm=120+(bp-120)%5;
    else if(t.kind==='afro')t.bpm=118+Math.round((bp-116)*6/7);
    else if(t.kind==='citypop')t.bpm=100+(bp-102)%13;
    else if(t.kind==='gqom')t.bpm=122+(bp-122)%7;
  }
  t.v=Math.floor(mulberry(((seed*7919)+17)>>>0)()*4);/* own roll: pattern variant for the new grooves */
  R=Math.random;return t;
}
const GENRES=['House','Soul house','Latin house','Afro house','City pop','Grime','Amapiano','Gqom','Brazilian phonk'];
/* pick a genre first, then search for a seed that makes it, so every genre turns up equally often (old seeds keep their sound) */
function newSeed(){
  const want=GENRES[Math.floor(Math.random()*GENRES.length)];
  if(want==='Brazilian phonk')return 1e9+1+Math.floor(Math.random()*999999999);/* phonk lives in its own seed range (>=1e9), so every older seed keeps its genre */
  let sd=1+Math.floor(Math.random()*999999999);
  for(let i=0;i<400;i++){if(makeTrack(sd).genre===want)return sd;sd=1+Math.floor(Math.random()*999999999)}
  return sd}
function setTempo(){SPB=60/T.bpm;S16=SPB/4}
T=makeTrack(0);setTempo();
const V=()=>T.v|0;
function init(){
  const AC=g.AudioContext||g.webkitAudioContext;if(!AC)return false;
  ac=new AC();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  master=ac.createGain();master.gain.value=0;
  eqLs=ac.createBiquadFilter();eqLs.type='lowshelf';eqLs.frequency.value=110;
  eqHs=ac.createBiquadFilter();eqHs.type='highshelf';eqHs.frequency.value=5500;
  eqLp=ac.createBiquadFilter();eqLp.type='lowpass';eqLp.frequency.value=17000;eqLp.Q.value=.5;
  trim=ac.createGain();
  master.connect(eqLs);eqLs.connect(eqHs);eqHs.connect(eqLp);eqLp.connect(trim);trim.connect(comp);comp.connect(ac.destination);
  duck=ac.createGain();duck.connect(master);
  const dl=ac.createDelay(1);dl.delayTime.value=.375;const fb=ac.createGain();fb.gain.value=.34;
  const wet=ac.createGain();wet.gain.value=.3;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
  send=ac.createGain();send.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(wet);wet.connect(duck);
  /* a short generated room/plate for the reverb return */
  const rl=Math.floor(ac.sampleRate*2.2),ir=ac.createBuffer(2,rl,ac.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);let lq=0;for(let i=0;i<rl;i++){lq=lq*.55+(Math.random()*2-1)*.45;d[i]=lq*Math.pow(1-i/rl,2.8)}}
  const rv=ac.createConvolver();rv.buffer=ir;rwet=ac.createGain();rwet.gain.value=.1;send.connect(rv);rv.connect(rwet);rwet.connect(master);
  House._dl=dl;House._wet=wet;
  noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  mix(true);
  return true;
}
function mix(now){
  if(!ac)return;const m=MIX[T.kind]||MIX.club,n=ac.currentTime,k=now?.001:.06;
  eqLs.gain.setTargetAtTime(m.ls,n,k);eqHs.gain.setTargetAtTime(m.hs,n,k);eqLp.frequency.setTargetAtTime(m.lp,n,k);trim.gain.setTargetAtTime(m.trim,n,k);rwet.gain.setTargetAtTime(m.rev,n,k);
  DK=m.dk;DL=m.dl;if(House._wet)House._wet.gain.value=T.wet;
}
function D(n,t,x){const d=House._dbg;if(d)d.push([n,t,x])}
function env(gn,t,a,peak,dec){gn.gain.setValueAtTime(0.0001,t);gn.gain.linearRampToValueAtTime(peak,t+a);gn.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
/* generic kick: pitch-dropping sine, with the genre's sidechain depth */
function kk(t,f0,f1,fd,dec,gv,dest){
  D('kick',t,gv);
  const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+fd);
  gn.gain.setValueAtTime(gv,t);gn.gain.exponentialRampToValueAtTime(.001,t+dec);
  o.connect(gn);gn.connect(dest||master);o.start(t);o.stop(t+dec+.04);
  duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(Math.min(1,DK+(1-Math.min(gv,1))*.5),t);duck.gain.linearRampToValueAtTime(1,t+SPB*DL);
}
const kick=t=>kk(t,165,46,.11,.42,1);
const soft=(t,k)=>kk(t,130,48,.14,.34,.8*k);
const deep=(t,k)=>kk(t,92,38,.17,.7,k);
const punch=t=>kk(t,200,50,.06,.24,1);
let WS=null;
function wsn(){if(!WS){WS=ac.createWaveShaper();const c=new Float32Array(256);for(let i=0;i<256;i++)c[i]=Math.tanh((i/128-1)*3);WS.curve=c;WS.connect(master)}return WS}
const gkick=(t,k)=>kk(t,230,40,.1,.34,1.25*(k||1),wsn());
function nz(t,type,freq,q,peak,dec,dest,a){
  const s=ac.createBufferSource();s.buffer=noise;s.loop=true;
  const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;a=a||.002;
  const gn=ac.createGain();env(gn,t,a,peak,dec);s.connect(f);f.connect(gn);gn.connect(dest);s.start(t,Math.random());s.stop(t+a+dec+.05);
}
function clap(t,f,dest){D('clap',t);dest=dest||master;[0,.012,.024].forEach((d,i)=>nz(t+d,'bandpass',f||1500,1.2,i==2?.55:.3,i==2?.16:.03,dest))}
function hat(t,open,hp,pk){D('hat',t,open?1:0);nz(t,'highpass',hp||7500,.7,(pk||1)*(open?.22:.12),open?.2:.045,duck)}
function shake(t,pk,hp,dec){D('shaker',t);nz(t,'highpass',hp||8500,.5,pk,dec||.035,duck)}
function brush(t,acc){D('snare',t,'brush');nz(t,'bandpass',4300,.7,acc?.2:.08,acc?.2:.09,duck,.018)}
function gate(t){D('snare',t,'gated');
  const s=ac.createBufferSource();s.buffer=noise;s.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2100;f.Q.value=.9;const gn=ac.createGain();
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.42,t+.002);gn.gain.setValueAtTime(.42,t+.15);gn.gain.linearRampToValueAtTime(0,t+.17);
  s.connect(f);f.connect(gn);gn.connect(master);gn.connect(send);s.start(t,Math.random());s.stop(t+.2);
  const o=ac.createOscillator(),og=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(260,t);o.frequency.exponentialRampToValueAtTime(150,t+.09);og.gain.setValueAtTime(.4,t);og.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(og);og.connect(master);o.start(t);o.stop(t+.14)}
function gsn(t){D('snare',t,'cold');nz(t,'highpass',2600,.8,.34,.13,master);const o=ac.createOscillator(),gn=ac.createGain();o.type='square';o.frequency.setValueAtTime(340,t);o.frequency.exponentialRampToValueAtTime(190,t+.05);gn.gain.setValueAtTime(.16,t);gn.gain.exponentialRampToValueAtTime(.001,t+.08);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.1)}
function rim(t,pk){D('rim',t);const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.value=1750;env(gn,t,.001,pk||.2,.035);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.06);nz(t,'bandpass',3200,3,(pk||.2)*.4,.02,master)}
function bass(t,m,len){
  D('bass',t,m);
  const o=ac.createOscillator(),f=ac.createBiquadFilter(),gn=ac.createGain();
  o.type=T.bwave;o.frequency.value=mtof(m);f.type='lowpass';f.Q.value=6;
  f.frequency.setValueAtTime(T.bcut,t);f.frequency.exponentialRampToValueAtTime(140,t+len);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.34,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(f);f.connect(gn);gn.connect(duck);o.start(t);o.stop(t+len+.05);
}
function stab(t,notes,cut,wave){
  D('chord',t,'stab');
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.Q.value=3;
  f.frequency.setValueAtTime(cut,t);f.frequency.exponentialRampToValueAtTime(cut*.35,t+.22);
  env(gn,t,.005,wave==='square'?.06:.085,.22);f.connect(gn);gn.connect(duck);gn.connect(send);
  notes.forEach(m=>[-7,7].forEach(dt=>{const o=ac.createOscillator();o.type=wave;o.frequency.value=mtof(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+.3)}));
}
/* drawbar organ: one periodic-wave oscillator per note, so a chord is cheap */
let OW=null;
function organ(t,notes,len,pk,cut,hold){
  D('chord',t,'organ');
  if(!OW){const re=new Float32Array(10),im=new Float32Array(10);[0,1,.7,.55,.42,.3,.2,.14,.1,.06].forEach((a,i)=>{im[i]=a});OW=ac.createPeriodicWave(re,im)}
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.Q.value=1.2;f.frequency.setValueAtTime(cut,t);f.frequency.exponentialRampToValueAtTime(Math.max(300,cut*.45),t+len);
  if(hold){gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(pk,t+len*.3);gn.gain.linearRampToValueAtTime(.0001,t+len)}else env(gn,t,.006,pk,len);
  f.connect(gn);gn.connect(duck);gn.connect(send);
  notes.forEach(m=>{const o=ac.createOscillator();o.setPeriodicWave(OW);o.frequency.value=mtof(m);o.connect(f);o.start(t);o.stop(t+len+.05)});
}
function pluck(t,m){
  D('lead',t,'pluck');
  const o=ac.createOscillator(),gn=ac.createGain();o.type='triangle';o.frequency.value=mtof(m+12);
  env(gn,t,.003,.07,.12);o.connect(gn);gn.connect(duck);gn.connect(send);o.start(t);o.stop(t+.16);
}
function sbass(t,m,len){
  D('bass',t,m);
  const gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=1.5;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.42,t+.015);gn.gain.setTargetAtTime(.0001,t+len*.55,len*.22);
  [['sine',0,1],['triangle',0,.35]].forEach(([ty,dt,k])=>{const o=ac.createOscillator();o.type=ty;o.frequency.setValueAtTime(mtof(m),t);o.detune.value=dt;const g2=ac.createGain();g2.gain.value=k;o.connect(g2);g2.connect(f);o.start(t);o.stop(t+len+.4)});
  f.connect(gn);gn.connect(duck);
}
function rhodes(t,notes,vel,sus){
  D('chord',t,'rhodes');sus=sus||1.1;
  notes.forEach((m,i)=>{
    const tt=t+i*.014,gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=2200;
    gn.gain.setValueAtTime(.0001,tt);gn.gain.linearRampToValueAtTime(.075*vel,tt+.006);gn.gain.exponentialRampToValueAtTime(.0001,tt+sus);
    const o=ac.createOscillator();o.type='sine';o.frequency.value=mtof(m);o.connect(f);
    const o2=ac.createOscillator();o2.type='sine';o2.frequency.value=mtof(m)*2.003;const g2=ac.createGain();g2.gain.setValueAtTime(.3,tt);g2.gain.exponentialRampToValueAtTime(.001,tt+.18);o2.connect(g2);g2.connect(f);
    f.connect(gn);gn.connect(duck);gn.connect(send);o.start(tt);o.stop(tt+sus+.1);o2.start(tt);o2.stop(tt+.3);
  });
}
function padv(t,notes,len){
  D('pad',t,'saw');
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(1300,t+len*.5);f.frequency.linearRampToValueAtTime(600,t+len);f.Q.value=.7;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.05,t+len*.25);gn.gain.linearRampToValueAtTime(.0001,t+len);
  notes.forEach(m=>[-9,9].forEach(dt=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m-12);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+len+.1)}));
  f.connect(gn);gn.connect(duck);gn.connect(send);
}
/* airy sine/triangle pad (amapiano) */
function air(t,notes,len){
  D('pad',t,'air');
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.frequency.value=2600;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.05,t+len*.4);gn.gain.linearRampToValueAtTime(.0001,t+len);
  notes.forEach(m=>{const o=ac.createOscillator();o.type='triangle';o.frequency.value=mtof(m);o.connect(f);o.start(t);o.stop(t+len+.05)});
  f.connect(gn);gn.connect(duck);gn.connect(send);
}
/* shimmering string ensemble (city pop): detuned saws with a slow tremolo */
function strpad(t,notes,len){
  D('pad',t,'strings');
  const f=ac.createBiquadFilter(),gn=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();f.type='lowpass';f.frequency.value=3800;f.Q.value=.4;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.034,t+len*.3);gn.gain.linearRampToValueAtTime(.0001,t+len);
  lfo.frequency.value=6.3;lg.gain.value=.012;lfo.connect(lg);lg.connect(gn.gain);lfo.start(t);lfo.stop(t+len+.05);
  notes.forEach(m=>[-12,12].forEach(dt=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+len+.05)}));
  f.connect(gn);gn.connect(duck);gn.connect(send);
}
function lead(t,m,len,ty,pk,cut){
  D('lead',t,ty||'triangle');
  const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain();
  o.type=ty||'triangle';o.frequency.value=mtof(m);lfo.frequency.value=5.2;lg.gain.value=5;lfo.connect(lg);lg.connect(o.detune);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(pk||.06,t+.03);gn.gain.exponentialRampToValueAtTime(.0001,t+len);
  if(cut){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=cut;o.connect(f);f.connect(gn)}else o.connect(gn);
  gn.connect(duck);gn.connect(send);o.start(t);lfo.start(t);o.stop(t+len+.05);lfo.stop(t+len+.05);
}
/* a sung vowel: saw through formant filters with delayed vibrato and a little scoop into the pitch */
function sung(t,m,len,v){
  D('lead',t,'sung');
  const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain(),sum=ac.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(mtof(m)*.97,t);o.frequency.exponentialRampToValueAtTime(mtof(m),t+.07);
  lfo.frequency.value=5.4;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(20,t+Math.min(.4,len*.6));lfo.connect(lg);lg.connect(o.detune);
  [[[700,6],[1100,7]],[[430,6],[2000,8]],[[560,6],[880,6]]][v%3].forEach(([fq,q])=>{const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;f.Q.value=q;o.connect(f);f.connect(sum)});
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.3,t+.06);gn.gain.setTargetAtTime(.0001,t+len*.7,len*.12);sum.connect(gn);gn.connect(duck);gn.connect(send);
  o.start(t);lfo.start(t);o.stop(t+len+.4);lfo.stop(t+len+.4);
}
function conga(t,type){D('perc',t,'conga'+type);const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';const f0=type===2?420:type===3?260:300,f1=type===2?300:type===3?230:215;
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+.07);gn.gain.setValueAtTime(type===2?.5:type===3?.3:.6,t);gn.gain.exponentialRampToValueAtTime(.001,t+(type===2?.09:type===3?.05:.18));
  o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.22);if(type===2)nz(t,'bandpass',2600,2,.2,.04,master)}
function clave(t){D('perc',t,'clave');const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.value=2450;env(gn,t,.001,.26,.07);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.1)}
function cowbell(t,acc){D('perc',t,'cowbell');[562,845].forEach(fq=>{const o=ac.createOscillator(),f=ac.createBiquadFilter(),gn=ac.createGain();o.type='square';o.frequency.value=fq;f.type='bandpass';f.frequency.value=fq*1.2;f.Q.value=1.2;env(gn,t,.002,acc?.13:.08,.11);o.connect(f);f.connect(gn);gn.connect(master);o.start(t);o.stop(t+.15)})}
function timbale(t,hi){D('perc',t,'timbale');nz(t,'bandpass',hi?3600:2400,1.5,.25,.07,master);const o=ac.createOscillator(),gn=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(hi?900:520,t);o.frequency.exponentialRampToValueAtTime(hi?600:340,t+.06);env(gn,t,.001,.2,.1);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.14)}
function shell(t,acc){D('perc',t,'cascara');nz(t,'bandpass',3500,3,acc?.2:.12,.04,master)}
function guiro(t,long){D('shaker',t,'guiro');nz(t,'bandpass',5600,2.5,long?.12:.07,long?.11:.04,duck)}
function piano(t,m,vel,np){D('chord',t,'piano');const gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(900,t+.4);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.2*vel,t+.004);gn.gain.exponentialRampToValueAtTime(.0001,t+.5);
  [['triangle',1],['sine',2.001],['sine',3.003]].slice(0,np||3).forEach(([ty,k],i)=>{const o=ac.createOscillator(),g2=ac.createGain();o.type=ty;o.frequency.value=mtof(m)*k;g2.gain.value=i?.28/i:1;o.connect(g2);g2.connect(f);o.start(t);o.stop(t+.55)});
  f.connect(gn);gn.connect(master);if(send)gn.connect(send)}
function tom(t,fq,dest,vel){D('perc',t,'tom'+fq);vel=vel||1;const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.setValueAtTime(fq*1.6,t);o.frequency.exponentialRampToValueAtTime(fq,t+.08);gn.gain.setValueAtTime(.5*vel,t);gn.gain.exponentialRampToValueAtTime(.001,t+.24);o.connect(gn);gn.connect(dest||master);o.start(t);o.stop(t+.28)}
function kalimba(t,m){D('lead',t,'kalimba');[[1,.22,.5],[5.4,.05,.12]].forEach(([k,pk,dc])=>{const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.value=mtof(m)*k;env(gn,t,.002,pk,dc);o.connect(gn);gn.connect(master);if(send)gn.connect(send);o.start(t);o.stop(t+dc+.1)})}
function voice(t,m,len){D('lead',t,'chant');const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain(),sum=ac.createGain();o.type='sawtooth';o.frequency.value=mtof(m-12);lfo.frequency.value=5.2;lg.gain.value=9;lfo.connect(lg);lg.connect(o.detune);
  [[720,5],[1180,6]].forEach(([fq,q])=>{const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;f.Q.value=q;o.connect(f);f.connect(sum)});
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.2,t+.18);gn.gain.exponentialRampToValueAtTime(.0001,t+len);sum.connect(gn);gn.connect(master);if(send)gn.connect(send);o.start(t);lfo.start(t);o.stop(t+len+.05);lfo.stop(t+len+.05)}
function brass(t,notes,len,pk,dirty){
  D('chord',t,'brass');
  const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.Q.value=2;
  f.frequency.setValueAtTime(700,t);f.frequency.exponentialRampToValueAtTime(3600,t+.06);f.frequency.exponentialRampToValueAtTime(1200,t+len);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(pk||.1,t+.025);gn.gain.setTargetAtTime(.0001,t+len*.5,len*.2);f.connect(gn);gn.connect(dirty?wsn():duck);gn.connect(send);
  notes.forEach(m=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.connect(f);o.start(t);o.stop(t+len+.2)});
}
function slap(t,m,len,vel){D('bass',t,m);vel=vel||1;const o=ac.createOscillator(),f=ac.createBiquadFilter(),gn=ac.createGain();o.type='sawtooth';o.frequency.value=mtof(m);f.type='lowpass';f.Q.value=4;
  f.frequency.setValueAtTime(2200,t);f.frequency.exponentialRampToValueAtTime(220,t+.14);gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.3*vel,t+.006);gn.gain.exponentialRampToValueAtTime(.0001,t+len);
  o.connect(f);f.connect(gn);gn.connect(duck);o.start(t);o.stop(t+len+.05);
  if(vel>.5){const p=ac.createOscillator(),pg=ac.createGain();p.type='triangle';p.frequency.value=mtof(m+12);env(pg,t,.002,.09,.05);p.connect(pg);pg.connect(duck);p.start(t);p.stop(t+.09)}}
/* DX7-style electric piano / bell: sine carrier with a decaying FM modulator */
function fmep(t,m,vel,ratio,idx){D('chord',t,ratio>1?'dxbell':'dxep');ratio=ratio||1;idx=idx||1.6;const c=ac.createOscillator(),md=ac.createOscillator(),mg=ac.createGain(),gn=ac.createGain(),fq=mtof(m);c.type='sine';md.type='sine';c.frequency.value=fq;md.frequency.value=fq*ratio;
  mg.gain.setValueAtTime(fq*idx,t);mg.gain.exponentialRampToValueAtTime(fq*.05,t+(ratio>1?.9:.4));md.connect(mg);mg.connect(c.frequency);
  env(gn,t,.003,.1*vel,ratio>1?1:.6);c.connect(gn);gn.connect(duck);gn.connect(send);c.start(t);md.start(t);c.stop(t+(ratio>1?1.1:.7));md.stop(t+(ratio>1?1.1:.7))}
/* amapiano log drum: a short pitched sine with a fast pitch drop and a woody click */
function logdrum(t,m,len){D('bass',t,m);const o=ac.createOscillator(),gn=ac.createGain(),fq=mtof(m);o.type='sine';o.frequency.setValueAtTime(fq*2,t);o.frequency.exponentialRampToValueAtTime(fq,t+.035);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.62,t+.003);gn.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(gn);gn.connect(duck);o.start(t);o.stop(t+len+.05);
  const h=ac.createOscillator(),hg=ac.createGain();h.type='triangle';h.frequency.value=fq*3;env(hg,t,.002,.12,.06);h.connect(hg);hg.connect(duck);h.start(t);h.stop(t+.1);nz(t,'bandpass',1100,3,.08,.02,master)}
function whistle(t,m,len,up){D('lead',t,'whistle');const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),gn=ac.createGain(),fq=mtof(m);o.type='sine';
  o.frequency.setValueAtTime(fq*(up?.94:1),t);o.frequency.exponentialRampToValueAtTime(fq*(up?1.05:1),t+len*.5);lfo.frequency.value=5.8;lg.gain.value=14;lfo.connect(lg);lg.connect(o.detune);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.1,t+.03);gn.gain.setTargetAtTime(.0001,t+len*.55,len*.18);
  o.connect(gn);gn.connect(duck);gn.connect(send);o.start(t);lfo.start(t);o.stop(t+len+.3);lfo.stop(t+len+.3);
  nz(t,'bandpass',fq*1.5,6,.03,len*.6,duck)}
function sub(t,m,len,drive){D('bass',t,m);const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.setValueAtTime(mtof(m)*1.12,t);o.frequency.exponentialRampToValueAtTime(mtof(m),t+.05);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(drive?.8:.5,t+.01);gn.gain.setTargetAtTime(.0001,t+len*.6,len*.18);o.connect(gn);gn.connect(drive?wsn():duck);o.start(t);o.stop(t+len+.4)}
/* gqom hollow stab: sine body plus a resonant square, short and dry */
function hollow(t,m,len){D('bass',t,m);const o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g1=ac.createGain(),g2=ac.createGain();
  o.type='sine';o.frequency.value=mtof(m);o2.type='square';o2.frequency.value=mtof(m);f.type='bandpass';f.frequency.value=mtof(m)*3;f.Q.value=5;
  g1.gain.setValueAtTime(.0001,t);g1.gain.linearRampToValueAtTime(.5,t+.008);g1.gain.setTargetAtTime(.0001,t+len*.5,len*.2);
  g2.gain.setValueAtTime(.0001,t);g2.gain.linearRampToValueAtTime(.22,t+.008);g2.gain.setTargetAtTime(.0001,t+len*.3,len*.15);
  o.connect(g1);g1.connect(duck);o2.connect(f);f.connect(g2);g2.connect(duck);o.start(t);o2.start(t);o.stop(t+len+.4);o2.stop(t+len+.4)}
/* grime "eskimo" stab: thin cold detuned square + saw, high-passed, very short */
function eski(t,notes){D('chord',t,'eski');const f=ac.createBiquadFilter(),gn=ac.createGain();f.type='highpass';f.frequency.value=520;f.Q.value=1.5;env(gn,t,.002,.07,.16);f.connect(gn);gn.connect(master);gn.connect(send);
  notes.forEach(m=>[['square',-14],['sawtooth',15]].forEach(([ty,dt])=>{const o=ac.createOscillator();o.type=ty;o.frequency.value=mtof(m);o.detune.value=dt;o.connect(f);o.start(t);o.stop(t+.2)}))}
function eerie(t,len){D('lead',t,'eerie');nz(t,'bandpass',900,9,.16,len,master,len*.5)}
let KW=null;
function keys(t,notes,vel){D('chord',t,'keys');if(!KW){const re=new Float32Array(7),im=new Float32Array(7);[0,1,.5,.32,.18,.1,.05].forEach((a,i)=>{im[i]=a});KW=ac.createPeriodicWave(re,im)}
  const gn=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(900,t+.4);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.2*vel,t+.004);gn.gain.exponentialRampToValueAtTime(.0001,t+.5);
  notes.forEach(m=>{const o=ac.createOscillator();o.setPeriodicWave(KW);o.frequency.value=mtof(m);o.connect(f);o.start(t);o.stop(t+.55)});f.connect(gn);gn.connect(master);gn.connect(send)}
/* breathy sax / soulful horn lead */
function sax(t,m,len,vel){D('lead',t,'sax');vel=vel||1;const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),f=ac.createBiquadFilter(),gn=ac.createGain(),fq=mtof(m);
  o.type='sawtooth';o.frequency.setValueAtTime(fq*.985,t);o.frequency.exponentialRampToValueAtTime(fq,t+.05);lfo.frequency.value=5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(14,t+len*.8);lfo.connect(lg);lg.connect(o.detune);
  f.type='lowpass';f.frequency.value=Math.min(2600,fq*5);f.Q.value=2.5;
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.2*vel,t+.04);gn.gain.setTargetAtTime(.0001,t+len*.65,len*.15);
  o.connect(f);f.connect(gn);gn.connect(duck);gn.connect(send);o.start(t);lfo.start(t);o.stop(t+len+.3);lfo.stop(t+len+.3);
  nz(t,'bandpass',Math.min(5000,fq*4),1.5,.035*vel,len*.7,duck,.03)}
function bongo(t,hi){D('perc',t,hi?'bongoH':'bongoL');const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';const f=hi?640:450;o.frequency.setValueAtTime(f*1.25,t);o.frequency.exponentialRampToValueAtTime(f,t+.04);gn.gain.setValueAtTime(.45,t);gn.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.12)}
function agogo(t,hi){D('perc',t,hi?'agogoH':'agogoL');const gn=ac.createGain(),f=hi?1180:820;env(gn,t,.001,.13,.12);gn.connect(master);[1,1.52].forEach(k=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=f*k;o.connect(gn);o.start(t);o.stop(t+.16)})}
function djembe(t,ty){D('perc',t,'djembe'+ty);const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';const f=ty===1?105:ty===2?250:330;o.frequency.setValueAtTime(f*1.4,t);o.frequency.exponentialRampToValueAtTime(f,t+.06);gn.gain.setValueAtTime(ty===1?.8:.5,t);gn.gain.exponentialRampToValueAtTime(.001,t+(ty===1?.3:.12));o.connect(gn);gn.connect(master);o.start(t);o.stop(t+.34);if(ty===3)nz(t,'bandpass',2400,2,.22,.04,master)}
function rollhit(t,v,dest){D('roll',t);nz(t,'bandpass',2800,1.2,.05+.16*v,.06,dest||master)}
/* brazilian phonk voices */
function s808(t,m,len,from){D('bass',t,m);const o=ac.createOscillator(),gn=ac.createGain(),fq=mtof(m);o.type='sine';o.frequency.setValueAtTime(from?mtof(from):fq*1.5,t);o.frequency.exponentialRampToValueAtTime(fq,t+(from?len*.45:.05));
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.7,t+.005);gn.gain.setTargetAtTime(.0001,t+len*.7,len*.2);o.connect(gn);gn.connect(wsn());o.start(t);o.stop(t+len+.3)}
function pcow(t,m,len){D('lead',t,'cowbell');const f=ac.createBiquadFilter(),gn=ac.createGain(),fq=mtof(m);f.type='bandpass';f.frequency.value=fq*1.8;f.Q.value=1.1;env(gn,t,.002,.2,len);f.connect(gn);gn.connect(master);gn.connect(send);
  [1,1.504].forEach(k=>{const o=ac.createOscillator();o.type='square';o.frequency.value=fq*k;o.connect(f);o.start(t);o.stop(t+len+.06)})}
function chop(t,m,len,v){D('lead',t,'chop');const o=ac.createOscillator(),gn=ac.createGain(),sum=ac.createGain(),fq=mtof(m);o.type='sawtooth';o.frequency.setValueAtTime(fq*1.12,t);o.frequency.exponentialRampToValueAtTime(fq,t+.05);
  [[[700,7],[1150,8]],[[420,7],[2100,9]],[[560,7],[900,7]]][v%3].forEach(([a,q])=>{const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=a;f.Q.value=q;o.connect(f);f.connect(sum)});
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.34,t+.006);gn.gain.setTargetAtTime(.0001,t+len*.5,len*.2);sum.connect(gn);gn.connect(master);gn.connect(send);o.start(t);o.stop(t+len+.3)}
function siren(t,len){D('lead',t,'siren');const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.setValueAtTime(520,t);o.frequency.exponentialRampToValueAtTime(1500,t+len*.5);o.frequency.exponentialRampToValueAtTime(520,t+len);
  gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.09,t+.05);gn.gain.setValueAtTime(.09,t+len-.1);gn.gain.linearRampToValueAtTime(.0001,t+len);o.connect(gn);gn.connect(master);gn.connect(send);o.start(t);o.stop(t+len+.05)}
function lowm(b){let m=b;while(m>45)m-=12;return m}
function schedCity(n,t){
  const s=n%16,bar=Math.floor(n/16),phrase=Math.floor(bar/4)%4,v=V();
  const hc=T.chords[(bar*2+(s>=8?1:0))%4];/* chords move every half bar */
  t+=(s%2?T.swing:0);
  if(CKICK[v%3][s])soft(t,1);
  if(s===4||s===12)gate(t);
  shake(t,s%4===2?.1:s%2?.045:.065,9500,.03);
  if(s===14||(s===6&&bar%2))hat(t,true,9000);
  const bv=T.cbass[s];
  if(bv)slap(t,bv===2?hc.b+12:bv===3?hc.b+7:hc.b,S16*(bv===1?2.4:bv===4?.6:1.1),bv===4?.35:1);
  if(T.ccomp[s]&&phrase!==3){const nt=[hc.ch[1],hc.ch[3],hc.ext[4],hc.x13||hc.ch[2]+12];nt.forEach((m,i)=>fmep(t+i*.008,m,.85))}
  if(s===0&&phrase>=1)fmep(t,hc.ext[4]+12,1,3.5,3);
  if(phrase>=1){const top=(bar%2?CTOPB:CTOPA),ix=top.indexOf(s);if(ix>=0)lead(t,hc.ch[0]+12+PENT[T.mel[(ix+bar%2*3)%8]%5],S16*(ix%2?1.8:2.8),'sawtooth',.05,3400)}
  if(T.cbrass&&phrase>=2&&(s===6||s===14))brass(t,hc.ch.slice(0,3),S16*2);
  if((s===0||s===8)&&T.pad)strpad(t,[hc.ch[1],hc.ch[2],hc.ch[3]],S16*8);
}
function schedGrime(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4,gap=bar%4===3;
  if(T.gk[s]&&(!gap||s===0))punch(t);
  if(s===8&&!(gap&&bar%8===7))gsn(t);
  if(!gap&&s%2===0)hat(t,false,10500,s%4===2?.6:.38);
  if(!gap&&s===14&&bar%2)hat(t,true,9500,.7);
  if(T.gsub[s]&&(!gap||s===0))sub(t,s===14?lowm(ch.b)+7:lowm(ch.b),S16*(T.gsub[s]===2?5:3),true);
  if(T.gst[s]&&phrase!==0&&!gap)eski(t,[ch.b+24,ch.b+31,ch.b+36]);
  if(phrase>=2&&bar%2===0&&s===0&&T.pad)padv(t,[ch.ch[0],ch.ch[2]],S16*16);
}
function schedAmapiano(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4,fill=bar%4===3;
  t+=(s%2?T.swing:0);
  if(AKICK[V()%2][s])soft(t,.7);
  shake(t,s%4===2?.15:s%2?.11:.07,6500,.05);
  if(s===12||(s===4&&phrase>=1))clap(t,1300,duck);
  if(ABONG[s])(ABONG[s]===2?conga(t,3):bongo(t,s%8!==1));
  if(T.alog[s]){const v=T.alog[s];logdrum(t,lowm(ch.b)+(v===2?7:v===3?12:0),S16*(v===3?1.4:2.4))}
  if(T.apia[s]&&phrase>=1){let k=0;for(let i=0;i<s;i++)if(T.apia[i])k++;const nt=(k+bar)%2?[ch.ch[1],ch.ch[3]]:[ch.ext[2],ch.ext[4]];keys(t,nt,.62+(s%3)*.08)}
  /* signature breathy sax lines over the log drum, answered by a horn stab */
  if(phrase>=1&&bar%4<2){const px=SAXP[V()%2],ix=px.indexOf(s);if(ix>=0){const tn=[ch.ch[1],ch.ch[2],ch.ch[3],ch.ext[4]];sax(t,tn[T.mel[(ix+bar)%8]%4],S16*(ix%2?2.2:3.6),1)}}
  if(phrase>=1&&bar%4===2&&(s===4||s===12))brass(t,[ch.ch[0],ch.ch[2]],S16*2,.11);
  if(fill&&s>=12){tom(t,[190,150,120,95][s-12],null,.9);bongo(t,s%2===0)}
  if(fill&&s>=6&&s<12)rollhit(t,(s-6)/6);
  if(T.voice&&phrase>=2&&s===8&&bar%2===0)voice(t,ch.ch[bar%4],S16*7);
  if((T.awh||AWH[0])[s]&&phrase>=1&&bar%2===1)whistle(t,ch.ch[0]+24+PENT[T.mel[(s+bar)%8]%5],S16*((T.awh||AWH[0])[s]===2?4:2.5),(T.awh||AWH[0])[s]===2);
  if(s===0&&T.pad)air(t,[ch.ch[0],ch.ch[2],ch.ext[4]],S16*16);
}
function schedGqom(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4,fill=bar%4===3,lb=lowm(ch.b);
  t+=(s%2?T.swing:0);
  if(T.qk[s])gkick(t,s===0?1:.9);
  if(s===12||(s===4&&phrase>=1&&bar%2))clap(t,1800,wsn());
  if(s===6||(s===14&&phrase>=1))hat(t,false,9000,.65);
  if(T.qr[s])rim(t,.2);
  if(T.qt[s])tom(t,[130,98,76][(s+bar)%3],wsn(),1.25);
  if(phrase>=1&&QT2[s])tom(t,[170,120,88][(s+bar)%3],wsn(),.8);
  if(fill&&s>=12)tom(t,[160,130,98,76][s-12],wsn(),1.4);
  if(fill&&phrase>=1&&s>=6&&s<12)rollhit(t,(s-6)/6,wsn());
  if(T.qb[s])sub(t,lb,S16*2.2,true);
  if(phrase>=1&&T.qs[s])hollow(t,lb+(s%2?19:12),S16*1.2);
  /* sparse dark horn blasts */
  if(s===0&&bar%4===0)brass(t,[lb+12,lb+19],S16*6,.12,true);
  if(phrase>=1&&s===10&&bar%2===1)brass(t,[lb+24],S16*1.6,.1,true);
  if(phrase>=2&&fill&&s===12)brass(t,[lb+12,lb+13,lb+18],S16*3,.12,true);
  if(T.voice&&phrase>=2&&s===8&&bar%4===1)voice(t,ch.ch[0]-5,S16*6);
  if(phrase>=1&&s===0&&fill)eerie(t,S16*8);
}
function schedSoul(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4,v=V();
  t+=(s%2?T.swing:0);
  if(SKICK[v][s])soft(t,s===0?1:.85);
  if(s===4||s===12)brush(t,true);else if(s===15&&bar%2)brush(t,false);
  if(s%2===0)shake(t,s%4===0?.05:.035,9000,.04);else if(phrase>0)shake(t,.028,8000,.05);
  if(s===14)hat(t,true,8000,.6);
  if(s%4===0){const o1=ch.ch[1]-ch.ch[0],o2=ch.ch[2]-ch.ch[0],nb=T.chords[(bar+1)%4].b,w=s/4;
    const m=w===0?ch.b:w===1?ch.b+o1:w===2?ch.b+o2:(bar%2?nb-1:ch.b+o2-5);
    sbass(t,m,S16*3.6)}
  if(phrase!==3||s===0){
    const full=[ch.ch[1],ch.ch[2],ch.ch[3],ch.ext[4],ch.x11||ch.ch[0]+17];
    if(s===0)rhodes(t,full,.85,1.9);
    else if(s===10&&bar%2)rhodes(t,full.slice(1,4),.6,1.2);
  }
  if(s===0&&T.pad)organ(t,[ch.ch[0],ch.ch[1],ch.ch[2]],S16*16,.035,1800,true);
  if(phrase>=1){
    if(T.melOn){
      const tones=[ch.ch[1],ch.ch[2],ch.ch[3],ch.ext[4]],at=(s===0?0:s===6?1:s===10?2:-1);
      if(at>=0&&(bar%2===0||s!==6))sung(t,tones[T.mel[(bar*3+at)%8]%4]+12,S16*(s===6?3:5.5),(bar+at)%3);
    }else if(s===0&&bar%2===0)voice(t,ch.ch[0]+12,S16*14);
  }
}
function afroTrip(sl,tt,bar,ch,phrase){
  const fill=bar%4===3;
  if(sl===0||sl===6||(sl===10&&bar%2))deep(tt,sl===0?1:.85);
  if(phrase>=1&&(sl===1||sl===5||sl===9))rim(tt,.15);
  if(T.tom[sl]){if(sl%2)conga(tt,(sl+bar)%3?2:3);else tom(tt,[150,115,88][(sl+bar)%3],null,1.2)}
  if(AGOG[sl])agogo(tt,AGOG[sl]===2);
  if(DJMB[sl]&&!(fill&&sl>=8))djembe(tt,DJMB[sl]);
  if(fill&&sl>=8)djembe(tt,sl%2?3:2);
  if(fill&&sl>=4&&sl<8)bongo(tt,sl%2===0);
  if(T.abass[sl])sbass(tt,ch.b,SPB*(sl?1.3:1.8));
  if(phrase>=1&&T.akal[sl]){let k=0;for(let i=0;i<sl;i++)if(T.akal[i])k++;kalimba(tt,ch.ch[0]+PENT[T.mel[(k+(bar%2?3:0))%8]%5]+(k%2?12:0))}
  /* warm sax / trumpet unison ostinato with a brass punctuation */
  if(phrase>=1&&AHRN[sl]){let k=0;for(let i=0;i<sl;i++)if(AHRN[i])k++;sax(tt,ch.ch[[0,2,1,2][(k+bar)%4]],SPB*.4,.85)}
  if(phrase>=2&&bar%2===1&&sl===10)brass(tt,[ch.ch[0],ch.ch[0]+12],SPB*.5,.11);
}
function schedAfro(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[((bar>>1)%4===2)?1:0],phrase=Math.floor(bar/4)%4;
  if(s%2===0)shake(t+(s%4?T.swing:0),s%4===0?.05:.075,9000,.035);/* straight eighths against the triplet layer */
  if(s%4===0){for(let j=0;j<3;j++)afroTrip((s>>2)*3+j,t+j*SPB/3,bar,ch,phrase)}
  if(s===0&&phrase>=2&&T.voice&&bar%2===0)voice(t,ch.ch[0],S16*14);
  if(s===0&&T.pad&&phrase>=1)padv(t,[ch.ch[0],ch.ch[2]],S16*16);
}
function schedLatin(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4,fill=bar%4===3;
  t+=(s%2?T.swing:0);
  if(s%4===0)soft(t,1);
  if(s===0||s===3||s===6||s===10||s===12)clave(t);/* 3-2 son clave */
  if(CASC[s])shell(t,s===0);
  if(s%2===0)guiro(t,s===0||s===8);
  if(s===14&&bar%2)hat(t,true,8500,.6);
  if(T.cong[s])conga(t,T.cong[s]);
  if(BMART[s])bongo(t,BMART[s]===2);
  if(T.cow&&s%4===0)cowbell(t,s===0);
  if(phrase>=1&&(s===2||s===6||s===10||s===14))timbale(t,s===6||s===14);
  if(fill&&s>=12)timbale(t,s%2===0);
  if(fill&&s>=8&&s<12)rollhit(t,(s-8)/4);
  if(T.tumb[s])sbass(t,s>=8&&s<14?ch.b+7:ch.b,S16*(s===6?3.4:2.6));/* tumbao */
  if(T.mont[s]){let k=0;for(let i=0;i<s;i++)if(T.mont[i])k++;const m=ch.ch[[0,2,1,2,3,2][(k+bar)%6]];keys(t,[m,m+12],.9)}
  /* salsa brass hits plus a mambo line answering on odd bars */
  if(phrase>=(T.brass?0:1)&&(s===3||s===10))brass(t,ch.ch.slice(0,3),S16*2.4,.14);
  if(phrase>=(T.brass?1:2)&&bar%2===1){const e={8:0,10:2,11:1,14:2}[s];if(e!==undefined)brass(t,[ch.ch[e],ch.ch[e]+12],S16*1.6,.13)}
}
function schedPhonk(n,t){
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4,fill=bar%4===3,v=V(),r=lowm(ch.b);
  /* tamborzao: 3+3+2 kick/atabaque figure */
  if(PHK[v].indexOf(s)>=0)gkick(t,s===0?1:.85);
  if(s===6||s===14){tom(t,s===6?112:96,wsn(),1.2);clap(t,2000)}
  if((s===2||s===10)&&v%2)tom(t,150,wsn(),.6);
  if(s%2===0)hat(t,false,9500,.6);
  if(bar%2===1&&s===12)for(let j=0;j<6;j++)hat(t+j*SPB/6,false,9800,.5);/* triplet stutter */
  if(fill&&s===8)for(let j=0;j<8;j++)hat(t+j*S16/2,false,9800,.35+j*.05);
  /* 808 with slides */
  if(s===0)s808(t,r,S16*5);
  if(s===8)s808(t,r,S16*2.5);
  if(s===11)s808(t,r+(v&1?5:0),S16*2.5,r+7);
  if(s===14&&(bar%2||v>1))s808(t,r+7,S16*2,r);
  /* heavy bright cowbell melody */
  const ix=PCM[v].indexOf(s);
  if(ix>=0)pcow(t,ch.ch[0]+12+PENTM[T.mel[(ix+(bar%2?2:0))%8]%5],S16*(ix%2?1:1.6));
  /* chopped vocal-style chant stabs */
  if(phrase>=1){const ci=PCH[v].indexOf(s);if(ci>=0)chop(t,ch.ch[[0,2,1,3][(ci+bar)%4]],S16*1.4,ci+bar)}
  if(phrase>=2&&fill&&s===0)siren(t,S16*8);
  if(phrase>=1&&fill&&s===14)brass(t,[ch.b+24,ch.b+31],S16*2,.12,true);
}
function sched(n,t){
  if(n%16===0)D('bar',t,n);
  if(T.kind==='soul')return schedSoul(n,t);
  if(T.kind==='latin')return schedLatin(n,t);
  if(T.kind==='afro')return schedAfro(n,t);
  if(T.kind==='citypop')return schedCity(n,t);
  if(T.kind==='grime')return schedGrime(n,t);
  if(T.kind==='amapiano')return schedAmapiano(n,t);
  if(T.kind==='gqom')return schedGqom(n,t);
  if(T.kind==='phonk')return schedPhonk(n,t);
  const s=n%16,bar=Math.floor(n/16),ch=T.chords[bar%4],phrase=Math.floor(bar/4)%4;
  t+=(s%2?T.swing:0);
  if(s%4===0)kick(t);
  if(T.clap.indexOf(s)>=0)clap(t);
  if(s%4===2)hat(t,true);else if(s%4!==0&&(T.hatp[s]||((phrase>0||T.hats)&&s%2===1)))hat(t,false);
  if(T.percp&&T.percp[s])nz(t,'bandpass',3200,4,.16,.05,duck);
  if(T.bass[s])bass(t,s===15?ch.b+12:ch.b,S16*1.7);
  if(T.stab[s]&&phrase!==3){
    const nt=[ch.ch[0],ch.ch[1],ch.ch[3],ch.ext[4]],cut=T.cut+phrase*450+(s===13?350:0);
    if(T.wave==='square'){nt.forEach((m,i)=>piano(t+i*.006,m,.7,2))}else organ(t,nt,.24,.075,cut+2200);
  }
  if(T.arp&&phrase>=4-T.arp&&s%2===0)pluck(t,ch.ch[(s/2)%4]);
  if(phrase===3&&bar%4===3&&s>=8&&s%2===0)nz(t,'bandpass',2200,1,.18,.08,master);
}
function swoosh(){
  const t=ac.currentTime,s=ac.createBufferSource();s.buffer=noise;s.loop=true;
  const f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=2;f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(7000,t+.45);
  const gn=ac.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.linearRampToValueAtTime(.35,t+.35);gn.gain.exponentialRampToValueAtTime(.0001,t+.55);
  s.connect(f);f.connect(gn);gn.connect(master);s.start(t);s.stop(t+.6);
}
/* background tabs throttle setInterval to ~1/s, which starves the scheduler and makes the audio choppy.
   A Web Worker's timer is not throttled, so it drives the ticks; and when the tab is hidden we also schedule further ahead. */
let wk=null;
function startTicker(){
  stopTicker();
  try{const url=URL.createObjectURL(new Blob(['let i=setInterval(()=>postMessage(0),25);onmessage=e=>{if(e.data==="stop"){clearInterval(i);close()}}'],{type:'text/javascript'}));
    wk=new Worker(url);wk.onmessage=()=>{if(on)tick()};wk._u=url}catch(e){wk=null}
  if(!wk)timer=setInterval(tick,25);
}
function stopTicker(){
  if(wk){try{wk.postMessage('stop');wk.terminate();URL.revokeObjectURL(wk._u)}catch(e){}wk=null}
  clearInterval(timer);timer=0;
}
function tick(){const ahead=(typeof document!=='undefined'&&document.hidden)?1.6:.14;while(nextT<ac.currentTime+ahead){sched(step,nextT);nextT+=S16;step++}}
function apply(nt){
  T=nt;setTempo();if(ac&&on)swoosh();
  if(ac)mix();
  if(ac&&on){bumpPlay();step=0;nextT=Math.max(nextT,ac.currentTime+.05);t0=nextT}
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
      ac.resume();step=0;nextT=ac.currentTime+.1;t0=nextT;on=true;bumpPlay();mix();
      master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(.62,ac.currentTime+.4);
      tick();startTicker();
    }else{
      on=false;stopTicker();master.gain.cancelScheduledValues(ac.currentTime);master.gain.setValueAtTime(master.gain.value,ac.currentTime);master.gain.linearRampToValueAtTime(0,ac.currentTime+.25);
    }
    subs.forEach(f=>{try{f(on)}catch(e){}});return on;
  },
  shuffle(){return apply(makeTrack(newSeed()))},
  make(x){return(x&&typeof x==='object')?JSON.parse(JSON.stringify(x)):makeTrack(+x)},
  load(x){return apply(House.make(x))},
  plays(id){return readPlays()[id]||0},
  genres:GENRES,
  /* debug/test hooks: set House._dbg=[] to log voice events; _sched(n,t) renders step n at time t */
  _dbg:null,_sched:(n,t)=>sched(n,t),_ac:()=>ac,_s16:()=>S16
};
g.House=House;
})(window);

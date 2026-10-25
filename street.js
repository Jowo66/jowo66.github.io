/* Pixel street (?pixel): Ansimuz's Cyberpunk Street (CC0) as a fixed stage, drawn 1:1 and scaled up with hard edges.
   People (drawn in code or from the CraftPix townspeople), animals, drones, cars, rain and neon flicker are drawn on it pixel by pixel. The images come from tools/pixel/build-street.js and build-sprites.js.
   os.js hands over the #alley canvas, the shared day state and setBeach instead of starting the 3D alley. */
(function(g){
'use strict';
const SW=688,SH=272,VP=[246,166],HOR=166;
const IMG={},img=n=>IMG[n]||(IMG[n]=Object.assign(new Image(),{src:'assets/pixel/'+n+'.png'}));
const rnd=(a,b)=>a+Math.random()*(b-a),rndp=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const OUT='#0c0825';
/* a 175 cm person is 50 px tall on the crosswalk (the red car's scale) and shrinks to nothing at the end of the road */
const tall=y=>Math.max(0,50*(y-HOR)/59);

/* ---- walkable ground: each path is an inner and an outer edge with matching points; a walker keeps one lane between them ---- */
const PATHS={
  L:{side:true,inner:[[196,170],[150,180],[90,195],[-14,203]],outer:[[203,171],[160,187],[95,211],[-14,229]]},
  R:{side:true,inner:[[296,171],[380,190],[470,203],[702,206]],outer:[[290,173],[400,211],[520,219],[702,224]]},
  X:{side:false,inner:[[74,220],[436,220]],outer:[[66,228],[446,228]]}
};
function lanePts(P,l){return P.inner.map((a,i)=>{const b=P.outer[i];return[a[0]+(b[0]-a[0])*l,a[1]+(b[1]-a[1])*l]})}
function polyAt(pts,d){
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],s=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=s)return[a[0]+(b[0]-a[0])*d/s,a[1]+(b[1]-a[1])*d/s,b[0]-a[0]];d-=s}
  const a=pts[pts.length-2],b=pts[pts.length-1];return[b[0],b[1],b[0]-a[0],true];
}
const polyLen=pts=>pts.slice(1).reduce((s,b,i)=>s+Math.hypot(b[0]-pts[i][0],b[1]-pts[i][1]),0);

/* ---- who walks the street: the same types and lore as the 3D alley ---- */
const WEIGHTS={umbrella:3,courier:2,kimono:1,detective:1,samurai:1,kidrun:1,oldlady:1,robocop:1,netrunner:1,monk:1,sage:1,preacher:1,dealer:1,ripperdoc:1,walker:4};
const WLIST=Object.keys(WEIGHTS).flatMap(k=>Array(WEIGHTS[k]).fill(k));
const FEMOK=new Set(['umbrella','courier','detective','kidrun','sage','ripperdoc','netrunner','preacher','dealer','walker']);
const SKIN=['#f6cab6','#f1bd82','#c68947','#ad714c','#936041','#5c3a26','#3b2418'];
const HAIR=['#0e0d0b','#1a1126','#3b1218','#5f2785','#c68947','#eadfbf','#d42475','#63ffff','#3b2418'];
const TOPS=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a','#e05875','#4463eb','#d635a5','#31165c','#253145','#984e73','#eadfbf','#711327','#3b458f'];
const BOTS=['#1c2a3a','#281d51','#0e0d0b','#253145','#523450','#394c53','#3b1218'];
const NEONS=['#ff2e88','#19e3ff','#3dff9a','#ffb347'];
function look(name,fem){
  const o={skin:rndp(SKIN),hair:rndp(HAIR),top:rndp(TOPS),top2:rndp(TOPS),bot:rndp(BOTS),shoe:'#0e0d0b',hs:fem?rndp(['long','long','bun','short']):rndp(['short','short','mohawk','bald']),
    hat:null,hatc:'#0e0d0b',coat:0,umb:null,pack:null,eye:Math.random()<.18?rndp(NEONS):null,visor:null,beard:null,sword:false};
  if(name==='umbrella')o.umb=rndp(['#ff2e88','#19e3ff','#ffb347','#eadfbf','#7c5cff','#e0352b']);
  if(name==='courier'){o.pack=rndp(['#ffb347','#3dff9a','#e0352b']);o.hat='cap';o.hatc=o.pack}
  if(name==='kimono'){o.coat=.9;o.top=rndp(['#e05875','#4463eb','#d635a5','#eadfbf','#711327']);o.top2='#ffb347';o.hs='bun'}
  if(name==='detective'||name==='dealer'){o.coat=.55;o.top=rndp(['#523450','#394c53','#3b1218','#1c2a3a']);o.hat='fedora';o.hatc='#1a1126'}
  if(name==='samurai'){o.coat=.6;o.top=rndp(['#31165c','#1c2a3a','#711327']);o.top2='#eadfbf';o.hs='topknot';o.hair='#0e0d0b';o.sword=true}
  if(name==='oldlady'){o.hair='#c4c0d0';o.hs='bun';o.coat=.5;o.top=rndp(['#984e73','#5f2785','#523450'])}
  if(name==='robocop'){o.top='#7d90b2';o.bot='#4a5778';o.skin='#9aaecb';o.hs='bald';o.visor='#ff4d60';o.eye=null}
  if(name==='netrunner'){o.hs='hood';o.hair=rndp(['#1a1126','#31165c','#253145']);o.top=o.hair;o.visor=rndp(NEONS);o.eye=null}
  if(name==='monk'){o.coat=.9;o.top='#f6932e';o.top2='#d00000';o.hs='bald'}
  if(name==='sage'){o.coat=.9;o.top=rndp(['#eadfbf','#5ba1b0','#984e73']);o.hair='#eadfbf';o.hs='long';o.beard='#eadfbf'}
  if(name==='preacher'){o.coat=.7;o.top='#0e0d0b';o.top2='#fff7f4';o.hat='fedora'}
  if(name==='ripperdoc'){o.coat=.55;o.top='#e8ffde';o.eye=rndp(NEONS)}
  return o;
}

/* ---- a person drawn pixel by pixel at an exact height, then outlined; frames 0..3 are the walk cycle ---- */
function render(p,H,dir,fr){
  const lk=p.look,CW=H*2+16,CH=H+Math.round(H*.5)+10,cv=document.createElement('canvas');cv.width=CW;cv.height=CH;
  const c=cv.getContext('2d'),R=(x,y,w,h,col)=>{if(w>0&&h>0&&col){c.fillStyle=col;c.fillRect(x,y,w,h)}};
  const cx=Math.floor(CW/2),fy=CH-2,side=dir==='l'||dir==='r',face=dir==='r'?1:-1,swing=[0,1,0,-1][fr];
  const head=Math.max(2,Math.round(H*.16)),hw=Math.max(2,Math.round(H*.13)),tor=Math.max(2,Math.round(H*.32)),leg=Math.max(1,H-head-tor);
  let sw=Math.max(3,Math.round(H*.25*p.sw));if(side)sw=Math.max(2,Math.round(sw*.6));
  const tx=cx-Math.floor(sw/2),hx=cx-Math.floor(hw/2),yH=fy-H+1,yT=yH+head,yL=yT+tor;
  /* umbrella first so the arm holding it is drawn over the handle */
  if(lk.umb&&H>=8){const uw=Math.max(5,Math.round(H*.72))|1,uh=Math.max(2,Math.round(H*.17)),ty=yH-Math.max(1,Math.round(H*.1))-uh,hxx=side?cx+face*Math.max(1,Math.round(sw*.3)):tx+sw;
    for(let i=0;i<uh;i++){const w=Math.max(3,Math.round(uw*(.4+.6*(i+1)/uh)));R(hxx-Math.floor(w/2),ty+i,w,1,i===uh-1&&uh>2?'#fff7f4':lk.umb)}
    R(hxx,ty+uh,1,yT+Math.floor(tor*.6)-ty-uh,'#7d90b2')}
  /* legs */
  const lw=side?Math.max(1,Math.round(sw*.5)):Math.max(1,Math.floor((sw-(sw>=5?1:0))/2));
  if(side){const st=swing*Math.max(1,Math.round(H*.07));
    [[-st,'#0e0d0b'],[st,lk.bot]].forEach(([o,col],k)=>{const half=Math.ceil(leg/2),x=cx-Math.floor(lw/2);R(x+Math.round(o/2),yL,lw,half,k?lk.bot:shade(lk.bot));R(x+o,yL+half,lw,leg-half,k?lk.bot:shade(lk.bot));if(H>=12)R(x+o+(face>0?0:-1),fy,lw+1,1,lk.shoe)})}
  else{const lift=H>=14?[[0,0],[1,0],[0,0],[0,1]][fr]:[0,0];
    R(tx,yL,lw,leg-lift[0],lk.bot);R(tx+sw-lw,yL,lw,leg-lift[1],lk.bot);
    if(H>=12){R(tx,fy-lift[0],lw,1,lk.shoe);R(tx+sw-lw,fy-lift[1],lw,1,lk.shoe)}}
  /* body, robe or coat over the legs, belt */
  R(tx,yT,sw,tor,lk.top);
  if(lk.coat)R(tx,yL,sw,Math.round(leg*lk.coat),lk.top);
  if(lk.coat>.8&&H>=12)R(tx,yL-1,sw,1,lk.top2);
  if(lk.top2&&H>=20&&(p.name==='preacher'))R(cx,yT,1,2,lk.top2);
  if(lk.pack&&H>=8){if(dir==='b')R(tx+1,yT+1,sw-2,Math.round(tor*.75),lk.pack);else if(side)R(face>0?tx-Math.max(1,Math.round(sw*.4)):tx+sw,yT+1,Math.max(1,Math.round(sw*.4)),Math.round(tor*.75),lk.pack)}
  if(lk.sword&&H>=14)for(let i=0;i<Math.round(H*.3);i++)R(side?cx-face*(i-2):tx-1+Math.floor(i/2)-Math.round(H*.1),yL-2+Math.floor(i*.4),1,1,'#c4d7bb');
  /* arms with a hand pixel; the umbrella hand stays up */
  if(H>=10){const al=tor-1,hand=lk.skin;
    if(side){const ax=cx+swing*face*(H>=20?2:1);R(ax,yT+1,1,al,shade(lk.top));R(ax,yT+al,1,1,hand)}
    else{const s1=H>=16?swing:0;R(tx-1,yT+1+s1,1,al,lk.top);R(tx-1,yT+al+s1,1,1,hand);
      if(lk.umb)R(tx+sw,yT+1,1,Math.floor(tor*.6),lk.top);else{R(tx+sw,yT+1-s1,1,al,lk.top);R(tx+sw,yT+al-s1,1,1,hand)}}}
  /* head, hair, face */
  R(hx,yH,hw,head,lk.skin);
  const hr=lk.hair,top=Math.max(1,Math.round(head*.3));
  if(dir==='b'&&lk.hs!=='bald')R(hx,yH,hw,head,hr);
  else if(lk.hs==='hood'){R(hx-1,yH-1,hw+2,top+1,hr);R(hx-1,yH,1,head+1,hr);R(hx+hw,yH,1,head+1,hr)}
  else if(lk.hs!=='bald'){R(hx,yH,hw,top,hr);
    if(side)R(face>0?hx:hx+hw-1,yH,1,Math.ceil(head*.7),hr);
    if(lk.hs==='long'){R(hx-1,yH,1,head+Math.round(tor*.45),hr);R(hx+hw,yH,1,head+Math.round(tor*.45),hr)}
    if(lk.hs==='bun')R(cx-1,yH-2,2,2,hr);
    if(lk.hs==='mohawk')R(cx,yH-Math.max(1,Math.round(H*.05)),1,Math.max(1,Math.round(H*.05)),hr);
    if(lk.hs==='topknot')R(cx,yH-2,1,2,hr)}
  if(dir==='f'&&H>=16){const ey=yH+Math.floor(head*.55);
    if(lk.visor)R(hx,ey,hw,1,lk.visor);
    else if(hw>=4){R(hx+1,ey,1,1,OUT);R(hx+hw-2,ey,1,1,lk.eye||OUT)}
    if(lk.beard)R(hx,ey+1,hw,head-Math.floor(head*.55)+Math.round(tor*.35),lk.beard)}
  if(side&&H>=16){const ey=yH+Math.floor(head*.55);R(face>0?hx+hw-1:hx,ey,1,1,lk.visor||lk.eye||OUT)}
  if(lk.hat==='fedora'&&H>=8){R(hx-1,yH,hw+2,1,lk.hatc);R(hx,yH-Math.max(1,Math.round(head*.45)),hw,Math.max(1,Math.round(head*.45)),lk.hatc)}
  if(lk.hat==='cap'&&H>=8){R(hx,yH,hw,1,lk.hatc);if(side)R(face>0?hx+hw:hx-1,yH+1,1,1,lk.hatc);else if(dir==='f')R(hx,yH+1,hw,1,shade(lk.hatc))}
  outline(c,CW,CH);
  return{cv,ax:cx,ay:fy};
}
function shade(h){const v=parseInt(h.slice(1),16);return'#'+[v>>16,v>>8&255,v&255].map(x=>(x*.62|0).toString(16).padStart(2,'0')).join('')}
function outline(c,W,H){
  const d=c.getImageData(0,0,W,H),a=d.data,o=new Uint8ClampedArray(a);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(a[i+3])continue;
    if((x>0&&a[i-1])||(x<W-1&&a[i+7])||(y>0&&a[i-W*4+3])||(y<H-1&&a[i+W*4+3])){o[i]=12;o[i+1]=8;o[i+2]=37;o[i+3]=255}}
  c.putImageData(new ImageData(o,W,H),0,0);
}
/* ---- drawn sprites from the Craftpix free packs, packed by tools/pixel/build-sprites.js ----
   town.png: Cyberpunk Townspeople, 48px frames, three rows each (walk, idle, special); n is the frame count per row, 0 for none.
   type and fem pick the alley lore their ID file is written from; ax is the column their feet stand on. They face right. */
const TOWN=[
  {n:[6,6,6],type:'dealer',fem:false},           /* smoking */
  {n:[6,4,4],type:'netrunner',fem:false},        /* hooded */
  {n:[6,4,6],type:'walker',fem:true},
  {n:[6,4,4],type:'walker',fem:true},            /* shopping bag */
  {n:[6,4,0],type:'walker',fem:false,busk:true}, /* plays the guitar when standing */
  {n:[6,4,6],type:'courier',fem:false},
  {n:[0,4,6],type:'sage',fem:false,sit:true},
  {n:[0,4,4],type:'monk',fem:false,sit:true},
  {n:[6,4,0],type:'walker',fem:true},
  {n:[4,4,6],type:'walker',fem:false,ax:20},     /* wheelchair */
  {n:[6,4,0],type:'kidrun',fem:false},
  {n:[6,4,0],type:'kidrun',fem:true}
];
const TFR=48,TREF=35,TAX=16;  /* an adult is 35px tall in the frame, so a townsperson is drawn at tall(y)/35 */
const TMIN=.55;               /* below this scale they would turn to mush, so they fade into the dark instead */
/* animals.png: Street Animals at half size, rows walk and idle in 24px bands; fw is the frame width, foot the row their feet are on */
const ANIM={
  dog:{r:0,fw:24,n:[6,4],foot:24,say:'woof'},dog2:{r:2,fw:24,n:[6,4],foot:24,say:'woof!'},
  cat:{r:4,fw:24,n:[6,4],foot:24,say:'mrrp'},cat2:{r:6,fw:24,n:[6,4],foot:24,say:'meow'},
  rat:{r:8,fw:16,n:[4,4],foot:16,say:'squeak'},rat2:{r:10,fw:16,n:[4,4],foot:16,say:'squeak'},
  crow:{r:12,fw:16,n:[6,4],foot:16,say:'caw'},pigeon:{r:14,fw:16,n:[6,4],foot:16,say:'coo'}
};
/* drones.png: one 48px row per drone, its flying loop; face is the way the art points */
const DRN=[{n:8,face:1},{n:4,face:-1},{n:4,face:1},{n:4,face:1}];

function start(o){
  const cv=o.cv,c=cv.getContext('2d'),DAYST=o.DAYST,reduce=o.reduce;
  cv.classList.add('pix');document.documentElement.classList.add('pixmode');
  let W,H,S,ox=0,oy=0,mx=0,smx=0;
  function size(){S=Math.max(1,Math.round(innerHeight/SH),Math.ceil(innerWidth/SW));W=cv.width=Math.ceil(innerWidth/S);H=cv.height=Math.ceil(innerHeight/S);c.imageSmoothingEnabled=false}
  size();addEventListener('resize',size);
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5});

  let dayOn=false,dayK=0;
  try{if(localStorage.getItem('jowo.day')==='1'){dayOn=true;dayK=1}}catch(e){}
  DAYST.on=dayOn;DAYST.k=dayK;

  /* ---- traffic: the red car and the taxi pull away up the road and come back to wait at the crossing; the far car idles ---- */
  const CARS=[
    {n:'red',x:267,y:183,w:76,h:56,base:43,s:1,st:'rest',t:rnd(3,8),k:0},
    {n:'taxi',x:175,y:173,w:37,h:37,base:33,s:1,st:'rest',t:rnd(6,12),k:0},
    {n:'far',x:238,y:165,w:29,h:25,base:22,s:1,st:'idle',t:0,k:0}
  ];
  const crossing=()=>chars.some(q=>q.path==='X');
  function updCars(dt){
    for(const car of CARS){
      if(car.st==='idle')continue;
      car.t-=dt;
      if(car.st==='rest'&&car.t<=0){car.st='go';car.k=.08}
      else if(car.st==='go'){car.k=Math.min(1.3,car.k+dt*.45);car.s*=Math.exp(-dt*car.k);if(car.s<.05){car.st='gone';car.t=rnd(4,10)}}
      else if(car.st==='gone'&&car.t<=0&&!crossing()){car.st='come';car.s=1.9}
      else if(car.st==='come'){car.s=1+(car.s-1)*Math.exp(-dt*1.5);if(car.s-1<.01){car.s=1;car.st='rest';car.t=rnd(5,12)}}
    }
  }
  const carsAway=()=>CARS.every(q=>q.st==='idle'||q.st==='gone'||(q.st==='go'&&q.s<.6));
  function carBox(car){const s=car.s;return[VP[0]+(car.x-VP[0])*s,VP[1]+(car.y-VP[1])*s,car.w*s,car.h*s]}

  /* ---- people ---- */
  /* chars holds everyone who can be hovered: kind 'code' people drawn in code, 'town' drawn townspeople, 'bot' drones */
  let chars=[],spawnT=0,townT=1,botT=rnd(3,8),bubT=3;
  function makeChar(name,femIn){
    const fem=femIn===undefined?FEMOK.has(name)&&Math.random()<.5:femIn,cy=name!=='drone'&&Math.random()<.15;
    const def=g.LP?LP.make(name==='walker'?'umbrella':(name==='sage'&&fem?'sageF':name),fem,cy):{bub:['…']};
    const agev=g.Lore?Lore.age(def,name):30,isF=fem||name==='kimono'||name==='oldlady',body=g.Lore?Lore.body(name,isF,agev,def):null;
    const ch={kind:'code',name,fem,cy,def,agev,body,myth:g.Lore?Lore.mythName():null,look:look(name,fem),sw:body&&body.sw?clamp(body.sw,.75,1.5):1,
      hk:body&&body.cm?clamp(body.cm/175,.5,1.2):1,cache:new Map(),ph:Math.random()*4,id:Math.random()};
    if(name==='walker')ch.look.umb=null;
    if(cy&&!ch.look.eye&&!ch.look.visor)ch.look.eye=rndp(NEONS);
    return ch;
  }
  /* put a walker on a path: d runs from the far end (0) to the near end (len); toward means walking toward the near end */
  function onPath(ch,pk,lane){const P=PATHS[pk];ch.path=pk;ch.lane=lane;ch.pts=lanePts(P,lane);ch.len=polyLen(ch.pts)}
  /* where on a path a drawn sprite reaches its smallest readable size */
  function dMin(ch){for(let d=0;d<ch.len;d+=2)if(tall(polyAt(ch.pts,d)[1])/TREF>=TMIN)return d;return ch.len}
  function spawn(initial){
    const name=rndp(WLIST),ch=makeChar(name);
    const pk=carsAway()&&Math.random()<.35?'X':(Math.random()<.35?'L':'R');  /* the near end of the left sidewalk is usually off-screen, so most people take the right one */
    onPath(ch,pk,rnd(.08,.92));
    ch.toward=pk==='X'?Math.random()<.5:Math.random()<.62;
    ch.sp=(name==='kidrun'?30:name==='oldlady'?10:name==='courier'?26:16)+rnd(-3,4);
    ch.d=initial?rnd(.05,.85)*ch.len:(ch.toward?0:ch.len);
    if(pk!=='X'&&ch.toward&&!initial)ch.d=rnd(0,.15)*ch.len;
    chars.push(ch);return ch;
  }
  /* drawn townspeople keep to the near part of the street: they come out of the dark or in from the edge, and fade into the dark going away */
  function makeTown(i){const t=TOWN[i],ch=makeChar(t.type,t.fem);ch.kind='town';ch.town=i;ch.row=0;ch.face=1;ch.alpha=1;return ch}
  function spawnTown(initial){
    const walkers=TOWN.map((t,i)=>i).filter(i=>TOWN[i].n[0]&&!chars.some(q=>q.kind==='town'&&q.town===i));if(!walkers.length)return;
    const ch=makeTown(rndp(walkers)),pk=carsAway()&&Math.random()<.35?'X':(Math.random()<.1?'L':'R');
    onPath(ch,pk,pk==='X'?rnd(.2,.8):rnd(.3,.95));
    ch.sp=(TOWN[ch.town].type==='kidrun'?24:15)+rnd(-2,3);
    const lo=pk==='X'?0:dMin(ch);ch.toward=Math.random()<.5;
    ch.d=initial?rnd(lo,ch.len):(ch.toward?lo:ch.len);
    chars.push(ch);
  }
  /* a few people stand around: outside the bar, by the pizza place, at the toy shop door */
  const SPOTS=[[352,185,'f'],[64,207,'f'],[548,214,'f'],[312,183,'r']];
  function spawnIdle(sp){const ch=makeChar(rndp(['walker','walker','detective','netrunner','dealer','kimono','umbrella','ripperdoc']));ch.idle=true;ch.x=sp[0];ch.y=sp[1];ch.dir=sp[2];ch.life=rnd(25,60);chars.push(ch)}
  /* and the drawn ones have their own corners: a busker, someone sitting against the wall, people waiting about */
  /* most screens show x 100-580 of the street, so the corners sit inside that */
  const TSPOTS=[[470,207,-1,'busk'],[418,200,1,'sit'],[536,214,-1,'any'],[566,210,-1,'any']];
  function spawnTownIdle(sp){
    const pool=TOWN.map((t,i)=>i).filter(i=>(sp[3]==='busk'?TOWN[i].busk:sp[3]==='sit'?TOWN[i].sit:TOWN[i].n[0]&&!TOWN[i].busk&&TOWN[i].ax===undefined)&&!chars.some(q=>q.kind==='town'&&q.town===i));
    if(!pool.length)return;const ch=makeTown(rndp(pool));ch.idle=true;ch.spot=sp;ch.x=sp[0];ch.y=sp[1];ch.face=sp[2];ch.row=1;ch.life=rnd(30,70);ch.spT=rnd(3,8);chars.push(ch);
  }
  /* drones cross above the street at the depth of some point on the road, and can be hovered like anyone else */
  function spawnBot(){
    const b=Math.floor(Math.random()*DRN.length),ch=makeChar('drone',false);ch.kind='bot';ch.bot=b;ch.idle=false;
    ch.y=rnd(186,214);const s=tall(ch.y)/TREF;ch.alt=rnd(70,150)-(s-.6)*40;ch.vx=(Math.random()<.5?1:-1)*rnd(16,30)*s;ch.x=ch.vx>0?-40:SW+40;ch.face=Math.sign(ch.vx);
    chars.push(ch);
  }
  for(let i=0;i<7;i++)spawn(true);
  for(let i=0;i<3;i++)spawnTown(true);
  SPOTS.slice(0,2).forEach(spawnIdle);
  TSPOTS.slice(0,2).forEach(spawnTownIdle);

  function updChars(dt){
    const n=k=>chars.filter(q=>q.kind===k&&!q.idle).length;
    spawnT-=dt;if(spawnT<=0&&n('code')<9){spawn(false);spawnT=rnd(1.5,4)}
    townT-=dt;if(townT<=0&&n('town')<4){spawnTown(false);townT=rnd(2.5,6)}
    botT-=dt;if(botT<=0&&n('bot')<2){spawnBot();botT=rnd(8,20)}
    for(const ch of chars){
      if(ch.kind==='bot'){ch.ph+=dt*8;ch.x+=ch.vx*dt;ch.alt+=Math.sin(ch.ph*.4)*dt*2;if(ch.x<-60||ch.x>SW+60)ch.dead=true;continue}
      if(ch.kind==='town'&&ch.idle){ch.ph+=dt*6;ch.life-=dt;ch.spT-=dt;
        /* now and then an idle townsperson does their special move once (smokes, waves, flexes) */
        const t=TOWN[ch.town];if(ch.row===1&&ch.spT<=0&&t.n[2]){ch.row=2;ch.ph=0}else if(ch.row===2&&ch.ph>=t.n[2]){ch.row=1;ch.ph=0;ch.spT=rnd(4,10)}
        if(ch.life<=0)ch.dead=true;continue}
      ch.ph+=dt*(ch.idle?0:ch.kind==='town'?ch.sp/2.4:ch.sp/7);
      if(ch.idle){ch.life-=dt;if(ch.life<=0)ch.dead=true;continue}
      const k=Math.max(.15,tall(ch.y||200)/50);
      ch.d+=(ch.toward?1:-1)*ch.sp*dt*k;
      const at=polyAt(ch.pts,clamp(ch.d,0,ch.len));ch.x=at[0];ch.y=at[1];
      ch.dir=ch.path==='X'?((at[2]>0)===ch.toward?'r':'l'):(ch.toward?'f':'b');
      if(ch.kind==='town'){ch.face=(at[2]>0)===ch.toward?1:-1;
        const s=tall(ch.y)/TREF;ch.alpha=ch.path==='X'?1:clamp((s-TMIN)/.08,0,1);
        if(ch.d>ch.len||ch.d<0||(ch.path!=='X'&&!ch.toward&&s<TMIN))ch.dead=true}
      else if(ch.d>ch.len||ch.d<0||tall(ch.y)<4)ch.dead=true;
    }
    if(chars.filter(q=>q.idle&&q.kind==='code').length<2&&Math.random()<dt*.2){const free=SPOTS.filter(s=>!chars.some(q=>q.idle&&q.x===s[0]));if(free.length)spawnIdle(rndp(free))}
    if(chars.filter(q=>q.idle&&q.kind==='town').length<3&&Math.random()<dt*.15){const free=TSPOTS.filter(s=>!chars.some(q=>q.spot===s));if(free.length)spawnTownIdle(rndp(free))}
    for(const ch of chars)if(ch.dead){if(ch.bubEl)ch.bubEl.remove();if(termCh===ch&&!pinned)closeTerm()}
    chars=chars.filter(q=>!q.dead);
    /* someone says something every few seconds */
    bubT-=dt;
    if(bubT<=0){bubT=rnd(2.5,6);const vis=chars.filter(q=>tall(q.y)>=16&&!q.bubEl&&q.def.bub&&(q.alpha===undefined||q.alpha>.9));if(vis.length){const ch=rndp(vis);say(ch,rndp(ch.def.bub),2.6)}}
    for(const ch of chars)if(ch.bubEl){ch.bubL-=dt;if(ch.bubL<=0){ch.bubEl.remove();ch.bubEl=null}}
  }
  function sprite(ch){
    const h=Math.max(4,Math.round(tall(ch.y)*ch.hk)),fr=ch.idle?0:Math.floor(ch.ph)%4,key=h+'|'+ch.dir+'|'+fr;
    let sp=ch.cache.get(key);
    if(!sp){sp=render(ch,h,ch.dir,fr);if(ch.cache.size>48)ch.cache.clear();ch.cache.set(key,sp)}
    return sp;
  }
  /* one frame of a sheet, scaled with hard edges and mirrored when facing the other way; feet (or centre) at x,y */
  function blit(im,sx,sy,sw,sh,ax,ay,x,y,s,face){
    x=Math.round(x);const dw=Math.round(sw*s),dh=Math.round(sh*s),dx=Math.round(x-ax*s),dy=Math.round(y-ay*s);
    if(face<0){c.save();c.translate(x*2,0);c.scale(-1,1);c.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);c.restore()}
    else c.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);
  }

  /* ---- animals: dogs and cats on the pavement, rats at night, pigeons by day, crows over the roofs ---- */
  let pets=[],petT=rnd(2,6);
  function spawnPet(kind,initial){
    const p={kind,a:ANIM[kind],ph:Math.random()*6,row:0,alpha:1,face:1};
    if(kind==='crow'){p.fly=true;p.y=rnd(30,120);p.vx=(Math.random()<.5?1:-1)*rnd(30,50);p.x=p.vx>0?-20:SW+20;p.face=Math.sign(p.vx);p.s=1}
    else if(kind==='pigeon'){p.home=[rnd(480,560),rnd(209,216)];p.x=p.home[0]+rnd(-10,10);p.y=p.home[1];p.row=1;p.t=rnd(1,3);p.life=rnd(40,80);p.face=Math.random()<.5?1:-1}
    else{onPath(p,Math.random()<.75?'R':'L',kind.startsWith('rat')?rnd(0,.08):rnd(.5,.95));const lo=dMin(p);p.toward=Math.random()<.5;
      p.d=initial?rnd(lo,p.len):(p.toward?lo:p.len);p.sp=kind.startsWith('rat')?rnd(40,55):kind.startsWith('cat')?rnd(14,20):rnd(18,26);p.t=rnd(3,8)}
    pets.push(p);
  }
  function updPets(dt){
    const night=dayK<.5;petT-=dt;
    if(petT<=0){petT=rnd(4,12);
      const pool=['dog','dog2','cat','cat2','crow',night?'rat':'pigeon',night?'rat2':'pigeon'].filter(k=>pets.filter(p=>p.kind===k).length<(k==='pigeon'?4:1));
      if(pool.length)spawnPet(rndp(pool))}
    for(const p of pets){
      p.ph+=dt*(p.row===1?5:8);
      if(p.fly){p.x+=p.vx*dt;if(p.x<-30||p.x>SW+30)p.dead=true;continue}
      if(p.kind==='pigeon'){
        /* pecking about: stand, take a few steps, stand again; they leave when the light goes */
        p.t-=dt;p.life-=dt;if(p.t<=0){p.row=p.row?0:1;p.t=p.row?rnd(1.5,4):rnd(.4,1);if(!p.row)p.face=p.x>p.home[0]+8?-1:p.x<p.home[0]-8?1:(Math.random()<.5?1:-1)}
        if(!p.row)p.x+=p.face*10*dt;if(p.life<=0||night)p.dead=true;continue}
      /* dogs and cats stop to sniff now and then; rats never stop */
      p.t-=dt;if(p.t<=0&&!p.kind.startsWith('rat')){p.row=p.row?0:1;p.t=p.row?rnd(1.5,3):rnd(4,9)}
      if(!p.row){const k=Math.max(.15,tall(p.y||200)/50);p.d+=(p.toward?1:-1)*p.sp*dt*k}
      const at=polyAt(p.pts,clamp(p.d,0,p.len));p.x=at[0];p.y=at[1];if(!p.row)p.face=(at[2]>0)===p.toward?1:-1;
      const s=tall(p.y)/TREF;p.alpha=clamp((s-TMIN)/.08,0,1);
      if(p.d>p.len||p.d<0||(!p.toward&&s<TMIN)||(p.kind.startsWith('rat')&&!night))p.dead=true;
    }
    pets=pets.filter(p=>{if(p.dead&&p.bubEl)p.bubEl.remove();return!p.dead});
    for(const p of pets)if(p.bubEl){p.bubL-=dt;if(p.bubL<=0){p.bubEl.remove();p.bubEl=null}}
  }
  for(let i=0;i<2;i++)spawnPet(rndp(['dog','cat','cat2','dog2']),true);

  /* ---- speech bubbles are page elements, so their text stays sharp and the language filter can translate them ---- */
  function say(ch,txt,dur){const el=document.createElement('div');el.className='pbub';el.textContent=txt;document.body.appendChild(el);ch.bubEl=el;ch.bubL=dur}

  /* ---- hover a person to peek at their file, click to pin it (same terminal as the 3D alley) ---- */
  const term=document.createElement('div');term.className='ctm';term.hidden=true;
  term.innerHTML='<div class="ch"><span class="tt"></span><button aria-label="Close">×</button></div><pre></pre>';
  document.body.appendChild(term);
  let termCh=null,termTxt='',termN=0,pinned=false;
  function closeTerm(){term.hidden=true;termCh=null;pinned=false;term.classList.remove('pin')}
  term.addEventListener('pointerdown',()=>{pinned=true;term.classList.add('pin')});
  term.querySelector('button').onclick=closeTerm;
  function showTerm(ch,pin){
    if(!g.Lore)return;
    const p=ch.prof||(ch.prof=Lore.profile(ch));termCh=ch;pinned=!!pin;term.classList.toggle('pin',!!pin);
    termTxt='age ........ '+p.age+(p.body?'\nbody ....... '+p.body:'')+'\npassion .... '+p.passion+'\ngenre ...... '+p.genre+'\nnote ....... '+p.fact;
    const tt=term.querySelector('.tt');tt.textContent='ID://'+p.name+' ';
    (p.codes||[]).forEach((cd,i)=>{if(!cd)return;const im=document.createElement('img');im.className='flg';im.alt=(p.flags||'').split(' ')[i]||cd;im.title=cd;im.src='https://flagcdn.com/w40/'+cd.toLowerCase()+'.png';
      im.onerror=()=>{im.replaceWith(document.createTextNode(im.alt+' '))};tt.appendChild(im)});
    termN=0;term.hidden=false;placeTerm();
  }
  function placeTerm(){
    if(!termCh||!termCh.bb||term.hidden)return;
    const sx=innerWidth/W,sy=innerHeight/H,bb=termCh.bb,tw=term.offsetWidth||300,R=bb[2]*sx+tw+24<innerWidth;
    term.dataset.side=R?'R':'L';term.style.left=clamp(R?bb[2]*sx+14:bb[0]*sx-14-tw,6,innerWidth-tw-6)+'px';term.style.top=clamp(bb[1]*sy-8,48,innerHeight-190)+'px';
  }
  function updTerm(dt){
    if(!termCh)return;termN+=dt*70;
    term.querySelector('pre').textContent=termTxt.slice(0,Math.floor(termN))+(termN<termTxt.length||Math.floor(performance.now()/500)%2?'█':' ');
    if(!chars.includes(termCh)){if(pinned){term.querySelector('pre').textContent=termTxt;termCh=null}else closeTerm()}
    else placeTerm();
  }
  const hitAt=(px,py)=>chars.filter(q=>q.bb&&px>=q.bb[0]&&px<=q.bb[2]&&py>=q.bb[1]&&py<=q.bb[3]).sort((a,b)=>b.y-a.y)[0];
  /* animals have no files: clicking one just gets a noise out of it */
  const petAt=(px,py)=>pets.find(p=>p.bb&&p.alpha>.5&&px>=p.bb[0]&&px<=p.bb[2]&&py>=p.bb[1]&&py<=p.bb[3]);
  cv.addEventListener('pointerdown',e=>{const px=e.clientX*W/innerWidth,py=e.clientY*H/innerHeight,hit=hitAt(px,py),pet=hit?null:petAt(px,py);if(pet&&!pet.bubEl){say(pet,pet.a.say,1.6);return}if(hit){if(termCh===hit){pinned=true;term.classList.add('pin')}else showTerm(hit,true)}else closeTerm()});
  addEventListener('pointermove',e=>{
    if(e.target!==cv)return;const px=e.clientX*W/innerWidth,py=e.clientY*H/innerHeight,hit=hitAt(px,py);cv.style.cursor=hit||petAt(px,py)?'pointer':'default';
    if(pinned)return;if(hit){if(termCh!==hit)showTerm(hit,false)}else if(termCh)closeTerm();
  });
  document.addEventListener('pointerdown',e=>{if(term.hidden||term.contains(e.target)||e.target===cv)return;closeTerm()},true);

  /* ---- neon signs flicker now and then: the sign is copied from the all-dark street for a moment ---- */
  const SIGNS=[[0,96,44,20],[572,14,24,100],[328,88,20,50],[518,114,52,18],[500,40,44,38],[96,84,48,46],[140,84,12,40]];
  const flick=[];let flickT=2;
  function updFlick(dt){flickT-=dt;if(flickT<=0){flickT=rnd(.8,3.5);flick.push({r:rndp(SIGNS),t:rnd(.06,.35),n:Math.random()<.4?2:1})}
    flick.forEach(f=>f.t-=dt);for(let i=flick.length-1;i>=0;i--)if(flick[i].t<=0){if(--flick[i].n>0)flick[i].t=rnd(.05,.15);else flick.splice(i,1)}}

  /* ---- rain: one-pixel streaks and splashes, at night ---- */
  const rain=Array.from({length:70},()=>({x:Math.random()*SW,y:Math.random()*SH,v:rnd(150,230)})),spl=[];
  function updRain(dt){for(const r of rain){r.y+=r.v*dt;r.x-=r.v*dt*.18;const gy=r.y>HOR+4&&Math.random()<dt*4;if(r.y>SH||gy){if(r.y>HOR)spl.push({x:r.x|0,y:r.y|0,t:.18});r.y=-rnd(0,40);r.x=Math.random()*(SW+60)}}
    spl.forEach(s=>s.t-=dt);for(let i=spl.length-1;i>=0;i--)if(spl[i].t<=0)spl.splice(i,1)}

  /* ---- drawing ---- */
  function tile(im,y,par,alpha){
    const w=im.naturalWidth;if(!w||alpha<=0)return;c.globalAlpha=alpha;
    const x0=(((ox*par)%w)+w)%w-w;
    if(y+oy>0)for(let x=x0;x<W;x+=w)c.drawImage(im,0,0,w,1,x,0,w,y+oy);
    for(let x=x0;x<W;x+=w)c.drawImage(im,x,y+oy);
    c.globalAlpha=1;
  }
  function frame(){
    smx+=(mx-smx)*.04;
    const spare=Math.max(0,SW-W);ox=W>=SW?Math.round((W-SW)/2):Math.round(clamp(-spare/2-smx*Math.min(60,spare),-spare,0));oy=H-SH;
    const dk=dayK,n=1-dk;
    c.fillStyle=dk>.5?'#e8c9a0':'#1a1126';c.fillRect(0,0,W,H);
    /* sky and far city: night clouds and neon towers, or the dusk sky and orange city by day */
    tile(img('sky-back'),0,.25,n);tile(img('sky-city'),HOR+4-192,.45,n);
    tile(img('sky-dusk'),0,.25,dk);tile(img('city-dusk'),0,.45,dk);
    /* the street itself, its night palette fading in over the day one */
    const st=img('street'),stn=img('street-n');
    if(st.naturalWidth){if(dk>0){c.globalAlpha=1;c.drawImage(st,ox,oy)}if(n>0){c.globalAlpha=n;c.drawImage(stn,ox,oy)}c.globalAlpha=1}
    const off=img('street-off');
    if(off.naturalWidth)for(const f of flick){const r=f.r;c.drawImage(off,r[0],r[1],r[2],r[3],r[0]+ox,r[1]+oy,r[2],r[3])}
    /* cars, people and the street lamps, back to front */
    const items=[];
    for(const car of CARS){if(car.st==='gone')continue;const b=carBox(car);items.push({y:VP[1]+(car.y+car.base-VP[1])*car.s,draw:()=>{
      const sx=Math.round(b[0])+ox,sy=Math.round(b[1])+oy,sw=Math.max(1,Math.round(b[2])),sh=Math.max(1,Math.round(b[3]));
      const a=img('car-'+car.n),an=img('car-'+car.n+'-n');if(dk>0&&a.naturalWidth)c.drawImage(a,sx,sy,sw,sh);if(n>0&&an.naturalWidth){c.globalAlpha=n;c.drawImage(an,sx,sy,sw,sh);c.globalAlpha=1}}})}
    const bubAt=(q,x,y)=>{if(q.bubEl){q.bubEl.style.left=(x*innerWidth/W)+'px';q.bubEl.style.top=((y-3)*innerHeight/H)+'px'}};
    const town=img('town'),drones=img('drones'),anim=img('animals');
    for(const ch of chars){
      if(ch.kind==='bot'){if(!drones.naturalWidth)continue;items.push({y:ch.y,draw:()=>{
        const s=Math.max(1,Math.round(tall(ch.y)))/TREF,b=DRN[ch.bot],x=ch.x+ox,y=ch.alt+oy;
        blit(drones,(Math.floor(ch.ph)%b.n)*TFR,ch.bot*TFR,TFR,TFR,24,24,x,y,s,ch.face*b.face);
        ch.bb=[x-18*s,y-14*s,x+18*s,y+16*s];bubAt(ch,x,y-14*s)}});continue}
      if(ch.kind==='town'){if(!town.naturalWidth)continue;items.push({y:ch.y,draw:()=>{
        const t=TOWN[ch.town],s=Math.max(1,Math.round(tall(ch.y)))/TREF,x=ch.x+ox,y=ch.y+oy,n=t.n[ch.row]||1;
        c.globalAlpha=ch.alpha;blit(town,(Math.floor(ch.ph)%n)*TFR,(ch.town*3+ch.row)*TFR,TFR,TFR,t.ax||TAX,TFR,x,y,s,ch.face);c.globalAlpha=1;
        const top=t.sit?24:t.type==='kidrun'?27:36;ch.bb=ch.alpha>.5?[x-10*s,y-top*s,x+10*s,y]:null;bubAt(ch,x,y-(top+1)*s)}});continue}
      const sp=sprite(ch);items.push({y:ch.y,draw:()=>{
      const x=Math.round(ch.x)+ox-sp.ax,y=Math.round(ch.y)+oy-sp.ay;c.drawImage(sp.cv,x,y);
      const hh=Math.round(tall(ch.y)*ch.hk);ch.bb=[x+sp.ax-hh*.3,y+sp.ay-hh-2,x+sp.ax+hh*.3,y+sp.ay];
      bubAt(ch,x+sp.ax,y+sp.ay-hh-(ch.look.umb?hh*.35:0))}})}
    for(const p of pets){if(!anim.naturalWidth)break;items.push({y:p.fly?0:p.y,draw:()=>{
      const a=p.a,s=p.fly?1:Math.max(1,Math.round(tall(p.y)))/TREF,x=p.x+ox,y=(p.fly?p.y+a.foot:p.y)+oy,n=a.n[p.row];
      c.globalAlpha=p.alpha;blit(anim,(Math.floor(p.ph)%n)*a.fw,(a.r+p.row)*24,a.fw,a.foot,a.fw/2,a.foot,x,y,s,p.face);c.globalAlpha=1;
      p.bb=[x-a.fw/2*s,y-a.foot*s*.8,x+a.fw/2*s,y];bubAt(p,x,y-a.foot*s*.8)}})}
    items.push({y:223.5,draw:()=>{const p=img('props'),pn=img('props-n');if(dk>0&&p.naturalWidth)c.drawImage(p,ox,oy);if(n>0&&pn.naturalWidth){c.globalAlpha=n;c.drawImage(pn,ox,oy);c.globalAlpha=1}}});
    items.sort((a,b)=>a.y-b.y).forEach(it=>it.draw());
    /* rain */
    if(dk<.5){c.fillStyle='#5ba1b0';for(const r of rain){const x=Math.round(r.x)+ox,y=Math.round(r.y)+oy;c.fillRect(x,y,1,3);c.fillRect(x-1,y+3,1,1)}
      c.fillStyle='#7fb4ec';for(const s of spl){c.fillRect(s.x+ox-1,s.y+oy,1,1);c.fillRect(s.x+ox+1,s.y+oy,1,1)}}
  }

  /* ---- buttons: Day works as in the 3D alley; the monster has not been drawn for this street yet ---- */
  const dbtn=document.getElementById('day');
  if(dbtn){const sync=()=>{dbtn.textContent=dayOn?'☾ NIGHT':'☀ DAY';dbtn.setAttribute('aria-pressed',dayOn?'true':'false');document.documentElement.classList.toggle('day',dayOn)};
    dbtn.addEventListener('click',()=>{dayOn=!dayOn;try{localStorage.setItem('jowo.day',dayOn?'1':'0')}catch(e){}sync();o.setBeach(dayOn);if(reduce){dayK=dayOn?1:0;frame()}});sync()}
  const mbtn=document.getElementById('mon');
  if(mbtn){mbtn.disabled=true;mbtn.title='The monster has not been drawn for the pixel street yet'}

  if(/[?&]debug/.test(location.search))g.__street={chars:()=>chars,pets:()=>pets,cars:()=>CARS,day:v=>{dayOn=v},say:(i,t)=>say(chars[i],t,3)};
  let last=0;
  function loop(t){
    const dt=Math.min((t-last)/1000||0,.05);last=t;
    try{dayK=clamp(dayK+(dayOn?1:-1)*dt/1.3,0,1);DAYST.on=dayOn;DAYST.k=dayK;
      updCars(dt);updChars(dt);updPets(dt);updFlick(dt);if(dayK<.5)updRain(dt);frame();updTerm(dt)}catch(err){console.error('street frame error',err)}
    requestAnimationFrame(loop);
  }
  if(reduce){const once=()=>{updChars(0);frame()};addEventListener('load',once);addEventListener('resize',once);setTimeout(once,300)}else requestAnimationFrame(loop);
}
g.PixelStreet={start};
})(window);

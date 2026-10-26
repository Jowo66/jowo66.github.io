/* Pixel street (?pixel): hand-drawn pixel streets drawn 1:1 and scaled up with hard edges, one alley after another.
   The crossing is Ansimuz's Cyberpunk Street (CC0); the back street is put together from his Streets of Fight tiles (CC0).
   People (drawn in code or from the CraftPix townspeople), animals, drones, cars, rain, neon flicker, the tower and the
   monster that attacks it are drawn on top pixel by pixel. The images come from tools/pixel/build-street.js and build-sprites.js.
   os.js hands over the #alley canvas, the shared day state and setBeach instead of starting the 3D alley. */
(function(g){
'use strict';
const IMG={},img=n=>IMG[n]||(IMG[n]=Object.assign(new Image(),{src:'assets/pixel/'+n+'.png'}));
const rnd=(a,b)=>a+Math.random()*(b-a),rndp=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const OUT='#0c0825';
/* the current scene's stage: its size, horizon, vanishing point, walkable paths and how tall a 175 cm person is at a given y */
let SW=688,SH=272,VP=[246,166],HOR=166,PATHS={},tall=()=>35;

/* ---- walkable ground: each path is an inner and an outer edge with matching points; a walker keeps one lane between them ---- */
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

/* ---- each alley turns the street's neon round the colour wheel: saturated pixels change hue, dark and grey ones stay ---- */
function hueShift(a,deg){
  for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;
    const r=a[i]/255,gg=a[i+1]/255,b=a[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),d=mx-mn,l=(mx+mn)/2;
    if(d<.12||l<.12)continue;const s=d/(1-Math.abs(2*l-1));if(s<.3)continue;
    let h=mx===r?((gg-b)/d+6)%6:mx===gg?(b-r)/d+2:(r-gg)/d+4;h=(h*60+deg)%360;
    const C=(1-Math.abs(2*l-1))*s,X=C*(1-Math.abs((h/60)%2-1)),m=l-C/2,q=h<60?[C,X,0]:h<120?[X,C,0]:h<180?[0,C,X]:h<240?[0,X,C]:h<300?[X,0,C]:[C,0,X];
    a[i]=(q[0]+m)*255;a[i+1]=(q[1]+m)*255;a[i+2]=(q[2]+m)*255}
}
const RC=new Map();
function recolored(im,deg){
  if(!deg)return im;let k=RC.get(im);if(!k)RC.set(im,k=new Map());let cv=k.get(deg);
  if(!cv){cv=document.createElement('canvas');cv.width=im.naturalWidth||im.width;cv.height=im.naturalHeight||im.height;const x=cv.getContext('2d');x.drawImage(im,0,0);
    const d=x.getImageData(0,0,cv.width,cv.height);hueShift(d.data,deg);x.putImageData(d,0,0);k.set(deg,cv)}
  return cv;
}
/* a 3x5 pixel font, just enough for the alley sign */
const GLY={A:'010101111101101',L:'100100100100111',E:'111100110100111',Y:'101101010010010','>':'100110111110100'};

/* ---- the tower every alley has in the distance: tiers of lit windows and neon bands, an antenna, and a hologram on top ---- */
function buildTower(h,w,seed,c1,c2,day){
  const cv=document.createElement('canvas');cv.width=w+2;cv.height=h;const x=cv.getContext('2d');
  let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647,R=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh)};
  const body=day?'#57506e':'#120e24',lite=day?'#8e88a8':'#2a2248',dark=day?'#3a3450':'#08060f',win=day?'#9fc2dc':'#ffb347',cx=Math.floor((w+2)/2);
  for(const[a,b,tw]of[[0,.5,w],[.5,.78,w-8],[.78,.9,w-14]]){
    const y0=Math.round(h-b*h),y1=Math.round(h-a*h),x0=cx-Math.floor(tw/2);
    R(x0,y0,tw,y1-y0,body);R(x0,y0,1,y1-y0,lite);R(x0+tw-1,y0,1,y1-y0,dark);R(x0,y0,tw,1,day?lite:c1);
    for(let yy=y0+3;yy<y1-2;yy+=4)for(let xx=x0+2;xx<x0+tw-2;xx+=3){const k=r();if(k<(day?.5:.38))R(xx,yy,1,2,day?win:k<.08?c2:win)}
  }
  const sy=Math.round(h*.1);R(cx-1,sy,3,Math.round(h*.04),body);R(cx,1,1,sy,day?'#8e88a8':'#5a5070');
  return cv;
}

/* ---- the back street: a side-on street put together from the Streets of Fight tiles, different every time ----
   wall pieces are [x, y, width, door column] in sof-tiles.png, all 96 px tall */
const WALL={A:[0,0,224,58],B:[240,0,32],C:[288,0,224],b0:[0,112,48],b1:[64,112,48],b2:[128,112,48],b3:[192,112,48],b4:[256,112,48,24],
  b5:[320,112,32],b6:[368,112,32],b8:[464,112,32],g1:[176,224,112],g2:[304,224,112],g3:[432,224,96]};
function backLayout(width){
  const seq=[];let w=0;
  const groups=[()=>['C','B'],()=>['b0',...Array.from({length:2+Math.floor(Math.random()*3)},()=>rndp(['b1','b1','b2','b3','b3','b4','b5'])),'b8'],()=>[rndp(['g1','g2','g3']),'b6']];
  /* the pizza place sits near the middle, where most screens look */
  const mid=Math.floor(width/2-112);
  while(w<mid){for(const k of rndp(groups)()){seq.push([k,w]);w+=WALL[k][2]}}
  for(const k of ['A','b4']){seq.push([k,w]);w+=WALL[k][2]}
  while(w<width){for(const k of rndp(groups)()){seq.push([k,w]);w+=WALL[k][2]}}
  return seq;
}

function start(o){
  const cv=o.cv,c=cv.getContext('2d'),DAYST=o.DAYST,reduce=o.reduce;
  cv.classList.add('pix');document.documentElement.classList.add('pixmode');
  let W,H,S,ox=0,oy=0,mx=0,smx=0,A=null,alleyNo=1,shake=0,flash=0;
  function size(){const fh=A?A.fitH:272;S=Math.max(1,Math.round(innerHeight/fh),Math.ceil(innerWidth/SW));W=cv.width=Math.ceil(innerWidth/S);H=cv.height=Math.ceil(innerHeight/S);c.imageSmoothingEnabled=false;oy=H-SH-pad()}
  /* scenes whose walkway is at the very bottom lift their stage clear of the app dock */
  const pad=()=>A&&A.padDock?Math.ceil(84/S):0;
  addEventListener('resize',size);
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5});
  ['street','street-n','street-off','props','props-n','town','animals','drones','cthulhu','expl-a','expl-b','sof-tiles','sof-back','sof-fore','sof-car','sof-hydrant','sof-barrel','v1-far','v1-back','v1-fore','roof-front','sew-back','sew-mid','sew-front','sew-water','fly-1','fly-2','fly-3'].forEach(img);

  let dayOn=false,dayK=0;
  try{if(localStorage.getItem('jowo.day')==='1'){dayOn=true;dayK=1}}catch(e){}
  DAYST.on=dayOn;DAYST.k=dayK;
  const pic=n=>{const im=img(n);return im.naturalWidth?recolored(im,A.hue):null};
  /* the Streets of Fight skyline comes on a black sky: clear the black so our own sky shows through */
  let nb=null;
  const noBlack=n=>{if(nb)return nb;const im=img(n);if(!im.naturalWidth)return null;const k=document.createElement('canvas');k.width=im.naturalWidth;k.height=im.naturalHeight;
    const x=k.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,k.width,k.height),a=d.data;for(let i=0;i<a.length;i+=4)if(a[i]+a[i+1]+a[i+2]<12)a[i+3]=0;x.putImageData(d,0,0);return nb=k};

  /* ---- the kinds of alley ----
     every alley has a stage size, paths, idle spots and a tower: base is where it disappears behind the street, top keeps the
     hologram on screen, hit is how far down the tower the monster aims, and side scenes (side) are walked left and right */
  const NEONP=[['#19e3ff','#ff2e88'],['#3dff9a','#ffb347'],['#7c5cff','#19e3ff'],['#ffb347','#ff3a3a'],['#ff2e88','#f5efe0'],['#ffd42a','#ff2e88']];
  function makeCross(hue){return{type:'cross',hue,fitH:272,SW:688,SH:272,HOR:166,VP:[246,166],depth:true,
    tall:y=>Math.max(0,50*(y-166)/59),
    paths:{
      L:{inner:[[196,170],[150,180],[90,195],[-14,203]],outer:[[203,171],[160,187],[95,211],[-14,229]]},
      /* the right pavement runs between the fence and the kerb: narrow by the bar, wider in front of the toy shop */
      R:{inner:[[296,172],[330,186],[360,200],[388,211],[470,213],[560,216],[702,215]],outer:[[291,175],[322,192],[352,210],[384,224],[470,228],[560,229],[702,230]]},
      X:{flat:true,inner:[[74,220],[436,220]],outer:[[66,228],[446,228]]}
    },
    spots:[[346,198,'f'],[64,207,'f'],[548,219,'f'],[318,188,'r']],
    tspots:[[470,216,-1,'busk'],[408,214,1,'sit'],[536,221,-1,'any'],[600,222,-1,'any']],
    pigeons:[480,560,220,227],crowY:()=>rnd(30,120),
    bot:()=>{const y=rnd(186,214),s=50*(y-166)/59/TREF;return{y,alt:rnd(70,150)-(s-.6)*40}},
    tower:{x:246,base:166,h:148,w:28,top:()=>Math.max(18,26-oy),hit:.36},monSide:1,sign:[300,147],panMax:()=>Math.min(60,Math.max(0,SW-W))/2}}
  function makeBack(hue){
    const BW=960,layout=backLayout(BW),doors=layout.filter(([k])=>WALL[k][3]!==undefined).map(([k,x])=>x+WALL[k][3]);
    const mid=doors.reduce((b,d)=>Math.abs(d-BW/2)<Math.abs(b-BW/2)?d:b,BW/2),tx=BW/2+rnd(60,140)*(Math.random()<.5?1:-1)*Math.min(1,(W||700)/600);  /* narrow screens keep the tower near the middle */
    const lamps=[];for(let x=rnd(40,120);x<BW;x+=rnd(220,300))lamps.push(x);
    const props=[];for(const[k,x]of layout){if(k[0]==='g'&&Math.random()<.6)props.push({n:'sof-barrel',x:x+WALL[k][2]+8,y:104,w:32});if(k==='b1'&&Math.random()<.35)props.push({n:'sof-hydrant',x:x+24,y:110,w:19})}
    return{type:'back',side:true,hue,fitH:400,SW:BW,SH:240,HOR:100,VP:[BW/2,100],depth:false,tall:()=>35,layout,doors,lamps,props,
      bushes:[rnd(60,300),rnd(560,900)],
      paths:{S:{flat:true,inner:[[-30,104],[BW+30,104]],outer:[[-30,158],[BW+30,158]]}},
      spots:doors.filter(d=>Math.abs(d-BW/2)<260).slice(0,3).map(d=>[d+10,106,'f']),
      tspots:[[BW/2+rnd(-60,60),142,rndp([-1,1]),'busk'],[mid+26,106,-1,'sit'],[BW/2-150,130,1,'any'],[BW/2+170,120,-1,'any']],
      pigeons:[BW/2-120,BW/2+120,128,150],crowY:()=>rnd(10-oy,-8),
      bot:()=>({y:rnd(110,150),alt:rnd(18-oy,-14)}),
      tower:{x:tx,base:60,h:300,w:30,top:()=>26-oy,hit:.3},monSide:tx>BW/2?-1:1,sign:[mid-14,40],panMax:()=>Math.min(240,Math.max(0,SW-W)/2)}}

  /* Restaurant Row: Cyberpunk Street's first version, a smaller street seen down its middle; people cross in front of the shops */
  function makeResto(hue){
    return{type:'resto',side:true,hue,fitH:232,SW:352,SH:192,HOR:150,VP:[150,146],depth:false,msMax:1,
      tall:y=>22+(y-152)*.35,
      paths:{S:{flat:true,inner:[[-30,156],[382,156]],outer:[[-30,186],[382,186]]}},
      spots:[[24,158,'f'],[262,159,'f'],[206,157,'f']],
      tspots:[[214,162,-1,'busk'],[300,160,-1,'sit'],[110,172,1,'any'],[180,178,-1,'any']],
      pigeons:[80,280,164,184],crowY:()=>rnd(4-oy,30),
      bot:()=>({y:rnd(160,184),alt:rnd(20-oy,60)}),
      tower:{x:150,base:140,h:140,w:22,top:()=>Math.max(14,26-oy),hit:.14},monSide:Math.random()<.5?1:-1,sign:[100,112],panMax:()=>Math.min(40,Math.max(0,SW-W))/2}}
  /* Rooftops: a roof deck high over the city skyline, with flying traffic and the most sky for the monster */
  function makeRoof(hue){
    const BW=960,tx=BW/2+rnd(40,120)*(Math.random()<.5?1:-1)*Math.min(1,(W||700)/600),props=[];
    for(let x=rnd(10,40);x<BW-30;x+=rnd(40,90))props.push({k:rndp(['ac','ac','vent','tank','mast','pole','pole','sign']),x:Math.round(x)});
    return{type:'roof',side:true,padDock:true,hue,fitH:272,SW:BW,SH:240,HOR:180,VP:[BW/2,180],depth:false,tall:()=>35,props,
      paths:{S:{flat:true,inner:[[-30,182],[BW+30,182]],outer:[[-30,214],[BW+30,214]]}},
      spots:[[BW/2-90,186,'f'],[BW/2+120,188,'f']],
      tspots:[[BW/2+40,198,-1,'busk'],[BW/2-150,182,1,'sit'],[BW/2+160,204,-1,'any'],[BW/2-40,210,1,'any']],
      pigeons:[BW/2-140,BW/2+140,190,210],crowY:()=>rnd(20-oy,110),
      bot:()=>({y:rnd(184,214),alt:rnd(40-oy,130)}),
      tower:{x:tx,base:172,h:440,w:34,top:()=>26-oy,hit:.28},monSide:tx>BW/2?-1:1,sign:[BW/2-60,146],panMax:()=>Math.min(240,Math.max(0,SW-W)/2)}}
  /* The Sewers: Ansimuz's tunnel under the street; no sky down here, so the monster comes up out of the water instead */
  function makeSewer(){
    const BW=928;
    return{type:'sewer',side:true,dark:true,padDock:true,hue:0,fitH:250,SW:BW,SH:240,HOR:207,VP:[BW/2,207],depth:false,tall:()=>35,
      paths:{S:{flat:true,inner:[[-30,197],[BW+30,197]],outer:[[-30,207],[BW+30,207]]}},
      spots:[[300,199,'f'],[640,200,'f']],
      tspots:[[560,204,-1,'busk'],[466,198,1,'sit'],[380,206,1,'any'],[620,202,-1,'any']],
      pigeons:null,crowY:null,bot:null,petPool:['rat','rat2','rat','cat2'],
      tower:null,sign:[536,118],panMax:()=>Math.min(240,Math.max(0,SW-W)/2)}}
  const MAKE={cross:makeCross,back:makeBack,resto:makeResto,roof:makeRoof,sewer:makeSewer},ORDER=['cross','back','resto','roof','sewer'];

  /* ---- traffic on the crossing: the far car idles; the taxi (seen from behind) drives off up the road and a new one pulls in
     from behind us; the red car (seen from the front) drives on towards us and off the bottom, and a new one comes down the road ---- */
  let CARS=[],SIDE=[],sideT=2,SKY=[],flyT=1;
  /* Warped Vehicles over the rooftops: which way each one's art points */
  const FLYART=[{n:'fly-1',face:-1},{n:'fly-2',face:1},{n:'fly-3',face:1}];
  const crossing=()=>chars.some(q=>q.path==='X');
  function updCars(dt){
    if(A.type==='roof'){
      flyT-=dt;if(flyT<=0){flyT=rnd(2,6);const r=Math.random()<.5?1:-1,far=Math.random()<.5;SKY.push({k:Math.floor(Math.random()*3),x:r>0?-ox-60:-ox+W+60,y:rnd(30-oy,far?60:140),v:r*rnd(40,90)*(far?.6:1)})}
      for(const q of SKY)q.x+=q.v*dt;SKY=SKY.filter(q=>q.x+ox>-120&&q.x+ox<W+120);return}
    if(A.type==='back'){
      /* the back street's cars drive straight past, one lane each way */
      sideT-=dt;if(sideT<=0){sideT=rnd(4,11);const near=Math.random()<.5;SIDE.push({x:near?-ox-80:-ox+W+80,y:near?214:192,v:(near?1:-1)*rnd(55,85),hue:rndp([0,0,60,150,210,300])})}
      for(const q of SIDE)q.x+=q.v*dt;SIDE=SIDE.filter(q=>q.x+ox>-100&&q.x+ox<W+100);return}
    for(const car of CARS){
      if(car.st==='idle')continue;
      car.t-=dt;const tw=car.dir==='toward';
      /* the red car would drive over the crossing, so it waits until nobody is on it */
      if(car.st==='rest'&&car.t<=0&&!(tw&&crossing())){car.st='go';car.k=.08}
      else if(car.st==='go'){car.k=Math.min(1.3,car.k+dt*.45);if(tw){car.s*=Math.exp(dt*car.k);if(car.s>3){car.st='gone';car.t=rnd(4,10)}}else{car.s*=Math.exp(-dt*car.k);if(car.s<.05){car.st='gone';car.t=rnd(4,10)}}}
      else if(car.st==='gone'&&car.t<=0&&!crossing()){car.st='come';car.s=tw?.05:1.9}
      else if(car.st==='come'){if(tw){car.s+=(1-car.s)*dt*1.3;if(1-car.s<.01){car.s=1;car.st='rest';car.t=rnd(5,12)}}else{car.s=1+(car.s-1)*Math.exp(-dt*1.5);if(car.s-1<.01){car.s=1;car.st='rest';car.t=rnd(5,12)}}}
    }
  }
  const carsAway=()=>A.type!=='cross'||CARS.every(q=>q.st==='idle'||q.st==='gone'||(q.dir==='toward'?q.st==='come'&&q.s<.5:q.st==='go'&&q.s<.6));
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
  /* put a walker on a path: d runs from the start (0) to the end (len) of its lane; toward means walking toward the end */
  function onPath(ch,pk,lane){const P=PATHS[pk];ch.path=pk;ch.lane=lane;ch.pts=lanePts(P,lane);ch.len=polyLen(ch.pts)}
  /* where on a path a drawn sprite reaches its smallest readable size */
  function dMin(ch){if(!A.depth)return 0;for(let d=0;d<ch.len;d+=2)if(tall(polyAt(ch.pts,d)[1])/TREF>=TMIN)return d;return ch.len}
  function pickPath(drawn){
    if(A.side)return'S';
    /* the near end of the left sidewalk is usually off-screen, so most people take the right one */
    return carsAway()&&Math.random()<.35?'X':(Math.random()<(drawn?.1:.35)?'L':'R');
  }
  /* on the long back street people enter just outside the visible part, not at the far ends */
  const edgeD=q=>clamp((q.toward?-ox-24:-ox+W+24)+30,0,q.len);
  function spawn(initial){
    const name=rndp(WLIST),ch=makeChar(name),pk=pickPath(false);
    onPath(ch,pk,rnd(.08,.92));
    ch.toward=pk==='R'||pk==='L'?Math.random()<.62:Math.random()<.5;
    ch.sp=(name==='kidrun'?30:name==='oldlady'?10:name==='courier'?26:16)+rnd(-3,4);
    ch.d=initial?rnd(.05,.95)*ch.len:(ch.toward?0:ch.len);
    if(!initial&&A.side)ch.d=edgeD(ch);
    if(A.depth&&pk!=='X'&&ch.toward&&!initial)ch.d=rnd(0,.15)*ch.len;
    chars.push(ch);return ch;
  }
  /* drawn townspeople keep to where they read well: on the crossing they fade into the dark going up the road;
     on the back street they come and go by the doors as well as the ends of the street */
  function makeTown(i){const t=TOWN[i],ch=makeChar(t.type,t.fem);ch.kind='town';ch.town=i;ch.row=0;ch.face=1;ch.alpha=1;return ch}
  function spawnTown(initial){
    const walkers=TOWN.map((t,i)=>i).filter(i=>TOWN[i].n[0]&&!chars.some(q=>q.kind==='town'&&q.town===i));if(!walkers.length)return;
    const ch=makeTown(rndp(walkers)),pk=pickPath(true);
    onPath(ch,pk,pk==='X'?rnd(.2,.8):rnd(.3,.95));
    ch.sp=(TOWN[ch.town].type==='kidrun'?24:15)+rnd(-2,3);
    const lo=pk==='X'?0:dMin(ch);ch.toward=Math.random()<.5;
    ch.d=initial?rnd(lo,ch.len):(ch.toward?lo:ch.len);
    if(A.side){
      if(!initial)ch.d=edgeD(ch);
      const dx=(A.doors||[]).filter(d=>d>40&&d<SW-40);
      if(!initial&&dx.length&&Math.random()<.4){ch.d=rndp(dx)+30;ch.fade=0}
      const ahead=dx.filter(d=>ch.toward?d+30>ch.d+60:d+30<ch.d-60);if(ahead.length&&Math.random()<.35)ch.exitD=rndp(ahead)+30;
    }
    chars.push(ch);
  }
  /* a few people stand around: outside the bar, by the shops, at the doors */
  function spawnIdle(sp){const ch=makeChar(rndp(['walker','walker','detective','netrunner','dealer','kimono','umbrella','ripperdoc']));ch.idle=true;ch.spot=sp;ch.x=sp[0];ch.y=sp[1];ch.dir=sp[2];ch.life=rnd(25,60);chars.push(ch)}
  /* and the drawn ones have their own corners: a busker, someone sitting against the wall, people waiting about */
  function spawnTownIdle(sp){
    const pool=TOWN.map((t,i)=>i).filter(i=>(sp[3]==='busk'?TOWN[i].busk:sp[3]==='sit'?TOWN[i].sit:TOWN[i].n[0]&&!TOWN[i].busk&&TOWN[i].ax===undefined)&&!chars.some(q=>q.kind==='town'&&q.town===i));
    if(!pool.length)return;const ch=makeTown(rndp(pool));ch.idle=true;ch.spot=sp;ch.x=sp[0];ch.y=sp[1];ch.face=sp[2];ch.row=1;ch.life=rnd(30,70);ch.spT=rnd(3,8);chars.push(ch);
  }
  /* drones cross above the street at the depth of some point on the road, and can be hovered like anyone else */
  function spawnBot(){
    const b=Math.floor(Math.random()*DRN.length),ch=makeChar('drone',false),p=A.bot();ch.kind='bot';ch.bot=b;ch.idle=false;
    ch.y=p.y;ch.alt=p.alt;const s=tall(ch.y)/TREF;ch.vx=(Math.random()<.5?1:-1)*rnd(16,30)*s;ch.x=ch.vx>0?-ox-40:-ox+W+40;ch.face=Math.sign(ch.vx);
    chars.push(ch);
  }

  function updChars(dt){
    const n=k=>chars.filter(q=>q.kind===k&&!q.idle).length;
    spawnT-=dt;if(spawnT<=0&&n('code')<(A.side?7:9)){spawn(false);spawnT=rnd(1.5,4)}
    townT-=dt;if(townT<=0&&n('town')<4){spawnTown(false);townT=rnd(2.5,6)}
    botT-=dt;if(botT<=0&&n('bot')<2&&A.bot){spawnBot();botT=rnd(8,20)}
    for(const ch of chars){
      if(ch.kind==='bot'){ch.ph+=dt*8;ch.x+=ch.vx*dt;ch.alt+=Math.sin(ch.ph*.4)*dt*2;if((ch.vx<0&&ch.x+ox<-60)||(ch.vx>0&&ch.x+ox>W+60))ch.dead=true;continue}
      if(ch.kind==='town'&&ch.idle){ch.ph+=dt*6;ch.life-=dt;ch.spT-=dt;
        /* now and then an idle townsperson does their special move once (smokes, waves, flexes) */
        const t=TOWN[ch.town];if(ch.row===1&&ch.spT<=0&&t.n[2]){ch.row=2;ch.ph=0}else if(ch.row===2&&ch.ph>=t.n[2]){ch.row=1;ch.ph=0;ch.spT=rnd(4,10)}
        if(ch.life<=0)ch.dead=true;continue}
      ch.ph+=dt*(ch.idle?0:ch.kind==='town'?ch.sp/2.4:ch.sp/7);
      if(ch.idle){ch.life-=dt;if(ch.life<=0)ch.dead=true;continue}
      const k=Math.max(.15,tall(ch.y||200)/50);
      ch.d+=(ch.toward?1:-1)*ch.sp*dt*k;
      const at=polyAt(ch.pts,clamp(ch.d,0,ch.len));ch.x=at[0];ch.y=at[1];
      ch.dir=PATHS[ch.path].flat?((at[2]>0)===ch.toward?'r':'l'):(ch.toward?'f':'b');
      if(ch.kind==='town'){ch.face=(at[2]>0)===ch.toward?1:-1;
        let a=1;
        if(A.depth&&ch.path!=='X'){const s=tall(ch.y)/TREF;a=clamp((s-TMIN)/.08,0,1);if(!ch.toward&&s<TMIN)ch.dead=true}
        if(ch.fade!==undefined){ch.fade=Math.min(1,ch.fade+dt*2.5);a=Math.min(a,ch.fade)}
        if(ch.exitD!==undefined&&(ch.toward?ch.d>=ch.exitD:ch.d<=ch.exitD)){ch.out=(ch.out===undefined?1:ch.out)-dt*2.5;a=Math.min(a,Math.max(0,ch.out));if(ch.out<=0)ch.dead=true}
        ch.alpha=a;if(ch.d>ch.len||ch.d<0)ch.dead=true}
      else if(ch.d>ch.len||ch.d<0||tall(ch.y)<4)ch.dead=true;
      /* walking off the visible part of the back street counts as leaving */
      if(A.side&&((ch.toward&&ch.x+ox>W+60)||(!ch.toward&&ch.x+ox<-60)))ch.dead=true;
    }
    if(chars.filter(q=>q.idle&&q.kind==='code').length<2&&Math.random()<dt*.2){const free=A.spots.filter(s=>!chars.some(q=>q.spot===s));if(free.length)spawnIdle(rndp(free))}
    if(chars.filter(q=>q.idle&&q.kind==='town').length<3&&Math.random()<dt*.15){const free=A.tspots.filter(s=>!chars.some(q=>q.spot===s));if(free.length)spawnTownIdle(rndp(free))}
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
    if(kind==='crow'){p.fly=true;p.y=A.crowY();p.vx=(Math.random()<.5?1:-1)*rnd(30,50);p.x=p.vx>0?-ox-20:-ox+W+20;p.face=Math.sign(p.vx)}
    else if(kind==='pigeon'){const q=A.pigeons;p.home=[rnd(q[0],q[1]),rnd(q[2],q[3])];p.x=p.home[0]+rnd(-10,10);p.y=p.home[1];p.row=1;p.t=rnd(1,3);p.life=rnd(40,80);p.face=Math.random()<.5?1:-1}
    else{const pk=A.side?'S':Math.random()<.75?'R':'L';onPath(p,pk,kind.startsWith('rat')?rnd(0,.08):rnd(.5,.95));const lo=dMin(p);p.toward=Math.random()<.5;
      p.d=initial?rnd(lo,p.len):(p.toward?lo:p.len);if(!initial&&A.side)p.d=edgeD(p);p.sp=kind.startsWith('rat')?rnd(40,55):kind.startsWith('cat')?rnd(14,20):rnd(18,26);p.t=rnd(3,8)}
    pets.push(p);
  }
  function updPets(dt){
    const night=dayK<.5||A.dark;petT-=dt;
    if(petT<=0){petT=rnd(4,12);
      const pool=(A.petPool||['dog','dog2','cat','cat2','crow',night?'rat':'pigeon',night?'rat2':'pigeon']).filter(k=>pets.filter(p=>p.kind===k).length<(k==='pigeon'?4:1));
      if(pool.length)spawnPet(rndp(pool))}
    for(const p of pets){
      p.ph+=dt*(p.row===1?5:8);
      if(p.fly){p.x+=p.vx*dt;if((p.vx<0&&p.x+ox<-30)||(p.vx>0&&p.x+ox>W+30))p.dead=true;continue}
      if(p.kind==='pigeon'){
        /* pecking about: stand, take a few steps, stand again; they leave when the light goes or the monster comes */
        p.t-=dt;p.life-=dt;if(p.t<=0){p.row=p.row?0:1;p.t=p.row?rnd(1.5,4):rnd(.4,1);if(!p.row)p.face=p.x>p.home[0]+8?-1:p.x<p.home[0]-8?1:(Math.random()<.5?1:-1)}
        if(!p.row)p.x+=p.face*10*dt;if(p.life<=0||night||MON.on)p.dead=true;continue}
      /* dogs and cats stop to sniff now and then; rats never stop */
      p.t-=dt;if(p.t<=0&&!p.kind.startsWith('rat')){p.row=p.row?0:1;p.t=p.row?rnd(1.5,3):rnd(4,9)}
      if(!p.row){const k=Math.max(.15,tall(p.y||200)/50);p.d+=(p.toward?1:-1)*p.sp*dt*k}
      const at=polyAt(p.pts,clamp(p.d,0,p.len));p.x=at[0];p.y=at[1];if(!p.row)p.face=(at[2]>0)===p.toward?1:-1;
      const s=tall(p.y)/TREF;p.alpha=A.depth?clamp((s-TMIN)/.08,0,1):1;
      if(p.d>p.len||p.d<0||(A.depth&&!p.toward&&s<TMIN)||(p.kind.startsWith('rat')&&!night))p.dead=true;
      if(A.side&&((p.toward&&p.x+ox>W+40)||(!p.toward&&p.x+ox<-40)))p.dead=true;
    }
    pets=pets.filter(p=>{if(p.dead&&p.bubEl)p.bubEl.remove();return!p.dead});
    for(const p of pets)if(p.bubEl){p.bubL-=dt;if(p.bubL<=0){p.bubEl.remove();p.bubEl=null}}
  }

  /* ---- speech bubbles are page elements, so their text stays sharp and the language filter can translate them ---- */
  function say(ch,txt,dur){if(ch.bubEl)ch.bubEl.remove();const el=document.createElement('div');el.className='pbub';el.textContent=txt;document.body.appendChild(el);ch.bubEl=el;ch.bubL=dur}

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
  let signBB=null;
  const onSign=(px,py)=>signBB&&px>=signBB[0]&&px<=signBB[2]&&py>=signBB[1]&&py<=signBB[3];
  cv.addEventListener('pointerdown',e=>{const px=e.clientX*W/innerWidth,py=e.clientY*H/innerHeight;
    if(onSign(px,py)){turn();return}
    const hit=hitAt(px,py),pet=hit?null:petAt(px,py);if(pet&&!pet.bubEl){say(pet,pet.a.say,1.6);return}
    if(hit){if(termCh===hit){pinned=true;term.classList.add('pin')}else showTerm(hit,true)}else closeTerm()});
  addEventListener('pointermove',e=>{
    if(e.target!==cv)return;const px=e.clientX*W/innerWidth,py=e.clientY*H/innerHeight,hit=hitAt(px,py);cv.style.cursor=hit||petAt(px,py)||onSign(px,py)?'pointer':'default';
    if(pinned)return;if(hit){if(termCh!==hit)showTerm(hit,false)}else if(termCh)closeTerm();
  });
  document.addEventListener('pointerdown',e=>{if(term.hidden||term.contains(e.target)||e.target===cv)return;closeTerm()},true);

  /* ---- neon signs on the crossing flicker now and then: the sign is copied from the all-dark street for a moment ---- */
  const SIGNS=[[0,96,44,20],[572,14,24,100],[328,88,20,50],[518,114,52,18],[500,40,44,38],[96,84,48,46],[140,84,12,40]];
  let flick=[],flickT=2;
  function updFlick(dt){if(A.type!=='cross')return;flickT-=dt;if(flickT<=0){flickT=rnd(.8,3.5);flick.push({r:rndp(SIGNS),t:rnd(.06,.35),n:Math.random()<.4?2:1})}
    flick.forEach(f=>f.t-=dt);for(let i=flick.length-1;i>=0;i--)if(flick[i].t<=0){if(--flick[i].n>0)flick[i].t=rnd(.05,.15);else flick.splice(i,1)}}

  /* ---- rain: one-pixel streaks and splashes, at night ---- */
  let rain=[],spl=[];
  function updRain(dt){for(const r of rain){r.y+=r.v*dt;if(!A.dark)r.x-=r.v*dt*.18;const gy=r.y>HOR+4&&Math.random()<dt*4;if(r.y>SH||gy){if(r.y>HOR)spl.push({x:r.x|0,y:r.y|0,t:.18});r.y=A.dark?rnd(20,60):-oy-rnd(0,40);r.x=Math.random()*(SW+60)}}
    spl.forEach(s=>s.t-=dt);for(let i=spl.length-1;i>=0;i--)if(spl[i].t<=0)spl.splice(i,1)}

  /* ---- the tower and the monster ----
     Cthulhu (cthulhu.png, 192x112 frames, facing right) flies in, hovers beside the tower and strikes it four times with
     its beam and its tentacles; the fourth blow brings the tower down, it roars and flies off, and the tower is rebuilt later */
  const CT={fw:192,fh:112,n:[15,12,6,7,9,5,11]},IDLE=0,FLY=2,BEAM=3,LASH=4;
  const MON={on:false,phase:'',t:0,x:0,y:0,face:1,row:FLY,ph:0,hits:0,next:rnd(120,220)};
  const TW={state:'up',fall:0,t:0,cv:null};
  let fx=[],dust=[];
  const SCREAM=['RUN!','Monster!!','逃げて!','Беги!','괴물이다!','Not again…','¡Corre!','The tower!','怪獣だ!'];
  /* the monster is drawn at twice its pixel size where there is room for it, at 1:1 on narrow or short views */
  const ms=()=>W<400||A.msMax===1||(A.type==='back'&&oy<90)?1:2;
  const hitY=T=>{const t=T.top();return t+(T.base-t)*T.hit};
  function towerArt(){const T=A.tower,pl=A.pal;return TW.cv||(TW.cv={n:buildTower(T.h,T.w,alleyNo*97+13,pl[0],pl[1],false),d:buildTower(T.h,T.w,alleyNo*97+13,pl[0],pl[1],true)})}
  function boom(x,y,big){fx.push({im:big?'expl-b':'expl-a',fw:big?64:32,n:8,x,y,t:0})}
  /* sewer water thrown up by the monster: falling cyan pixels */
  function splash(x){dust.push({x,y:SH-30,vx:rnd(-20,20),vy:rnd(-60,-25),t:0,l:rnd(.6,1.1),wet:true})}
  function startMon(){
    if(MON.on||TW.state!=='up'||wipe)return false;
    if(!A.tower){
      /* down in the sewer it rises out of the water channel in front of the walkway */
      MON.on=true;MON.mode='rise';MON.phase='rise';MON.t=0;MON.hits=0;MON.row=IDLE;MON.ph=0;MON.face=Math.random()<.5?1:-1;
      MON.x=-ox+W/2+rnd(-60,60);MON.hy=SH-58;MON.y=SH+70;shake=3;return true}
    MON.mode='tower';const T=A.tower,side=A.monSide,s=ms();MON.on=true;MON.phase='in';MON.t=0;MON.hits=0;MON.row=FLY;MON.ph=0;MON.side=side;MON.face=-side;
    MON.hx=T.x+side*88*s;MON.hy=hitY(T)-8*s;MON.x0=MON.hx+side*(W*.6+110*s);MON.x=MON.x0;MON.y=MON.hy-30;
    if(dayK<.5)flash=1;return true;
  }
  function updMon(dt){
    MON.next-=dt;if(!MON.on&&MON.next<=0&&TW.state==='up'&&!wipe){startMon();MON.next=rnd(180,300)}
    TW.t+=dt;
    if(TW.state==='falling'){TW.fall=Math.min(1,TW.fall+dt/2.4);
      if(Math.random()<dt*9){const T=A.tower,top=T.top()+TW.fall*T.h;boom(T.x+rnd(-T.w/2,T.w/2),rnd(top,T.base-4),Math.random()<.4)}
      if(Math.random()<dt*30){const T=A.tower;dust.push({x:T.x+rnd(-T.w,T.w),y:T.base-rnd(2,30),vx:rnd(-8,8),vy:rnd(-10,-3),t:0,l:rnd(1,2.2)})}
      if(TW.fall>=1){TW.state='down';TW.t=0}}
    else if(TW.state==='down'&&!MON.on&&TW.t>18){TW.state='rising';TW.t=0}
    else if(TW.state==='rising'){TW.fall=Math.max(0,TW.fall-dt/5);if(!TW.fall)TW.state='up'}
    fx.forEach(f=>f.t+=dt);fx=fx.filter(f=>f.t*14<f.n);
    dust.forEach(d=>{d.t+=dt;d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.wet)d.vy+=140*dt});dust=dust.filter(d=>d.t<d.l);
    shake=Math.max(0,shake-dt*12);flash=Math.max(0,flash-dt*2.5);
    if(!MON.on)return;
    MON.t+=dt;MON.ph+=dt*11;const s=ms();
    if(MON.mode==='rise'){
      if(MON.phase==='rise'){const k=Math.min(1,MON.t/2.2);MON.y=SH+70+(MON.hy-SH-70)*(1-Math.pow(1-k,3));if(Math.random()<dt*20)splash(MON.x+rnd(-40,40));if(k>=1){MON.phase='lash';MON.ph=0;MON.row=LASH;MON.hit=false}}
      else if(MON.phase==='lash'){if(!MON.hit&&MON.ph>=4){MON.hit=true;MON.hits++;shake=6;for(let i=0;i<8;i++)splash(MON.x+MON.face*rnd(40,110));const vis=chars.filter(q=>tall(q.y)>=16);if(vis.length)say(rndp(vis),rndp(SCREAM),1.8)}
        if(MON.ph>=CT.n[LASH]){MON.phase=MON.hits>=3?'roar':'rest';MON.t=0;MON.row=IDLE;MON.ph=0}}
      else if(MON.phase==='rest'){if(MON.t>.5){MON.phase='lash';MON.row=LASH;MON.ph=0;MON.hit=false;MON.face=-MON.face}}
      else if(MON.phase==='roar'){if(MON.t>1.8){MON.phase='sink';MON.t=0}}
      else if(MON.phase==='sink'){const k=Math.min(1,MON.t/2);MON.y=MON.hy+(SH+70-MON.hy)*k*k;if(Math.random()<dt*12)splash(MON.x+rnd(-40,40));if(k>=1)MON.on=false}
      return}
    if(MON.phase==='in'){const k=Math.min(1,MON.t/3.2),e=1-Math.pow(1-k,3);MON.x=MON.x0+(MON.hx-MON.x0)*e;MON.y=MON.hy-30*(1-e)+Math.sin(MON.t*3)*2;
      if(k>=1){MON.phase='atk';MON.row=BEAM;MON.ph=0;MON.hit=false}}
    else if(MON.phase==='atk'){
      const n=CT.n[MON.row];
      if(!MON.hit&&MON.ph>=(MON.row===BEAM?3:4)){MON.hit=true;MON.hits++;shake=5;const T=A.tower;boom(T.x+rnd(-5,5),hitY(T)+rnd(-8,8),true);
        const vis=chars.filter(q=>q.kind!=='bot'&&tall(q.y)>=16);if(vis.length)say(rndp(vis),rndp(SCREAM),1.8);
        if(MON.hits>=4){TW.state='falling';TW.t=0;shake=9}}
      if(MON.ph>=n){if(MON.hits>=4){MON.phase='roar';MON.t=0;MON.row=IDLE;MON.ph=0}else{MON.phase='rest';MON.t=0;MON.row=IDLE;MON.ph=0}}}
    else if(MON.phase==='rest'){if(MON.t>.45){MON.phase='atk';MON.row=MON.hits%2?LASH:BEAM;MON.ph=0;MON.hit=false}}
    else if(MON.phase==='roar'){MON.y=MON.hy+Math.sin(MON.t*3)*2;if(MON.t>2.6){MON.phase='out';MON.t=0;MON.row=FLY;MON.face=MON.side}}
    else if(MON.phase==='out'){const k=Math.min(1,MON.t/3);MON.x=MON.hx+MON.side*(W*.7+120*s)*k*k;MON.y=MON.hy-40*k;if(k>=1){MON.on=false;TW.t=0}}
    if(MON.phase!=='in'&&MON.phase!=='out'&&MON.phase!=='roar')MON.y=MON.hy+Math.sin(MON.t*2.4)*1.5;
  }

  /* ---- alleys: the street changes as you turn into the next one, like the 3D alley's side turns ---- */
  let wipe=null,turnT=rnd(150,240),lastHue=0;
  function useAlley(a){
    A=a;SW=a.SW;SH=a.SH;HOR=a.HOR;VP=a.VP;PATHS=a.paths;tall=a.tall;A.pal=rndp(NEONP);if(alleyNo===1)A.pal=NEONP[0];size();
    for(const q of chars)if(q.bubEl)q.bubEl.remove();for(const p of pets)if(p.bubEl)p.bubEl.remove();
    chars=[];pets=[];fx=[];dust=[];flick=[];SIDE=[];SKY=[];closeTerm();
    MON.on=false;TW.state='up';TW.fall=0;TW.cv=null;
    CARS=a.type==='cross'?[
      {n:'red',dir:'toward',x:267,y:183,w:76,h:56,base:43,s:1,st:'rest',t:rnd(3,8),k:0},
      {n:'taxi',dir:'away',x:175,y:173,w:37,h:37,base:33,s:1,st:'rest',t:rnd(6,12),k:0},
      {n:'far',x:238,y:165,w:29,h:25,base:22,s:1,st:'idle',t:0,k:0}]:[];
    rain=Array.from({length:a.dark?14:a.side?90:70},()=>({x:Math.random()*SW,y:rnd(-oy,SH),v:a.dark?rnd(110,150):rnd(150,230)}));spl=[];
    for(let i=0;i<(a.side?6:7);i++)spawn(true);
    for(let i=0;i<3;i++)spawnTown(true);
    a.spots.slice(0,2).forEach(spawnIdle);a.tspots.slice(0,2).forEach(spawnTownIdle);
    for(let i=0;i<2;i++)spawnPet(rndp(a.petPool||['dog','cat','cat2','dog2']),true);
    turnT=rnd(150,240);
  }
  function nextAlley(){
    alleyNo++;let hue;do{hue=rndp([0,40,95,150,200,255,310])}while(hue===lastHue);lastHue=hue;
    useAlley(MAKE[ORDER[(alleyNo-1)%ORDER.length]](hue));
    const t=document.querySelector('.toast');if(t){t.textContent='ALLEY '+String(alleyNo).padStart(2,'0')+' · 路地 · '+['زقاق','골목','переулок','σοκάκι','गली'][alleyNo%5];t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
  }
  function turn(){if(wipe||MON.on)return;wipe={t:0,sw:false}}

  /* ---- drawing ---- */
  /* a layer repeated across the view with parallax; sky layers stretch their top row up to the top of the screen */
  function tile(im,y,par,alpha,flat){
    if(!im)return;const w=im.naturalWidth||im.width;if(!w||alpha<=0)return;c.globalAlpha=alpha;
    const x0=(((ox*par)%w)+w)%w-w;
    if(y+oy>0&&!flat)for(let x=x0;x<W;x+=w)c.drawImage(im,0,0,w,1,x,0,w,y+oy);
    for(let x=x0;x<W;x+=w)c.drawImage(im,x,y+oy);
    c.globalAlpha=1;
  }
  function drawTower(dk){
    if(!A.tower)return;
    const T=A.tower,art=towerArt(),top=T.top(),x=Math.round(T.x+ox-art.n.width/2),dy=Math.round(TW.fall*T.h);
    c.save();c.beginPath();c.rect(0,0,W,T.base+oy);c.clip();
    if(dk<1)c.drawImage(art.n,x,top+oy+dy);if(dk>0){c.globalAlpha=dk;c.drawImage(art.d,x,top+oy+dy);c.globalAlpha=1}
    c.restore();
    if(TW.state==='up'){
      /* antenna light and the alley's hologram: a spinning diamond of neon pixels */
      const t=performance.now()/1000,cx=T.x+ox,cy=top+oy-9,pl=A.pal;
      if(Math.floor(t*1.5)%2){c.fillStyle='#ff3a3a';c.fillRect(Math.round(cx),top+oy,1,1)}
      const r=6,a=t*1.6,P=[[0,-1.3,0],[0,1.3,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].map(v=>[cx+(v[0]*Math.cos(a)+v[2]*Math.sin(a))*r,cy+v[1]*r]);
      c.globalAlpha=.85;
      for(const[i,j,col]of[[0,2,0],[0,3,0],[0,4,1],[0,5,1],[1,2,1],[1,3,1],[1,4,0],[1,5,0],[2,4,0],[4,3,1],[3,5,0],[5,2,1]]){
        c.fillStyle=pl[col];const p=P[i],q=P[j],n=Math.ceil(Math.max(Math.abs(q[0]-p[0]),Math.abs(q[1]-p[1])));
        for(let k=0;k<=n;k++)c.fillRect(Math.round(p[0]+(q[0]-p[0])*k/n),Math.round(p[1]+(q[1]-p[1])*k/n),1,1)}
      c.globalAlpha=1}
  }
  function drawMonster(){
    for(const d of dust){c.fillStyle=d.wet?(d.t/d.l<.5?'#7fd6ff':'#3a7ab0'):d.t/d.l<.5?'#8a8098':'#5a5068';const k=1+Math.floor(d.t*2);c.fillRect(Math.round(d.x+ox),Math.round(d.y+oy),k,k)}
    if(MON.on){const ct=img('cthulhu');if(ct.naturalWidth){const n=CT.n[MON.row],f=MON.phase==='atk'?Math.min(n-1,Math.floor(MON.ph)):Math.floor(MON.ph)%n;
      blit(ct,f*CT.fw,MON.row*CT.fh,CT.fw,CT.fh,96,56,MON.x+ox,MON.y+oy,ms(),MON.face)}}
    for(const f of fx){const im=img(f.im);if(im.naturalWidth)c.drawImage(im,Math.min(f.n-1,Math.floor(f.t*14))*f.fw,0,f.fw,f.fw,Math.round(f.x+ox-f.fw/2),Math.round(f.y+oy-f.fw/2),f.fw,f.fw)}
  }
  /* the back street's wall and pavement, composed once the tiles have loaded */
  function backArt(){
    if(A.art)return A.art;const ts=img('sof-tiles');if(!ts.naturalWidth)return null;
    const wall=document.createElement('canvas');wall.width=SW;wall.height=96;const w=wall.getContext('2d');
    for(const[k,x]of A.layout){const p=WALL[k];w.drawImage(ts,p[0],p[1],p[2],96,x,0,p[2],96)}
    const gr=document.createElement('canvas');gr.width=SW;gr.height=144;const q=gr.getContext('2d');
    for(let x=0;x<SW;){if(Math.random()<.15){q.drawImage(ts,0,224,32,144,x,0,32,144);x+=32}else{q.drawImage(ts,48,224,112,144,x,0,112,144);x+=112}}
    if(A.hue)for(const cv2 of[wall]){const x2=cv2.getContext('2d'),d=x2.getImageData(0,0,cv2.width,cv2.height);hueShift(d.data,A.hue);x2.putImageData(d,0,0)}
    return A.art={wall,gr};
  }
  /* the roof deck: a railing along the far edge, concrete slabs, and the alley's air conditioners, tanks, masts,
     light strings and a neon sign standing on it */
  function roofArt(){
    if(A.deck)return A.deck;const cv2=document.createElement('canvas');cv2.width=SW;cv2.height=80;const x=cv2.getContext('2d'),pl=A.pal;
    const R=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
    R(0,2,SW,1,'#5a5478');R(0,7,SW,1,'#3e3858');for(let i=0;i<SW;i+=16)R(i,2,1,12,'#4a4466');
    R(0,14,SW,66,'#2a2340');R(0,14,SW,1,'#433b5e');
    for(let i=0;i<SW;i+=32)R(i,15,1,59,'#211b33');R(0,30,SW,1,'#241e37');R(0,46,SW,1,'#211b33');R(0,62,SW,1,'#211b33');R(0,74,SW,6,'#1c1730');
    for(let i=0;i<80;i++)R(Math.random()*SW|0,16+Math.random()*56|0,rnd(2,6)|0,1,'#32294a');
    let prev=null;
    for(const p of A.props){const b=16,X=p.x;
      if(p.k==='ac'){R(X,b-13,20,13,'#3b3552');R(X,b-13,20,1,'#5a5478');R(X+12,b-10,6,6,'#221c33');R(X+14,b-8,2,2,'#4a4466');for(let i=0;i<4;i++)R(X+2,b-11+i*3,8,1,'#2a2440')}
      else if(p.k==='vent'){R(X,b-16,4,16,'#4a4466');R(X-1,b-18,6,2,'#5a5478')}
      else if(p.k==='tank'){R(X+2,b-6,2,6,'#3e3858');R(X+20,b-6,2,6,'#3e3858');R(X,b-34,24,28,'#4a3a32');R(X,b-34,24,2,'#6a5444');for(let i=0;i<3;i++)R(X,b-28+i*8,24,1,'#3a2c26');R(X,b-34,1,28,'#6a5444')}
      else if(p.k==='mast'){R(X,b-44,1,44,'#5a5478');R(X-3,b-36,7,1,'#5a5478');R(X-2,b-28,5,1,'#5a5478');R(X,b-45,1,1,'#ff3a3a')}
      else if(p.k==='pole'){R(X,b-30,1,30,'#4a4466');
        if(prev!==null&&X-prev<110)for(let i=0;i<=X-prev;i+=2){const t=i/(X-prev),yy=b-30+Math.round(Math.sin(t*Math.PI)*8);R(prev+i,yy,1,1,'#2a2440');if(i%6===0)R(prev+i,yy+1,1,1,pl[(i/6)%2|0])}
        prev=X}
      else if(p.k==='sign'){R(X,b-6,1,6,'#3e3858');R(X+27,b-6,1,6,'#3e3858');R(X,b-24,28,18,'#140a22');
        x.strokeStyle=pl[0];x.lineWidth=1;x.strokeRect(X+.5,b-23.5,27,17);R(X+8,b-19,12,1,pl[1]);R(X+6,b-15,16,1,pl[1]);R(X+10,b-11,8,1,pl[1])}
    }
    return A.deck=cv2;
  }
  function drawSign(){
    const[sx,sy]=A.sign,x=Math.round(sx+ox),y=Math.round(sy+oy),on=Math.floor(performance.now()/600)%4!==0;
    c.fillStyle='#140a22';c.fillRect(x,y,29,11);c.fillStyle=on?'#ffb347':'#7a5020';c.fillRect(x,y,29,1);c.fillRect(x,y+10,29,1);c.fillRect(x,y,1,11);c.fillRect(x+28,y,1,11);
    let gx=x+3;for(const ch of'ALLEY>'){const gl=GLY[ch];for(let i=0;i<15;i++)if(gl[i]==='1')c.fillRect(gx+i%3,y+3+Math.floor(i/3),1,1);gx+=4}
    if(on){c.fillStyle='rgba(255,46,136,.5)';c.fillRect(x+1,y+11,27,1)}
    signBB=[x-2,y-2,x+31,y+13];
  }
  function frame(){
    smx+=(mx-smx)*.04;
    const spare=Math.max(0,SW-W);ox=W>=SW?Math.round((W-SW)/2):Math.round(clamp(-spare/2-smx*A.panMax()*2,-spare,0));oy=H-SH-pad();
    const sk=shake>0?Math.round((Math.random()-.5)*shake):0;ox+=sk;
    const dk=dayK,n=1-dk;
    c.fillStyle=A.dark?'#0c0a08':dk>.5?'#e8c9a0':'#1a1126';c.fillRect(0,0,W,H);
    const items=[];
    if(A.type==='cross'){
      /* sky and far city: night clouds and neon towers, or the dusk sky and orange city by day */
      tile(img('sky-back'),0,.25,n);tile(img('sky-city'),HOR+4-192,.45,n);
      tile(img('sky-dusk'),0,.25,dk);tile(img('city-dusk'),0,.45,dk);
      drawTower(dk);drawMonster();
      /* the street itself, its night palette fading in over the day one */
      const st=pic('street'),stn=pic('street-n');
      if(st&&stn){if(dk>0)c.drawImage(st,ox,oy);if(n>0){c.globalAlpha=n;c.drawImage(stn,ox,oy)}c.globalAlpha=1}
      const off=pic('street-off');
      if(off)for(const f of flick){const r=f.r;c.drawImage(off,r[0],r[1],r[2],r[3],r[0]+ox,r[1]+oy,r[2],r[3])}
      for(const car of CARS){if(car.st==='gone')continue;const b=carBox(car);items.push({y:VP[1]+(car.y+car.base-VP[1])*car.s,draw:()=>{
        const sx=Math.round(b[0])+ox,sy=Math.round(b[1])+oy,sw=Math.max(1,Math.round(b[2])),sh=Math.max(1,Math.round(b[3]));
        const a=img('car-'+car.n),an=img('car-'+car.n+'-n');if(dk>0&&a.naturalWidth)c.drawImage(a,sx,sy,sw,sh);if(n>0&&an.naturalWidth){c.globalAlpha=n;c.drawImage(an,sx,sy,sw,sh);c.globalAlpha=1}}})}
      items.push({y:223.5,draw:()=>{const p=pic('props'),pn=pic('props-n');if(dk>0&&p)c.drawImage(p,ox,oy);if(n>0&&pn){c.globalAlpha=n;c.drawImage(pn,ox,oy);c.globalAlpha=1}}});
    }else if(A.type==='back'){
      /* the back street is a wider shot (fitH 400) so the tower and the monster have sky above the wall */
      tile(img('sky-back'),-oy,.25,n);tile(img('sky-city'),-150,.4,n);tile(noBlack('sof-back'),-80,.6,n,true);
      tile(img('sky-dusk'),-oy,.25,dk);tile(img('city-dusk'),-232,.45,dk);
      drawTower(dk);drawMonster();
      const art=backArt();if(art){c.drawImage(art.wall,ox,oy);c.drawImage(art.gr,ox,oy+96)}
      const fore=img('sof-fore');
      for(const x of A.lamps)items.push({y:164,draw:()=>{if(fore.naturalWidth)c.drawImage(fore,16,0,42,144,Math.round(x+ox-34),oy+164-144,42,144)}});
      for(const x of A.bushes)items.push({y:300,draw:()=>{if(fore.naturalWidth)c.drawImage(fore,94,76,61,68,Math.round(x+ox-30),oy+SH-60,61,68)}});
      for(const p of A.props)items.push({y:p.y,draw:()=>{const im=img(p.n);if(im.naturalWidth)c.drawImage(im,Math.round(p.x+ox),Math.round(p.y+oy-im.naturalHeight))}});
      const car=img('sof-car');
      for(const q of SIDE)items.push({y:q.y,draw:()=>{const im=car.naturalWidth?recolored(car,q.hue):null;if(im)blit(im,0,0,144,48,72,48,q.x+ox,q.y+oy,1,q.v>0?1:-1)}});
    }else if(A.type==='resto'){
      /* Restaurant Row: the far city and the orange towers behind the street, or the dusk city by day */
      tile(img('v1-far'),0,.2,n);tile(img('v1-back'),0,.45,n);
      tile(img('sky-dusk'),-oy,.2,dk);tile(img('city-dusk'),-80,.45,dk);
      drawTower(dk);drawMonster();
      tile(pic('v1-fore'),0,1,1,true);
    }else if(A.type==='roof'){
      /* Rooftops: clouds and skyline, the tower, flying traffic, the nearer roofs and then our deck */
      tile(img('sky-back'),4,.12,n);tile(img('sky-city'),4,.3,n);
      tile(img('sky-dusk'),-oy,.12,dk);tile(img('city-dusk'),172-272,.3,dk);
      drawTower(dk);drawMonster();
      for(const q of SKY){const fa=FLYART[q.k],im=img(fa.n);if(im.naturalWidth)blit(im,0,0,im.naturalWidth,im.naturalHeight,im.naturalWidth/2,im.naturalHeight/2,q.x+ox,q.y+oy,1,Math.sign(q.v)*fa.face)}
      tile(img('roof-front'),-8,.55,1,true);
      c.drawImage(roofArt(),ox,oy+160);c.fillStyle='#1c1730';c.fillRect(0,oy+240,W,H);
    }else{
      /* the Sewers: the far tunnel, the chamber and its pipes; the monster and the water channel go in front of the walkway */
      tile(img('sew-back'),0,.5,1,true);
      const m=img('sew-mid'),f=img('sew-front');if(m.naturalWidth)c.drawImage(m,ox,oy);if(f.naturalWidth)c.drawImage(f,ox,oy);
    }
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
    for(const p of pets){if(!anim.naturalWidth)break;items.push({y:p.fly?-999:p.y,draw:()=>{
      const a=p.a,s=p.fly?1:Math.max(1,Math.round(tall(p.y)))/TREF,x=p.x+ox,y=(p.fly?p.y+a.foot:p.y)+oy,n=a.n[p.row];
      c.globalAlpha=p.alpha;blit(anim,(Math.floor(p.ph)%n)*a.fw,(a.r+p.row)*24,a.fw,a.foot,a.fw/2,a.foot,x,y,s,p.face);c.globalAlpha=1;
      p.bb=[x-a.fw/2*s,y-a.foot*s*.8,x+a.fw/2*s,y];bubAt(p,x,y-a.foot*s*.8)}})}
    items.sort((a,b)=>a.y-b.y).forEach(it=>it.draw());
    if(A.type==='sewer'){drawMonster();const wt=img('sew-water');if(wt.naturalWidth){const f=Math.floor(performance.now()/160)%4;for(let x=((ox%64)+64)%64-64;x<W;x+=64)c.drawImage(wt,f*64,0,64,32,x,oy+208,64,32)}c.fillStyle='#0b1430';c.fillRect(0,oy+240,W,H)}
    drawSign();
    /* rain */
    if(dk<.5||A.dark){c.fillStyle='#5ba1b0';for(const r of rain){const x=Math.round(r.x)+ox,y=Math.round(r.y)+oy;c.fillRect(x,y,1,3);c.fillRect(x-1,y+3,1,1)}
      c.fillStyle='#7fb4ec';for(const s of spl){c.fillRect(s.x+ox-1,s.y+oy,1,1);c.fillRect(s.x+ox+1,s.y+oy,1,1)}}
    if(flash>0){c.fillStyle='rgba(220,235,255,'+(flash*.55)+')';c.fillRect(0,0,W,H)}
    /* turning into the next alley: the screen fills with dark blocks, then clears on the new street */
    if(wipe){const f=wipe.t<.55?wipe.t/.55:1-(wipe.t-.55)/.55,B=8,cols=Math.ceil(W/B),rows=Math.ceil(H/B);c.fillStyle='#0a0612';
      for(let i=0;i<cols*rows;i++){const r=Math.sin(i*12.9898)*43758.5453;if(r-Math.floor(r)<f)c.fillRect((i%cols)*B,Math.floor(i/cols)*B,B,B)}}
  }

  /* ---- buttons: Day as in the 3D alley; Monster sends Cthulhu after the tower (30 second cooldown) ---- */
  const dbtn=document.getElementById('day');
  if(dbtn){const sync=()=>{dbtn.textContent=dayOn?'☾ NIGHT':'☀ DAY';dbtn.setAttribute('aria-pressed',dayOn?'true':'false');document.documentElement.classList.toggle('day',dayOn)};
    dbtn.addEventListener('click',()=>{dayOn=!dayOn;try{localStorage.setItem('jowo.day',dayOn?'1':'0')}catch(e){}sync();o.setBeach(dayOn);if(reduce){dayK=dayOn?1:0;frame()}});sync()}
  const mbtn=document.getElementById('mon');let cdEnd=0;
  if(mbtn){mbtn.title='Send Cthulhu after the tower (30 second cooldown)';
    const msync=()=>{const left=Math.ceil((cdEnd-performance.now())/1000);mbtn.disabled=reduce||left>0||MON.on;mbtn.textContent=MON.on?'☄ INCOMING…':left>0?'☄ WAIT '+left+'s':'☄ MONSTER'};
    mbtn.addEventListener('click',()=>{if(MON.on||performance.now()<cdEnd)return;if(startMon())cdEnd=performance.now()+30000;msync()});
    setInterval(msync,250);msync()}

  useAlley(makeCross(0));
  if(/[?&]debug/.test(location.search))g.__street={chars:()=>chars,pets:()=>pets,cars:()=>CARS,day:v=>{dayOn=v},say:(i,t)=>say(chars[i],t,3),mon:startMon,monState:()=>({on:MON.on,phase:MON.phase,hits:MON.hits,tower:TW.state}),turn,alley:()=>({no:alleyNo,type:A.type,hue:A.hue}),go:k=>{alleyNo++;useAlley(MAKE[k](0))}};
  let last=0;
  function loop(t){
    const dt=Math.min((t-last)/1000||0,.05);last=t;
    try{dayK=clamp(dayK+(dayOn?1:-1)*dt/1.3,0,1);DAYST.on=dayOn;DAYST.k=dayK;
      if(wipe){wipe.t+=dt;if(!wipe.sw&&wipe.t>=.55){wipe.sw=true;nextAlley()}if(wipe.t>=1.1)wipe=null}
      if(!MON.on&&!pinned&&!wipe){turnT-=dt;if(turnT<=0)turn()}
      updCars(dt);updChars(dt);updPets(dt);updFlick(dt);updMon(dt);if(dayK<.5||A.dark)updRain(dt);frame();updTerm(dt)}catch(err){console.error('street frame error',err)}
    requestAnimationFrame(loop);
  }
  if(reduce){const once=()=>{updChars(0);frame()};addEventListener('load',once);addEventListener('resize',once);setTimeout(once,300)}else requestAnimationFrame(loop);
}
/* the club page (club.js) borrows the people drawing and sprite tables */
g.PixelStreet={start,lib:{look,render,TOWN,TFR,TAX,TREF,WLIST,FEMOK,NEONS,recolored,hueShift}};
})(window);

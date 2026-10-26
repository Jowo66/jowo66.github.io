/* Pixel nightclub (nightclub.html?pixel): Casa Sofia redrawn as pixel art, in four venues you can cycle through.
   It takes over the club page's canvas but keeps the page's music, beat clock and buttons: Battle, Style and Hype work here too.
   People are the street's people (street.js lends its drawing code); the moshpit is Ansimuz's Brawler Girl and Enemy Punk.
   Everything is drawn on a 480x270 canvas and doubled with hard edges; speech bubbles go on the full-size canvas so text stays sharp. */
(function(g){
'use strict';
const L=g.PixelStreet&&g.PixelStreet.lib;
const IMG={},img=n=>IMG[n]||(IMG[n]=Object.assign(new Image(),{src:'assets/pixel/'+n+'.png'}));
const rnd=(a,b)=>a+Math.random()*(b-a),rndp=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const VW=480,VH=270,NEON=['#ff2e88','#19e3ff','#ffb347','#3dff9a','#7c5cff','#ffd42a'];
const VENUES=[{id:'main',name:'Main room'},{id:'tower',name:'Cross-section'},{id:'sewer',name:'Sewer rave'},{id:'arcade',name:'Arcade'}];
/* brawl.png: 96x64 frames facing as drawn (the girl right, the punk left), feet at (45,63); [row, frames] */
const BR={g:{idle:[0,4],walk:[1,10],punch:[2,3],kick:[3,5],jab:[4,3],hurt:[5,2],jk:[6,3]},p:{idle:[7,4],walk:[8,4],punch:[9,3],hurt:[10,4]}};
const CHEER=['OHHH!','Ayy!','やれ!','¡Dale!','Давай!','Go go!','가자!','Tune!','BASS!','♪♪'];
const CLICKSAY=['Ayy!','Tune!','♪','Big tune','One more!','I love this one','Who is the DJ?','Bass!','踊ろう!','Танцуем!','¡Vamos!'];

/* text in any script, turned into hard-edged pixels for neon signs */
const TXT=new Map();
/* signs drawn before the pixel font arrives would keep the fallback font, so start again once it has loaded */
if(document.fonts&&document.fonts.load)document.fonts.load('12px "NJ UI"').then(()=>TXT.clear(),()=>{});
function pixText(txt,col,px){
  const k=txt+col+px;if(TXT.has(k))return TXT.get(k);
  const c0=document.createElement('canvas'),x=c0.getContext('2d'),f='700 '+px+'px "NJ UI","Zen Kaku Gothic New","Noto Sans",sans-serif';
  x.font=f;const w=Math.ceil(x.measureText(txt).width)+2;c0.width=w;c0.height=px+4;x.font=f;x.textBaseline='top';x.fillStyle=col;x.fillText(txt,1,1);
  const d=x.getImageData(0,0,c0.width,c0.height),a=d.data;for(let i=3;i<a.length;i+=4)a[i]=a[i]>110?255:0;x.putImageData(d,0,0);
  TXT.set(k,c0);return c0;
}

function start(o){
  const out=o.cv,oc=o.ctx,st=o.state;
  const lc=document.createElement('canvas');lc.width=VW;lc.height=VH;const c=lc.getContext('2d');c.imageSmoothingEnabled=false;
  let vi=0;try{vi=+(localStorage.getItem('jowo.club.venue')||0)%VENUES.length}catch(e){}
  let V=null,crowd=[],staff=[],bubbles=[],t=0,flash=0,lastDrop=-1,cab=[],laser=[];

  /* ---- people ---- */
  const DU=g.DUELYST||{},DUC=Object.keys(DU).filter(u=>DU[u].cat==='club'&&!/harmony|dissonance/.test(u));DUC.concat(['boss_harmony','boss_dissonance']).forEach(u=>DU[u]&&img('du-'+u));
  function codePerson(name,opt){const fem=L.FEMOK.has(name)&&Math.random()<.5;return Object.assign({kind:'code',name,fem,look:L.look(name,fem),sw:rnd(.85,1.2),hk:rnd(.9,1.12),cache:new Map()},opt||{})}
  function townPerson(i){return{kind:'town',town:i}}
  function newDancer(f,x,y,from){
    const r=Math.random(),pool=L.TOWN.map((q,i)=>i).filter(i=>!L.TOWN[i].sit&&!crowd.some(d=>d.kind==='town'&&d.town===i));
    /* about a third of the crowd are townspeople, a quarter Duelyst's party-goers (duelyst.js), the rest drawn in code */
    const du=DUC.filter(u=>!crowd.some(d=>d.du===u));
    const p=r<.25&&du.length?{kind:'duel',du:rndp(du)}:r<.55&&pool.length?townPerson(rndp(pool)):codePerson(rndp(L.WLIST.filter(n=>n!=='umbrella')));
    return Object.assign(p,{floor:f,x,y,hx:x,tx:x,face:Math.random()<.5?1:-1,ph:Math.random()*4,alpha:from?0:1,state:from?'enter':'dance',jump:0,vy:0});
  }
  function fighters(f,x,y){return[{kind:'brawl',who:'g',floor:f,x:x-22,y,hx:x-22,tx:x-22,face:1,ph:0,alpha:1,state:'dance',anim:'idle',at:0,jump:0,vy:0,pit:1},
    {kind:'brawl',who:'p',floor:f,x:x+22,y,hx:x+22,tx:x+22,face:-1,ph:0,alpha:1,state:'dance',anim:'idle',at:0,jump:0,vy:0,pit:1}]}

  /* ---- the four venues: floors people dance on, where the door, DJ and moshpit are, and how each room is drawn ---- */
  const MAKE={
    main:()=>({floors:[{x0:110,x1:410,y0:196,y1:258}],door:{x:452,y:226,f:0},dj:{x:240,y:150},pit:{x:250,y:262,f:0},crowdN:34,
      bar:{x0:6,x1:96}}),
    tower:()=>({floors:[{x0:40,x1:330,y0:80,y1:84,chill:1},{x0:60,x1:400,y0:168,y1:176},{x0:50,x1:420,y0:256,y1:264}],door:{x:440,y:174,f:1},dj:{x:230,y:150,small:1},pit:{x:250,y:264,f:2},crowdN:22}),
    sewer:()=>({floors:[{x0:30,x1:450,y0:192,y1:206}],door:{x:14,y:198,f:0},dj:{x:250,y:170,rig:1},pit:{x:330,y:206,f:0},crowdN:20}),
    arcade:()=>({floors:[{x0:250,x1:440,y0:200,y1:256},{x0:20,x1:235,y0:226,y1:236,chill:1}],door:{x:466,y:228,f:0},dj:{x:370,y:160,table:1},pit:{x:330,y:258,f:0},crowdN:16})
  };
  function useVenue(i){
    vi=(i+VENUES.length)%VENUES.length;try{localStorage.setItem('jowo.club.venue',String(vi))}catch(e){}
    V=MAKE[VENUES[vi].id]();V.id=VENUES[vi].id;crowd=[];staff=[];bubbles=[];laser=[];cab=[];
    V.floors.forEach((f,fi)=>{const n=fi===V.pit.f?Math.round(V.crowdN*.6):f.chill?6:Math.round(V.crowdN*.4);for(let k=0;k<n;k++)crowd.push(newDancer(fi,rnd(f.x0,f.x1),rnd(f.y0,f.y1)))});
    crowd.push(...fighters(V.pit.f,V.pit.x,V.pit.y));
    /* the bouncer at the door and, in the main room, a bartender */
    const bnc=codePerson('robocop',{role:'bouncer',floor:V.door.f,x:V.door.x-14,y:V.door.y,face:-1,alpha:1,state:'post',ph:0,hk:1.15});
    bnc.look.top='#0c0c12';bnc.look.bot='#0c0c12';bnc.look.skin=rndp(['#5c3a26','#c68947','#f1bd82']);bnc.look.visor=null;bnc.look.hs='bald';staff.push(bnc);
    if(V.bar)staff.push(codePerson('kimono',{role:'bar',floor:0,x:50,y:190,face:1,alpha:1,state:'post',ph:0}));
    if(V.id==='arcade')for(let k=0;k<6;k++)cab.push({x:18+k*36,y:226,kind:k%2,hue:[0,150,260,40,200,310][k],flash:0});
  }

  /* ---- drawing helpers ---- */
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
  function blit(im,sx,sy,sw,sh,ax,ay,x,y,face,sc){
    sc=sc||1;x=Math.round(x);const dw=Math.round(sw*sc),dh=Math.round(sh*sc),dx=Math.round(x-ax*sc),dy=Math.round(y-ay*sc);
    if(face<0){c.save();c.translate(x*2,0);c.scale(-1,1);c.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);c.restore()}else c.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);
  }
  function codeSprite(p,H,dir,fr){const k=H+'|'+dir+'|'+fr;let sp=p.cache.get(k);if(!sp){sp=L.render(p,H,dir,fr);if(p.cache.size>40)p.cache.clear();p.cache.set(k,sp)}return sp}
  /* the hologram DJ: the street's netrunner, tinted, with scanlines and a glitch colour that changes on drops */
  const DJP=codePerson('walker');Object.assign(DJP.look,{hs:'mohawk',hair:'#eadfbf',top:'#eadfbf',bot:'#9aaecb',visor:'#ff2e88',umb:null});let holo='#19e3ff';const HOLO=new Map();
  function holoSprite(fr,dir){const k=fr+dir+holo;if(HOLO.has(k))return HOLO.get(k);const sp=L.render(DJP,46,dir,fr),cv=document.createElement('canvas');cv.width=sp.cv.width;cv.height=sp.cv.height;const x=cv.getContext('2d');
    x.drawImage(sp.cv,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=.42;x.fillStyle=holo;x.fillRect(0,0,cv.width,cv.height);x.globalAlpha=.35;x.fillStyle='#000';for(let y=0;y<cv.height;y+=3)x.fillRect(0,y,cv.width,1);
    const r={cv,ax:sp.ax,ay:sp.ay};if(HOLO.size>40)HOLO.clear();HOLO.set(k,r);return r}

  /* ---- rooms ---- */
  function lights(b,kk,y0,y1,x0,x1){
    /* coloured cones from the ceiling that sweep with the beat */
    c.save();c.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){const sx=x0+(x1-x0)*(i+.5)/4,a=Math.sin(b*Math.PI/4+i*1.7)*.5,ex=sx+Math.tan(a)*(y1-y0),col=NEON[(i+Math.floor(b/4))%NEON.length];
      c.globalAlpha=.07+.08*kk;c.fillStyle=col;c.beginPath();c.moveTo(sx-2,y0);c.lineTo(sx+2,y0);c.lineTo(ex+26,y1);c.lineTo(ex-26,y1);c.closePath();c.fill()}
    c.restore();c.globalAlpha=1;
  }
  function floorTiles(x0,x1,y0,y1,b,kk){
    const cols=Math.ceil((x1-x0)/24),rows=Math.ceil((y1-y0)/10);
    for(let r=0;r<rows;r++)for(let q=0;q<cols;q++){const on=((q+r+Math.floor(b))%3===0);const col=on?NEON[(q*3+r+Math.floor(b/2))%NEON.length]:'#160d26';
      c.globalAlpha=on?.35+.4*kk:1;R(x0+q*24,y0+r*10,23,9,col)}
    c.globalAlpha=1;
  }
  function speakers(x,y,kk){
    /* the CyberPunk Asset Pack's fan boxes stacked as speakers; the cones push out on every kick */
    const im=img('cpap2');for(let s=0;s<2;s++){const yy=y-s*28;if(im.naturalWidth)c.drawImage(im,134,62,62,28,x-31,yy-28,62,28);
      for(let k=0;k<3;k++){const cx=x-20+k*20,cy=yy-12,r=4+kk*2;c.globalAlpha=.5*kk;c.strokeStyle='#ff2e88';c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();c.globalAlpha=1}}
  }
  function neonSign(txt,x,y,col,px,on){const s=pixText(txt,col,px);c.globalAlpha=on?1:.35;R(x-2,y-2,s.width+3,s.height+2,'#08040f');c.drawImage(s,x,y);c.globalAlpha=1}
  function djBooth(b,kk){
    const d=V.dj,dir=Math.floor(b/2)%4===3?'l':'f',fr=Math.floor(b*2)%4,sp=holoSprite(fr,dir),bob=Math.round(kk*2);
    if(d.rig){/* sewer rig: crates, a scruffy table and a real DJ in a hood */
      const br=img('sof-barrel');if(br.naturalWidth){c.drawImage(br,d.x-80,d.y+8);c.drawImage(br,d.x+20,d.y+8)}
      R(d.x-36,d.y+10,72,6,'#3a2c26');R(d.x-34,d.y+16,2,18,'#2a1f1a');R(d.x+32,d.y+16,2,18,'#2a1f1a');
      const real=codeSprite(DJP,40,'f',fr);c.drawImage(real.cv,d.x-real.ax,d.y+12-real.ay-bob);
      R(d.x-30,d.y+4,60,6,'#141018');R(d.x-24,d.y+5,10,4,'#2a2440');R(d.x+14,d.y+5,10,4,'#2a2440');R(d.x-2,d.y+5,4,3,NEON[Math.floor(b)%6]);return}
    if(d.table){/* arcade: a DJ table built from the street's AC box */
      const rc=img('rcc');c.drawImage(sp.cv,d.x-sp.ax,d.y+2-sp.ay-bob);if(rc.naturalWidth)c.drawImage(rc,34,162,30,24,d.x-30,d.y-6,60,48);R(d.x-30,d.y-8,60,3,NEON[Math.floor(b/2)%6]);return}
    /* the DJ behind a desk with two decks: Duelyst's Harmony in the main room and Dissonance on the cross-section's floor,
       their idle loop timed to the beat and their attack row on every fourth bar; the hologram elsewhere */
    const sc=d.small?.8:1,du=V.id==='main'?'boss_harmony':V.id==='tower'?'boss_dissonance':null,DD=du&&DU[du],dim=DD&&img('du-'+du);
    if(DD&&dim.naturalWidth){const bx=DD.box,big=Math.floor(b/4)%4===3,r=big?DD.atk:DD.idle,fi=big?Math.floor((b%4)/4*r[1]):Math.floor(b*2)%r[1],k=(d.small?40:50)/(bx[3]-bx[1]);
      blit(dim,fi*DD.fw,r[0]*DD.fh,DD.fw,DD.fh,(bx[0]+bx[2])/2,bx[3],d.x,d.y+4-bob,1,k)}
    else{c.globalAlpha=.85+.15*Math.sin(t*20);c.drawImage(sp.cv,d.x-sp.ax,d.y+2-sp.ay-bob);c.globalAlpha=1}
    const w=Math.round(90*sc),h=Math.round(18*sc),x0=d.x-w/2;R(x0,d.y,w,h,'#140a22');R(x0,d.y,w,1,'#ff2e88');
    for(const dx of[-28,28]){const cx=d.x+dx*sc,cy=d.y+5,a=t*6*(dx<0?1:-1);R(cx-7,cy-2,14,6,'#2a2440');R(cx+Math.cos(a)*5,cy+Math.sin(a)*1.5,1,1,'#f3ead8')}
    for(let k=0;k<6;k++)R(d.x-8+k*3,d.y+10,2,2,k<=kk*6?NEON[k%6]:'#2a2440');
  }
  function drawRoom(b,kk){
    const id=V.id;
    if(id==='main'){
      R(0,0,VW,VH,'#120a22');for(let x=0;x<VW;x+=40)R(x,14,1,170,'#1b1030');
      for(const yy of[60,150]){c.globalAlpha=.6+.4*kk;R(0,yy,VW,2,NEON[(Math.floor(b/4)+(yy>100))%NEON.length]);c.globalAlpha=1}
      R(0,0,VW,14,'#0a0614');for(let x=20;x<VW;x+=60){R(x,10,8,6,'#2a2438');R(x+3,16,2,2,NEON[(x/60|0)%6])}
      [['クラブ',150,36,'#ff2e88'],['КЛУБ',300,36,'#ffb347'],['DISCO',20,90,'#3dff9a'],['클럽',418,90,'#19e3ff'],['نادي',150,90,'#19e3ff'],['Ihe Ụtụtụ',290,90,'#ff2e88']].forEach((s,i)=>neonSign(s[0],s[1],s[2],s[3],12,(Math.floor(t*2+i)%9)!==0));
      R(0,186,VW,VH-186,'#0d0718');floorTiles(100,420,190,262,b,kk);
      speakers(130,186,kk);speakers(350,186,kk);djBooth(b,kk);
      /* the bar: shelves of bottles, a counter, and the door with its green exit sign */
      R(0,120,100,4,'#3a2c3a');R(0,150,100,4,'#3a2c3a');for(let x=6;x<96;x+=7){R(x,108,4,12,NEON[(x/7|0)%6]);R(x,138,4,12,NEON[(x/7+3|0)%6])}
      R(448,150,30,78,'#090512');c.strokeStyle='#3dff9a';c.strokeRect(448.5,150.5,29,77);neonSign('EXIT',450,138,'#3dff9a',10,true);
      lights(b,kk,14,262,100,420);
    }else if(id==='tower'){
      /* the club cut open like a doll's house: rooftop bar, the main floor and the basement rave */
      R(0,0,VW,VH,'#05030a');
      const sb=img('sky-back'),sc2=img('sky-city');if(sb.naturalWidth){for(let x=0;x<VW;x+=288)c.drawImage(sb,0,60,288,84,x,0,288,84)}if(sc2.naturalWidth){for(let x=0;x<VW;x+=288)c.drawImage(sc2,0,110,288,70,x,14,288,70)}
      R(30,84,420,6,'#3a3350');R(30,84,420,1,'#5a5478');for(let x=34;x<330;x+=16)R(x,72,1,12,'#4a4466');R(34,72,296,1,'#5a5478');
      R(350,58,90,26,'#2a1f30');R(350,58,90,2,'#ffb347');neonSign('ROOF BAR',356,62,'#ffb347',10,true);
      for(let x=40;x<340;x+=4){const yy=60+Math.round(Math.sin((x-40)/300*Math.PI)*8);R(x,yy,1,1,'#2a2440');if(x%12===0)R(x,yy+1,1,1,NEON[(x/12|0)%6])}
      R(30,90,420,90,'#1a0f2e');R(30,180,420,6,'#2a2340');R(30,186,420,84,'#0a0610');
      for(let y=0;y<VH;y+=6){R(24,y,6,5,'#3b2430');R(450,y,6,5,'#3b2430')}
      for(const yy of[100]){c.globalAlpha=.5+.5*kk;R(30,yy,420,1,NEON[Math.floor(b/4)%6]);c.globalAlpha=1}
      floorTiles(60,400,170,180,b,kk);djBooth(b,kk);speakers(110,168,kk*.8);
      /* stairs on the right joining the floors */
      for(let k=0;k<14;k++){R(410+k*3,176-k*6,8,2,'#4a4466');R(410+k*3,264-k*6,8,2,'#4a4466')}
      lights(b,kk,90,178,60,400);
      /* basement: lasers and a strobe */
      c.save();c.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const a=Math.sin(t*1.3+i)*.9,col=NEON[(i+Math.floor(b))%6];c.strokeStyle=col;c.globalAlpha=.5*kk+.15;c.beginPath();c.moveTo(240,188);c.lineTo(240+Math.sin(a)*260,188+Math.cos(a)*90);c.stroke()}c.restore();c.globalAlpha=1;
      neonSign('B1',36,192,'#ff2e88',14,true);neonSign('1F',36,96,'#19e3ff',14,true);neonSign('RF',36,6,'#ffb347',14,true);
    }else if(id==='sewer'){
      R(0,0,VW,VH,'#0c0a08');const m=img('sew-mid'),f=img('sew-front');if(m.naturalWidth)c.drawImage(m,220,0,480,240,0,-12,480,240);if(f.naturalWidth)c.drawImage(f,220,0,480,240,0,-12,480,240);
      const ts=img('sof-tiles');if(ts.naturalWidth){c.globalAlpha=.85;c.drawImage(ts,432,224,96,96,36,64,96,96);c.globalAlpha=1}
      /* bulbs strung across the tunnel, the speakers on crates */
      for(let x=0;x<VW;x+=4){const yy=40+Math.round(Math.sin(x/VW*Math.PI)*14);R(x,yy,1,1,'#2a2010');if(x%16===0){c.globalAlpha=.6+.4*kk;R(x,yy+1,2,2,NEON[(x/16|0)%6]);c.globalAlpha=1}}
      speakers(150,190,kk);speakers(350,190,kk);djBooth(b,kk);
      if(Math.floor(b*2)%8===0&&kk>.6){c.globalAlpha=.18;R(0,0,VW,VH,'#ffffff');c.globalAlpha=1}
      lights(b,kk,40,206,40,440);
    }else{
      R(0,0,VW,VH,'#160c26');for(let x=0;x<VW;x+=20)R(x,0,1,190,'#1e1234');for(let y=20;y<190;y+=20)R(0,y,VW,1,'#1e1234');
      R(0,190,VW,80,'#0d0718');floorTiles(250,440,198,258,b,kk);
      const rc=img('rcc'),cp=img('cpap1');
      if(rc.naturalWidth){c.drawImage(rc,64,170,30,22,260,70,60,44);c.drawImage(rc,96,196,32,16,340,80,64,32);c.drawImage(rc,96,166,16,28,440,170,16,28)}
      if(cp.naturalWidth)c.drawImage(cp,103,15,18,30,416,166,27,45);
      neonSign('ARCADE',60,40,'#ff2e88',14,(Math.floor(t*3)%7)!==0);neonSign('ゲーム',150,44,'#19e3ff',12,true);
      /* the cabinets: the street's purple one and the flat's brown one, recoloured down the row */
      for(const q of cab){const src=q.kind?img('apt'):img('rcc');if(!src.naturalWidth)continue;const im=L.recolored(src,q.hue);
        if(q.kind)c.drawImage(im,88,178,20,30,q.x,q.y-60,40,60);else c.drawImage(im,112,164,16,28,q.x+4,q.y-56,32,56);
        const sx=q.x+(q.kind?10:10),sy=q.y-(q.kind?48:44);R(sx,sy,16,10,q.flash>0?NEON[Math.floor(t*20)%6]:NEON[(Math.floor(t*2)+q.hue)%6]);c.globalAlpha=.5;R(sx,sy+Math.floor(t*12)%10,16,1,'#000');c.globalAlpha=1;
        q.bb=[q.x,q.y-60,q.x+40,q.y]}
      djBooth(b,kk);lights(b,kk,0,258,250,440);
    }
  }
  function drawFront(b){
    if(V.id==='main'){R(0,186,100,18,'#2a1830');R(0,186,100,2,'#ffb347');R(0,204,100,60,'#1a0f22')}
    if(V.id==='sewer'){const wt=img('sew-water');if(wt.naturalWidth){const f=Math.floor(t*6)%4;for(let x=0;x<VW;x+=64)c.drawImage(wt,f*64,0,64,32,x,216,64,32)}R(0,248,VW,22,'#0b1430')}
  }

  /* ---- crowd behaviour ---- */
  const S=()=>st();let mode='';
  function updCrowd(dt,b,kk){
    const s=S(),style=s.style,battle=s.battle;
    const pit=crowd.filter(d=>d.pit),pf=V.floors[V.pit.f];
    /* the minister of enjoyment: one dancer performs in a ring of the others */
    if(style==='minister'&&(!V.min||!crowd.includes(V.min))){const pool=crowd.filter(d=>d.floor===V.pit.f&&!d.pit&&d.state==='dance');V.min=pool.length?rndp(pool):null;if(V.min)V.min.tx=V.pit.x-60}
    if(style!=='minister')V.min=null;
    mode=battle?'battle':style;
    crowd.forEach((d,i)=>{
      const f=V.floors[d.floor];d.ph+=dt;
      if(d.state==='enter'){d.alpha=Math.min(1,d.alpha+dt*2);if(Math.abs(d.x-d.tx)<2)d.state='dance'}
      if(d.state==='out'){d.tx=V.door.x;if(Math.abs(d.x-d.tx)<4){d.alpha-=dt*2;if(d.alpha<=0)d.dead=true}}
      /* where to stand: home, a ring round the battle or the minister, or the door */
      if(d.state==='dance'){
        let tx=d.hx;
        if(d.pit&&battle){tx=V.pit.x+(d.who==='g'?-18:18)}
        else if(battle&&d.floor===V.pit.f){const side=d.hx<V.pit.x?-1:1;tx=V.pit.x+side*(40+((i*37)%60))}
        else if(V.min&&d.floor===V.pit.f&&d!==V.min){const side=d.hx<V.min.x?-1:1;tx=V.min.x+side*(26+((i*29)%40))}
        d.tx=clamp(tx,f.x0,f.x1)}
      const dx=d.tx-d.x,moving=Math.abs(dx)>1.5;
      if(moving){d.x+=Math.sign(dx)*Math.min(Math.abs(dx),40*dt);d.face=Math.sign(dx)}
      d.moving=moving;
      /* jumps: moshers on the kick, the minister high, everyone on a drop */
      d.vy+=420*dt;d.jump=Math.min(0,d.jump+d.vy*dt);if(d.jump>=0){d.jump=0;d.vy=0}
      if(!moving&&d.state==='dance'&&!f.chill){
        if(d===V.min&&kk>.85&&d.jump===0)d.vy=-150;
        else if(style==='mosh'&&kk>.9&&d.jump===0&&Math.random()<.35)d.vy=-rnd(70,120);
        else if(style==='rave'&&kk>.9&&d.jump===0&&Math.random()<.6)d.vy=-60;
        if(style==='mosh'&&!d.pit&&kk>.9&&Math.random()<.2)d.x=clamp(d.x+rnd(-4,4),f.x0,f.x1);
      }
      if(d.kind==='brawl'){
        /* the pit: in a battle they trade blows, otherwise they bounce and spar now and then */
        d.at-=dt;const foe=pit.find(q=>q!==d);if(foe&&!moving)d.face=Math.sign(foe.x-d.x)||d.face;
        if(d.at<=0){const fight=battle||Math.random()<.25,set=BR[d.who];
          if(fight){d.anim=d.who==='g'?rndp(['punch','kick','jab','jk']):rndp(['punch','punch','hurt']);d.at=set[d.anim][1]/9+.15;
            if(battle&&Math.random()<.5){const q=crowd.filter(z=>!z.pit&&z.floor===V.pit.f);if(q.length)say(rndp(q),rndp(CHEER),1.2)}}
          else{d.anim='idle';d.at=rnd(.6,1.4)}d.af=0}
        d.af=(d.af||0)+dt*9;
      }
    });
    crowd=crowd.filter(d=>!d.dead);
    /* the bouncer: every so often walks someone to the door */
    const bn=staff.find(q=>q.role==='bouncer');
    if(bn){bn.ph+=dt;V.bt=(V.bt||rnd(20,35))-dt;
      if(!bn.target&&V.bt<=0){const pool=crowd.filter(d=>!d.pit&&d.state==='dance'&&d.floor===V.door.f);if(pool.length){bn.target=rndp(pool);bn.target.state='escort';say(bn,'OUT!',1.6)}V.bt=rnd(25,45)}
      if(bn.target){const q=bn.target;bn.tx=q.x+(q.x<bn.x?8:-8);const dx=bn.tx-bn.x;if(Math.abs(dx)>2){bn.x+=Math.sign(dx)*Math.min(Math.abs(dx),45*dt);bn.face=Math.sign(dx);bn.moving=true}else{bn.moving=false;q.state='out';bn.target=null;bn.back=true}}
      else if(bn.back){const dx=V.door.x-14-bn.x;if(Math.abs(dx)>2){bn.x+=Math.sign(dx)*45*dt;bn.face=Math.sign(dx);bn.moving=true}else{bn.back=false;bn.moving=false;bn.face=-1}}}
    staff.forEach(q=>{if(q.role==='bar')q.ph+=dt});
  }
  function hype(){
    if(crowd.filter(d=>!d.pit).length>=40)return'full';
    const f=V.floors[V.door.f],d=newDancer(V.door.f,V.door.x,rnd(f.y0,f.y1),true);d.tx=rnd(f.x0,f.x1);d.hx=d.tx;crowd.push(d);say(d,rndp(['Made it!','Let me in!','Ayy!','やった!']),1.4);return'ok';
  }
  function say(d,txt,dur){bubbles=bubbles.filter(q=>q.d!==d);bubbles.push({d,txt,t:dur})}

  /* ---- one person on screen ---- */
  function drawPerson(d,b,kk){
    const f=V.floors[d.floor],style=S().style,still=!d.moving;
    let x=d.x,y=d.y+d.jump,bob=0,dir='f',fr=0,face=d.face;
    if(still&&d.state!=='out'&&d.state!=='escort'){
      if(f.chill){bob=0;fr=0}
      else if(style==='disco'){x+=Math.round(Math.sin(b*Math.PI)*3);fr=Math.floor(b*2)%4;face=Math.floor(b/2)%2?1:-1}
      else if(style==='wave'){bob=Math.max(0,Math.sin(b*Math.PI*2-d.x*.05))*5;fr=Math.floor(b*2)%4}
      else if(style==='sway'){x+=Math.round(Math.sin(b*Math.PI/2)*2);fr=Math.floor(b)%2*2}
      else if(style==='rave'){bob=Math.abs(Math.sin(b*Math.PI*2))*3;fr=Math.floor(b*4)%4}
      else{bob=kk*2;fr=Math.floor(b*2)%4}
    }else{dir=face>0?'r':'l';fr=Math.floor(d.ph*8)%4}
    y-=Math.round(bob);c.globalAlpha=d.alpha==null?1:d.alpha;let top;
    if(d.kind==='brawl'){const set=BR[d.who][d.anim]||BR[d.who].idle,n=set[1],fi=d.anim==='idle'?Math.floor(b*2)%n:Math.min(n-1,Math.floor(d.af)),im=img('brawl');
      if(im.naturalWidth)blit(im,fi*96,set[0]*64,96,64,45,63,x,y,d.who==='g'?face:-face);top=y-46}
    else if(d.kind==='duel'){
      /* a Duelyst party-goer: idle loop on the beat, the run row when moving, and its attack row as a flourish on a drop */
      const D=DU[d.du],im=img('du-'+d.du),bx=D.box,bh=bx[3]-bx[1],sc=36/bh,r=d.flour>0?D.atk:still?D.idle:D.run,
        fi=d.flour>0?Math.min(r[1]-1,Math.floor((1-d.flour/1.2)*r[1])):Math.floor(still?b*2:d.ph*8)%r[1];
      if(im.naturalWidth)blit(im,fi*D.fw,r[0]*D.fh,D.fw,D.fh,(bx[0]+bx[2])/2,bx[3],x,y,face,sc);top=y-bh*sc}
    else if(d.kind==='town'){const t0=L.TOWN[d.town],row=still?(t0.n[2]&&Math.floor(b/8)%3===2?2:1):0,n=t0.n[row]||t0.n[1],im=img('town');
      if(im.naturalWidth)blit(im,(Math.floor(still?b*2:d.ph*8)%n)*L.TFR,(d.town*3+row)*L.TFR,L.TFR,L.TFR,t0.ax||L.TAX,L.TFR,x,y,face);top=y-36}
    else{const H=Math.round(38*(d.hk||1)),sp=codeSprite(d,H,dir,fr);c.drawImage(sp.cv,Math.round(x)-sp.ax,Math.round(y)-sp.ay);top=y-H}
    c.globalAlpha=1;d.bb=[x-10,top,x+10,y];d.top=[x,top];
  }

  /* ---- clicks: a dancer says something; an arcade cabinet lights up ---- */
  out.addEventListener('pointerdown',e=>{
    const r=out.getBoundingClientRect(),px=(e.clientX-r.left)*VW/r.width,py=(e.clientY-r.top)*VH/r.height;
    for(const q of cab)if(q.bb&&px>=q.bb[0]&&px<=q.bb[2]&&py>=q.bb[1]&&py<=q.bb[3]){q.flash=1.2;const pl=crowd.filter(d=>d.floor===1&&Math.abs(d.x-q.x-20)<40);say(pl.length?rndp(pl):{top:[q.x+20,q.y-62]},rndp(['HIGH SCORE!','GG','1UP!','CONTINUE?','K.O.!','PERFECT!']),1.6);return}
    const hit=crowd.concat(staff).filter(d=>d.bb&&px>=d.bb[0]&&px<=d.bb[2]&&py>=d.bb[1]&&py<=d.bb[3]).sort((a,b)=>b.y-a.y)[0];
    if(hit)say(hit,hit.role==='bouncer'?rndp(['Keep it moving.','Not tonight.','Names?']):hit.role==='bar'?rndp(['What can I get you?','On the house','いらっしゃい!']):rndp(CLICKSAY),1.6);
  });

  function frame(dt){
    const s=S(),b=s.beat,kk=s.kick;t+=dt;
    /* a drop every 16 beats: a flash and the hologram changes colour */
    const dr=Math.floor(b/16);if(dr!==lastDrop){if(lastDrop>=0){flash=1;holo=rndp(NEON.filter(q=>q!==holo));crowd.forEach(d=>{if(d.kind==='duel')d.flour=1.2;else if(d.jump===0&&!V.floors[d.floor].chill&&Math.random()<.7)d.vy=-rnd(60,110)})}lastDrop=dr}
    flash=Math.max(0,flash-dt*2.2);
    updCrowd(dt,b,kk);
    cab.forEach(q=>q.flash=Math.max(0,q.flash-dt));crowd.forEach(d=>{if(d.flour>0)d.flour-=dt});
    c.imageSmoothingEnabled=false;drawRoom(b,kk);
    crowd.concat(staff).sort((a,b2)=>a.y-b2.y).forEach(d=>{if(d.role){const sp=codeSprite(d,Math.round(38*(d.hk||1)),d.moving?(d.face>0?'r':'l'):'f',d.moving?Math.floor(d.ph*8)%4:0);c.drawImage(sp.cv,Math.round(d.x)-sp.ax,Math.round(d.y)-sp.ay);d.bb=[d.x-10,d.y-44,d.x+10,d.y];d.top=[d.x,d.y-44]}else drawPerson(d,b,kk)});
    drawFront(b);
    if(flash>0){c.globalAlpha=flash*.35;R(0,0,VW,VH,'#ffffff');c.globalAlpha=1}
    /* everything doubled onto the page's canvas, then the speech bubbles at full resolution */
    oc.save();oc.imageSmoothingEnabled=false;oc.setTransform(1,0,0,1,0,0);oc.drawImage(lc,0,0,out.width,out.height);
    const k=out.width/VW;oc.font='16px "NJ UI","Rajdhani",sans-serif';oc.textAlign='center';oc.textBaseline='middle';
    bubbles.forEach(q=>{q.t-=dt;const p=q.d.top||[0,0],x=p[0]*k,y=(p[1]-6)*k,w=oc.measureText(q.txt).width+14;
      oc.fillStyle='#f3ead8';oc.fillRect(x-w/2,y-12,w,22);oc.strokeStyle='#0a0612';oc.lineWidth=2;oc.strokeRect(x-w/2,y-12,w,22);oc.fillStyle='#0a0612';oc.fillText(q.txt,x,y)});
    bubbles=bubbles.filter(q=>q.t>0);
    oc.restore();
  }
  useVenue(vi);
  /* everyone in the room keeps reacting a little even between bubbles */
  setInterval(()=>{if(document.hidden)return;const q=crowd.filter(d=>!d.pit&&d.state==='dance');if(q.length&&Math.random()<.5)say(rndp(q),rndp(CHEER),1.3)},4000);
  return{frame,hype,count:()=>crowd.filter(d=>!d.pit).length,mode:()=>mode,venue:()=>VENUES[vi].name,next:()=>{useVenue(vi+1);return VENUES[vi].name},set:i=>useVenue(i)};
}
g.PixelClub={start,VENUES};
})(window);

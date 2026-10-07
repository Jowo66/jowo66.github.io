(function(){
'use strict';
const $=s=>document.querySelector(s);
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const DAYST={on:false,k:0,map:null};
const BEACH={on:false,p:0}; /* Playa Sofia mode: shared by the HUD button, the nightclub window and the district map */
try{BEACH.on=localStorage.getItem('jowo.day')==='1';BEACH.p=BEACH.on?1:0;localStorage.setItem('jowo.beach',BEACH.on?'1':'0')}catch(e){} /* shared day/night state so the district map can follow the Day button */

/* ---------- clock ---------- */
function tick(){
  const d=new Date();
  $('#clock').textContent=d.toLocaleTimeString('en-GB',{hour12:false});
  $('#date').textContent=d.toLocaleDateString('en-CA');
}
tick();setInterval(tick,1000);

/* ---------- boot ---------- */
(function(){
  const lines=['<b>NEO-JOWO OS</b>','mounting /district ........ ok','loading neon ............. ok','tuning rain .............. ok','warming up the club ...... ok','calibrating the bass ..... ok','ようこそ · welcome · добро пожаловать · 환영합니다 · مرحبا'];
  const pre=$('#bootText');let i=0;
  const hide=()=>{$('#boot').classList.add('gone');openApp('about');if(innerWidth>760)openApp('map')};
  let done=false;const fin=()=>{if(done)return;done=true;hide()};
  if(reduce){setTimeout(fin,0);return}
  const next=()=>{if(done)return;if(i<lines.length){pre.innerHTML+=lines[i++]+'\n';setTimeout(next,i===1?350:170)}else{pre.innerHTML+='<small>click anywhere to skip</small>';setTimeout(fin,500)}};
  next();
  addEventListener('pointerdown',fin,{once:true});addEventListener('keydown',fin,{once:true});
})();

/* ---------- 3D alley ---------- */
(function(){
  const cv=$('#alley'),c=cv.getContext('2d');
  let W,H,f,mx=0,my=0,smx=0,smy=0,scroll=0;
  const mouse={x:-1,y:-1,on:false};
  const SEG=3,NSEG=16,WALL=2.4,FLOOR=1.3,TOP=-7;
  const SIGNS=['酒','夜','龍','電','猫','麺','薬','バー','ラーメン','БАР','ПИВО','주점','한식','ΜΠΑΡ','ΟΥΖΟ','مقهى','بار','बार','ผับ','ยา','PHARMA','NOODLE','SUSHI','CAFÉ','APTEKA','ÇAY','24H','OPEN','Ụlọ Nri','NNỌỌ','ỤLỌ AKWỤKWỌ'];
  const NEON=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a'];
  let QS=.8,ema=16.7,slowN=0,fastN=0;
  function size(){const s=Math.min(devicePixelRatio||1,1.5)*QS;W=cv.width=Math.floor(innerWidth*s);H=cv.height=Math.floor(innerHeight*s);f=H*.95}
  size();addEventListener('resize',size);
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;mouse.on=(e.target===cv);mouse.x=e.clientX*W/innerWidth;mouse.y=e.clientY*H/innerHeight});
  let SALT=0,alleyNo=1,J=null,pan=null,nextTurn=75+Math.random()*50,pulse=0;
  const PAN=1.7;
  const hash=n=>{let x=Math.sin(n*127.1+311.7+SALT*91.7)*43758.5453;return x-Math.floor(x)};
  let cx,cy;
  const P=(x,y,z)=>[cx+x*f/z,cy+y*f/z];
  function quad(a,b,c2,d){c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(c2[0],c2[1]);c.lineTo(d[0],d[1]);c.closePath()}
  const rain=Array.from({length:45},()=>({x:Math.random(),y:Math.random(),l:.03+Math.random()*.05,s:.9+Math.random()*.9}));

  /* ---- little shops set into the walls; customers wander in and out ---- */
  const SHOPS=[
    {k:'ラーメン',s:'RAMEN BAR',ic:'bowl',col:'#ff2e88',it:['#ffb347','#ff2e88','#f5efe0']},
    {k:'薬局 24H',s:'PHARMACY',ic:'pill',col:'#3dff9a',it:['#3dff9a','#f5efe0','#19e3ff']},
    {k:'Ụlọ Nri',s:'IGBO KITCHEN',ic:'pot',col:'#ffb347',it:['#e0352b','#ffb347','#3dff9a']},
    {k:'КИОСК',s:'CORNER STORE',ic:'kiosk',col:'#19e3ff',it:['#ff2e88','#ffb347','#7c5cff']},
    {k:'修理',s:'REPAIR SHOP',ic:'wrench',col:'#7c5cff',it:['#19e3ff','#9a96a8','#ffb347']},
    {k:'ゲーム',s:'ARCADE',ic:'pad',col:'#ff2e88',it:['#19e3ff','#ff2e88','#3dff9a']},
    {k:'ÇAY EVİ',s:'TEA HOUSE',ic:'cup',col:'#ffb347',it:['#c47a2a','#f5efe0','#3dff9a']},
    {k:'義体',s:'CYBERWARE CLINIC',ic:'eye',col:'#19e3ff',it:['#9a96a8','#ff2e88','#19e3ff']},
    {k:'LIBROS',s:'BOOKSTORE',ic:'book',col:'#7c5cff',it:['#ffb347','#e0352b','#19e3ff']},
    {k:'TACOS',s:'TACO BAR',ic:'taco',col:'#3dff9a',it:['#ffb347','#e0352b','#3dff9a']},
    {k:'カフェ♥',s:'CUTE CAFÉ',ic:'cafe',col:'#ff7ab6',cafe:true,it:['#ff7ab6','#f5efe0','#ffd0e4']},
    {k:'カフェ♥',s:'CUTE CAFÉ',ic:'cafe',col:'#ff7ab6',cafe:true,it:['#f5efe0','#ff7ab6','#ffb347']}
  ];
  /* tiny vector logos so each business reads at a glance */
  function shopIcon(t,x,y,r,col){
    c.save();c.translate(x,y);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=r*.17;c.lineCap='round';c.lineJoin='round';
    const arc=(a,b,rad,s,e,fill)=>{c.beginPath();c.arc(a,b,rad,s,e);fill?c.fill():c.stroke()};
    const ln=(pts)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0]*r,p[1]*r):c.moveTo(p[0]*r,p[1]*r));c.stroke()};
    if(t==='bowl'){arc(0,-.1*r,.85*r,0,Math.PI);ln([[-.9,-.1],[.9,-.1]]);ln([[-.3,-.3],[.6,-1.1]]);ln([[.05,-.3],[.85,-.95]]);ln([[-.45,-.5],[-.45,-.9]]);ln([[-.15,-.55],[-.15,-.95]])}
    else if(t==='pill'){ln([[-.25,-.85],[.25,-.85],[.25,-.25],[.85,-.25],[.85,.25],[.25,.25],[.25,.85],[-.25,.85],[-.25,.25],[-.85,.25],[-.85,-.25],[-.25,-.25],[-.25,-.85]])}
    else if(t==='pot'){ln([[-.8,-.3],[-.8,.5],[.8,.5],[.8,-.3],[-.8,-.3]]);ln([[-1,-.3],[1,-.3]]);ln([[-.35,-.5],[-.35,-.85]]);ln([[.1,-.5],[.1,-.95]]);ln([[.55,-.5],[.55,-.8]]);ln([[-.8,0],[-1.05,0]]);ln([[.8,0],[1.05,0]])}
    else if(t==='kiosk'){ln([[-.8,.8],[-.8,-.2],[.8,-.2],[.8,.8]]);ln([[-.95,-.2],[-.7,-.8],[.7,-.8],[.95,-.2]]);ln([[-.4,.8],[-.4,.2],[.4,.2],[.4,.8]]);ln([[-.35,-.2],[-.35,-.8]]);ln([[.35,-.2],[.35,-.8]])}
    else if(t==='wrench'){ln([[-.8,.8],[.35,-.35]]);arc(.55*r,-.55*r,.38*r,.6,Math.PI*2-.4);}
    else if(t==='pad'){ln([[-.95,-.1],[-.7,-.6],[.7,-.6],[.95,-.1],[.8,.6],[.45,.3],[-.45,.3],[-.8,.6],[-.95,-.1]]);ln([[-.5,-.2],[-.5,.1]]);ln([[-.65,-.05],[-.35,-.05]]);arc(.45*r,-.2*r,.1*r,0,7,1);arc(.7*r,0,.1*r,0,7,1)}
    else if(t==='cup'){ln([[-.65,-.35],[-.55,.6],[.55,.6],[.65,-.35],[-.65,-.35]]);arc(.8*r,.05*r,.28*r,-Math.PI/2,Math.PI/2);ln([[-.2,-.55],[-.2,-.9]]);ln([[.2,-.55],[.2,-.95]])}
    else if(t==='eye'){c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(0,-r*.95,r,0);c.quadraticCurveTo(0,r*.95,-r,0);c.stroke();arc(0,0,.38*r,0,7,0);arc(0,0,.14*r,0,7,1);ln([[1.0,-.1],[1.15,-.55]]);ln([[-1.0,.1],[-1.15,.55]])}
    else if(t==='book'){ln([[0,-.7],[0,.7]]);ln([[0,-.7],[-.9,-.5],[-.9,.7],[0,.7]]);ln([[0,-.7],[.9,-.5],[.9,.7],[0,.7]]);ln([[-.6,-.2],[-.25,-.12]]);ln([[.6,-.2],[.25,-.12]])}
    else if(t==='taco'){c.beginPath();c.arc(0,.5*r,.95*r,Math.PI,0);c.closePath();c.stroke();ln([[-.6,.1],[-.2,-.15],[.2,.1],[.6,-.15]])}
    else if(t==='cafe'){ln([[-.65,-.2],[-.55,.7],[.45,.7],[.55,-.2],[-.65,-.2]]);arc(.78*r,.25*r,.28*r,-Math.PI/2,Math.PI/2);
      c.beginPath();c.moveTo(-.05*r,.55*r);c.bezierCurveTo(-.55*r,.2*r,-.2*r,-.05*r,-.05*r,.18*r);c.bezierCurveTo(.1*r,-.05*r,.45*r,.2*r,-.05*r,.55*r);c.fill();ln([[-.3,-.4],[-.3,-.75]]);ln([[.1,-.4],[.1,-.85]])}
    c.restore();
  }
  const shopAt=(id,side)=>{
    if(J&&J.id===id)return null;
    if(hash(id*41+side*3+5)<.5)return null;
    const d=SHOPS[Math.floor(hash(id*19+side*11+1)*SHOPS.length)];
    return Object.assign({},d,{kp:hash(id*7+side)});
  };
  const SHOP_D=.8;
  const doorZ=id=>id*SEG+1.625-scroll;
  /* map a 100x(100*hh/ww) text space onto a rectangle of the wall plane */
  function wallAff(side,xx,zA,zB,ya,yb,w,h){
    const zl=side<0?zA:zB,zr=side<0?zB:zA,TL=P(xx,ya,zl),TR=P(xx,ya,zr),BL=P(xx,yb,zl);
    if(Math.hypot(TR[0]-TL[0],TR[1]-TL[1])<10)return false;
    c.setTransform((TR[0]-TL[0])/w,(TR[1]-TL[1])/w,(BL[0]-TL[0])/h,(BL[1]-TL[1])/h,TL[0],TL[1]);return true;
  }
  function drawShop(sh,side,id,zu,fog){
    const xw=side*WALL,xf=side*(WALL-SHOP_D),xi=xf+side*.4;
    const zA=zu+.45,zB=zu+2.75,dA=zu+1.3,dB=zu+1.95,TOPY=-1.35;
    if(zA<1.2)return;
    const al=.55+.45*fog,col=sh.col;
    c.globalAlpha=al;
    /* roof underside and the near end of the building */
    c.fillStyle='#07040d';quad(P(xw,TOPY,zA),P(xf,TOPY,zA),P(xf,TOPY,zB),P(xw,TOPY,zB));c.fill();
    c.fillStyle='#0d0818';quad(P(xw,TOPY,zA),P(xf,TOPY,zA),P(xf,FLOOR,zA),P(xw,FLOOR,zA));c.fill();
    c.strokeStyle=col;c.lineWidth=Math.max(1,f/zu*.018);c.globalAlpha=al*.7;quad(P(xw,TOPY,zA),P(xf,TOPY,zA),P(xf,FLOOR,zA),P(xw,FLOOR,zA));c.stroke();c.globalAlpha=al;
    /* the shopfront itself */
    c.fillStyle='#17102a';quad(P(xf,TOPY,zA),P(xf,TOPY,zB),P(xf,FLOOR,zB),P(xf,FLOOR,zA));c.fill();
    c.fillStyle=col;c.globalAlpha=al*.55;quad(P(xf,TOPY-.04,zA),P(xf,TOPY-.04,zB),P(xf,TOPY+.06,zB),P(xf,TOPY+.06,zA));c.fill();c.globalAlpha=al;
    /* door recess: back wall, floor, lintel, and the far jamb that faces us */
    c.fillStyle='#0a0612';quad(P(xi,-.7,dA),P(xi,-.7,dB),P(xi,FLOOR,dB),P(xi,FLOOR,dA));c.fill();
    c.save();
    if(wallAff(side,xi,dA,dB,-.7,FLOOR,66,200)){
      const g=c.createLinearGradient(0,0,0,200);g.addColorStop(0,col+'aa');g.addColorStop(1,'#ffcf8a88');c.fillStyle=g;c.fillRect(0,0,66,200);
      for(let r=0;r<3;r++){const y=30+r*52;c.fillStyle='#0a0612';c.fillRect(0,y+34,66,3);
        for(let k=0;k<3;k++){const hh=hash(id*9+r*13+k*5+side);c.fillStyle=sh.it[Math.floor(hh*sh.it.length)];const bh=10+hash(k+r*3+id)*18;c.fillRect(4+k*20,y+34-bh,14,bh)}}
      if(sh.kp>.3){c.fillStyle='#0a0612';c.beginPath();c.arc(33,120,10,0,7);c.fill();c.fillRect(21,129,24,70)}
    }
    c.restore();
    c.fillStyle='#120a1e';quad(P(xf,FLOOR,dA),P(xf,FLOOR,dB),P(xi,FLOOR,dB),P(xi,FLOOR,dA));c.fill();
    c.fillStyle='#07040d';quad(P(xf,-.7,dA),P(xf,-.7,dB),P(xi,-.7,dB),P(xi,-.7,dA));c.fill();
    c.fillStyle='#2a1c42';quad(P(xf,-.7,dB),P(xi,-.7,dB),P(xi,FLOOR,dB),P(xf,FLOOR,dB));c.fill();
    c.strokeStyle=col;c.lineWidth=Math.max(1,f/zu*.02);quad(P(xf,-.7,dA),P(xf,-.7,dB),P(xf,FLOOR,dB),P(xf,FLOOR,dA));c.stroke();
    /* two display windows, glowing */
    [[zu+.55,zu+1.2],[zu+2.05,zu+2.65]].forEach(([wa,wb],wi)=>{
      c.save();
      if(wallAff(side,xf,wa,wb,-.45,.75,100,160)){
        const g=c.createLinearGradient(0,0,0,160);g.addColorStop(0,col+'99');g.addColorStop(1,'#ffcf8a66');c.fillStyle=g;c.fillRect(0,0,100,160);
        c.fillStyle='#0a0612';c.fillRect(0,118,100,4);
        for(let k=0;k<4;k++){const hh=hash(id*7+k*5+wi+side);c.fillStyle=sh.it[Math.floor(hh*sh.it.length)];const bh=18+hash(k+id+wi)*40;c.fillRect(6+k*24,118-bh,16,bh)}
        c.strokeStyle='#05030a';c.lineWidth=7;c.strokeRect(0,0,100,160);
      }
      c.restore();
    });
    /* striped awning sticking out over the street */
    for(let k=0;k<7;k++){
      const za=zA+k*(zB-zA)/7,zb=za+(zB-zA)/7;
      c.fillStyle=k%2?'#1a0f22':col;c.globalAlpha=al*.92;
      quad(P(xf,-.82,za),P(xf-side*.6,-.55,za),P(xf-side*.6,-.55,zb),P(xf,-.82,zb));c.fill();
    }
    /* sign board standing on the roof */
    c.globalAlpha=al;
    const xs=xf-side*.04;
    c.fillStyle='#0a0612';quad(P(xs,-2.5,zA-.1),P(xs,TOPY,zA-.1),P(xs,TOPY,zB+.1),P(xs,-2.5,zB+.1));c.fill();
    c.strokeStyle=col;c.lineWidth=Math.max(1,f/zu*.025);
    if(fog>.35){c.save();c.globalAlpha*=.3;c.lineWidth*=3.4;quad(P(xs,-2.5,zA-.1),P(xs,TOPY,zA-.1),P(xs,TOPY,zB+.1),P(xs,-2.5,zB+.1));c.stroke();c.restore()}
    quad(P(xs,-2.5,zA-.1),P(xs,TOPY,zA-.1),P(xs,TOPY,zB+.1),P(xs,-2.5,zB+.1));c.stroke();
    c.save();
    if(wallAff(side,xs,zA-.1,zB+.1,-2.5,TOPY,200,100)){
      c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';
      shopIcon(sh.ic,34,50,24,col);
      c.strokeStyle=col;c.globalAlpha=al*.5;c.lineWidth=1.5;c.beginPath();c.moveTo(66,14);c.lineTo(66,86);c.stroke();c.globalAlpha=al;
      const fs=Math.min(40,124/Math.max(2.4,[...sh.k].length*.95));
      c.font=`800 ${fs}px "Zen Kaku Gothic New","Noto Sans",sans-serif`;c.fillStyle=col;c.fillText(sh.k,133,34,122);
      c.globalAlpha=al*.95;c.font='700 14px "Share Tech Mono",monospace';c.fillText(sh.s,133,76,124);
    }
    c.restore();
    /* light spilling onto the wet street */
    c.globalAlpha=(.1+.12*fog);c.fillStyle=col;
    quad(P(xf,FLOOR,dA),P(xf,FLOOR,dB),P(side*.3,FLOOR,dB+.9),P(side*.3,FLOOR,dA-.2));c.fill();
    c.globalAlpha=1;
  }
  /* neon sign words are drawn once into small sprites and then just scaled */
  const SPR=new Map();
  function signSprite(word,col,single){
    const key=word+'|'+col+'|'+single;let sp=SPR.get(key);if(sp)return sp;
    const g0=document.createElement('canvas').getContext('2d'),font=`${single?900:800} 100px "Zen Kaku Gothic New","Noto Sans",sans-serif`;g0.font=font;
    sp=document.createElement('canvas');sp.width=Math.ceil(g0.measureText(word).width)+10;sp.height=130;
    const g=sp.getContext('2d');g.font=font;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';g.fillText(word,sp.width/2,65);
    if(SPR.size>200)SPR.clear();SPR.set(key,sp);return sp;
  }
  function wall(side,id,z1,z2,zu){
    const x=side*WALL,fog=clamp(1-z1/(SEG*NSEG),0,1);
    const h=hash(id*2+(side>0?1:0));
    const tone=Math.floor((10+h*14)*(1-dayK)+(125+h*38)*dayK);
    c.fillStyle=`rgb(${tone+8},${tone},${tone+22})`;
    quad(P(x,TOP,z1),P(x,FLOOR,z1),P(x,FLOOR,z2),P(x,TOP,z2));c.fill();
    /* windows: one path and one fill per colour instead of one per pane */
    const cols=3,rows=7,WG=[[],[],[]];
    for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){
      const lit=hash(id*31+r*7+k*3+(side>0?5:0));
      if(lit<.45)continue;
      WG[lit>.85?0:lit>.7?1:2].push([z1+(k+.25)*(z2-z1)/cols,(z2-z1)/cols*.5,-5.4+r*.62]);
    }
    [['#ff2e88',.9],['#19e3ff',.9],['#ffb347',.6]].forEach((cfg,gi)=>{const g=WG[gi];if(!g.length)return;
      c.fillStyle=cfg[0];c.globalAlpha=(.25+.55*fog)*cfg[1]*(1-dayK*.75);c.beginPath();
      g.forEach(q=>{const a=P(x,q[2],q[0]),b2=P(x,q[2]+.36,q[0]),d=P(x,q[2]+.36,q[0]+q[1]),e2=P(x,q[2],q[0]+q[1]);c.moveTo(a[0],a[1]);c.lineTo(b2[0],b2[1]);c.lineTo(d[0],d[1]);c.lineTo(e2[0],e2[1]);c.closePath()});
      c.fill()});
    c.globalAlpha=1;
    /* dark ledge */
    c.fillStyle='rgba(0,0,0,.45)';
    quad(P(x,FLOOR-.35,z1),P(x,FLOOR,z1),P(x,FLOOR,z2),P(x,FLOOR-.35,z2));c.fill();
    /* neon sign */
    const sg=hash(id*13+(side>0?9:2));
    const shop=shopAt(id,side);
    if(shop)drawShop(shop,side,id,zu,fog);
    if(sg>.5&&!shop){
      const col=NEON[Math.floor(hash(id*5+side)*NEON.length)],zc=z1+(z2-z1)*.5,sy0=-3.8+hash(id)*1.2,sy1=sy0+1.6,zw=.28;
      const p0=P(x-side*.04,sy0,zc-zw),p1=P(x-side*.04,sy1,zc-zw),p2=P(x-side*.04,sy1,zc+zw),p3=P(x-side*.04,sy0,zc+zw);
      c.fillStyle='#0a0612';quad(p0,p1,p2,p3);c.fill();
      c.strokeStyle=col;c.lineWidth=Math.max(1,f/zc*.03);c.globalAlpha=.35+.65*fog;
      if(fog>.4){c.save();c.globalAlpha*=.3;c.lineWidth*=3.4;quad(p0,p1,p2,p3);c.stroke();c.restore()}quad(p0,p1,p2,p3);c.stroke();
      const m=P(x-side*.05,(sy0+sy1)/2,zc),word=SIGNS[Math.floor(hash(id*3+side)*SIGNS.length)],len=[...word].length,px=f/zc;
      c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';
      if(len===1){const fs=px*.42;if(fs>7){const sp=signSprite(word,col,1),k=fs/100;c.drawImage(sp,m[0]-sp.width*k/2,m[1]-sp.height*k/2,sp.width*k,sp.height*k)}}
      else{const fs=Math.min(px*.4,px*1.45/(len*.62));if(fs>6){const sp=signSprite(word,col,0),k=fs/100;c.save();c.translate(m[0],m[1]);c.rotate(Math.PI/2);c.drawImage(sp,-sp.width*k/2,-sp.height*k/2,sp.width*k,sp.height*k);c.restore()}}
      c.globalAlpha=1;
      /* reflection on wet floor */
      c.fillStyle=col;c.globalAlpha=.07+.09*fog;
      quad(P(x,FLOOR,zc-zw),P(x,FLOOR,zc+zw),P(side*.4,FLOOR,zc+zw*2.4),P(side*.4,FLOOR,zc-zw*2.4));c.fill();c.globalAlpha=1;
    }
    /* missing posters */
    if(hash(id*17+(side>0?3:8))>.72&&!shop){
      const zA=z1+(z2-z1)*.1,zB=zA+.55,zl=side<0?zA:zB,zr=side<0?zB:zA,ya=-.45,yb=.75,xx=x-side*.03;
      const TL=P(xx,ya,zl),TR=P(xx,ya,zr),BL=P(xx,yb,zl),wpx=Math.hypot(TR[0]-TL[0],TR[1]-TL[1]);
      c.globalAlpha=.55+.45*fog;
      c.fillStyle='#d9cfa8';quad(TL,TR,P(xx,yb,zr),BL);c.fill();
      if(wpx>9){
        c.save();c.setTransform((TR[0]-TL[0])/100,(TR[1]-TL[1])/100,(BL[0]-TL[0])/140,(BL[1]-TL[1])/140,TL[0],TL[1]);
        c.fillStyle='#b01826';c.font='bold 17px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('MISSING',50,16);
        c.fillStyle='#2a2430';c.fillRect(22,30,56,48);c.fillStyle='#d9cfa8';c.font='bold 36px sans-serif';c.fillText('?',50,56);
        c.fillStyle='#1a1420';c.font='bold 13px sans-serif';c.fillText('PROJECT',50,96);c.fillText('HERE',50,111);
        c.font='9px sans-serif';c.fillText('行方不明 · пропал',50,128);
        c.restore();
      }
      c.globalAlpha=1;
    }
  }
  function lantern(id,z){
    const y=-2.3+hash(id)*.4;
    const a=P(-WALL,y-.6,z),b=P(WALL,y-.6,z);
    c.strokeStyle='rgba(255,179,71,.35)';c.lineWidth=1;c.beginPath();c.moveTo(a[0],a[1]);
    c.quadraticCurveTo((a[0]+b[0])/2,a[1]+f/z*.35,b[0],b[1]);c.stroke();
    for(let k=-1;k<=1;k++){
      const p=P(k*1.3,y+Math.abs(k)*.0+.12,z),r=f/z*.17;
      const g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],r*3.2);
      g.addColorStop(0,'rgba(255,120,60,.55)');g.addColorStop(1,'rgba(255,60,60,0)');
      c.fillStyle=g;c.fillRect(p[0]-r*3.2,p[1]-r*3.2,r*6.4,r*6.4);
      c.fillStyle='#e0352b';c.beginPath();c.ellipse(p[0],p[1],r*.7,r,0,0,7);c.fill();
      c.fillStyle='#ffb347';c.fillRect(p[0]-r*.5,p[1]-r*.1,r,r*.2);
    }
  }

  /* ---- low-poly 3D characters (engine in lp3d.js) ---- */
  const FOGC=[58,15,74];
  const nz3=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
  const CAM={P:(x,y,z)=>P(x,y,z),f:0,floorY:FLOOR,amb:[.16,.16,.2],fogC:FOGC,fogK:z=>clamp(Math.pow(z/30,1.2),0,.85),
    lights:[{d:nz3([-.9,-.15,-.2]),c:[255,46,136],k:.9},{d:nz3([.9,-.15,-.2]),c:[25,227,255],k:.9},{d:nz3([0,-1,-.1]),c:[255,150,60],k:.5}]};
  const SCR0=.35;let SCR=SCR0,boost=0;   /* world drift toward the viewer; clicking boosts it */
  const WEIGHTS={umbrella:2,courier:2,kimono:1,dog:1,drone:2,ramen:1,dealer:1,preacher:1,robocop:1,oldlady:1,mascot:1,kidball:1,detective:1,samurai:1,kidrun:1,sage:1,hotdog:1,ripperdoc:1,netrunner:1,monk:1};
  const UNIQUE=new Set(['dealer','preacher','robocop','detective','samurai','sage','mascot']);
  const WLIST=Object.keys(WEIGHTS).flatMap(k=>Array(WEIGHTS[k]).fill(k));
  const FEMOK=new Set(['umbrella','courier','ramen','hotdog','dealer','preacher','detective','kidball','kidrun','sage','ripperdoc','netrunner']);
  const CYOK=new Set(['umbrella','courier','kimono','ramen','hotdog','dealer','preacher','oldlady','kidball','detective','kidrun','sage']);
  const CYN=new Set(['robocop','ripperdoc','netrunner','monk']);
  const AUG=['optic implant','chrome forearm','neural jack','titanium spine','synth lungs','thermal eyes','gyro balance','audio mods','hydraulic knee','mem-core heart'];
  const CYB=['BEEP','01001','SYS OK','ERR 404','ピピ','Бип','삐빅','Ping!'];
  const COMMON=WLIST.filter(k=>!UNIQUE.has(k));
  const POINT=['YOU!','お前か!','ТЫ!','너!','أنت!','¡TÚ!','DU!'],FRUST=['Hmph!','ふん!','Тьфу!','칫!','Pfft.','Tsk!','Ewo!','Chai!'];
  /* at most two "unique" characters per alley, and a second one is unlikely */
  function pickType(){
    const nu=chars.filter(q=>UNIQUE.has(q.name)).length;
    for(let i=0;i<10;i++){
      const n=rndp(WLIST);
      if(!UNIQUE.has(n))return n;
      if(nu>=2||chars.some(q=>q.name===n))continue;
      if(nu===1&&Math.random()>.12)continue;
      return n;
    }
    return rndp(COMMON);
  }
  const SHOUTS=['おい!!','HEY!','¡OYE!','ЭЙ!','야!!','ÇEK!','Hé!','你干嘛!','यार!','أنت!','Oi!','Ντε!','Biko!','Ewo!'];
  let chars=[],spawnT=0,clock=0,coupleT=14,buyT=7,sheltered=[],emergeQ=[],emT=0,wasMon=false;const gk=ch=>ch.def.gk||'R';
  const rndp=a=>a[Math.floor(Math.random()*a.length)];
  function spawn(initial,force,ov){
    const name=force||pickType(),fem=ov&&ov.fem!=null?ov.fem:(FEMOK.has(name)&&Math.random()<.5),cy=CYOK.has(name)&&Math.random()<.24,def=LP.make(name==='sage'&&fem?'sageF':name,fem,cy);
    const stat=!!def.stat;
    const toward=stat?false:Math.random()<.65;
    const sp=stat?0:def.sp[0]+Math.random()*(def.sp[1]-def.sp[0]);
    const ent={parts:LP.compile(def.parts),x:name==='dealer'?(Math.random()<.5?-1:1)*(1.55+Math.random()*.3):(Math.random()*2-1)*1.5,
      z:initial?(6+Math.random()*20):(stat?10+Math.random()*5:(toward?30:6.5)),yaw:toward?Math.PI:0,sc:(def.sc||1),sw:1,sh:1,
      ph:Math.random()*6,clock:0,elev:def.fly?.75+Math.random()*.9:0,bob:0,arms:Object.assign({},def.arms||{}),tint:null};
    if(name==='ramen'||name==='hotdog')ent.sc=1;
    const agev=Lore.age(def,name),isF=fem||name==='kimono'||name==='oldlady'||name==='sageF',body=Lore.body(name,isF,agev,def);
    if(body){ent.sh=body.sh;ent.sw=body.sw}
    chars.push({name,fem,cy,def,ent,agev,body,myth:Lore.mythName(),toward,sp,stat,age:0,life:stat?16+Math.random()*6:999,irate:0,cool:0,wait:0,bubT:2+Math.random()*6,bub:null,bubK:null,bubL:0,bump:false,seed:Math.random()*10,bb:null,asked:false});
  }
  function spawnCouple(){
    spawn(false,'lover',{fem:false});spawn(false,'lover',{fem:true});
    const A=chars[chars.length-2],B=chars[chars.length-1];
    A.mate=B;B.mate=A;B.follower=true;B.toward=A.toward;B.sp=A.sp;B.ent.z=A.ent.z;B.ent.sc=A.ent.sc;B.ent.yaw=A.ent.yaw;B.ent.x=A.ent.x+.58;
    say(A,rndp(A.def.bub),'say',3)
  }
  function say(ch,txt,kind,dur){ch.bub=txt;ch.bubK=kind;ch.bubL=dur||2.2}
  function makeIrate(ch,txt,force){
    if(!force&&ch.cool>0)return;
    ch.irate=2.6;ch.cool=5;ch.wait=0;say(ch,txt||rndp(SHOUTS),'irate',2.4);
  }
  /* customers drift into shops, or step out of them */
  let shopT=3;
  const NOSHOP=n=>UNIQUE.has(n)||n==='drone'||n==='sage'||n==='ramen'||n==='hotdog';
  function visibleShops(){
    const out=[],b0=Math.floor(scroll/SEG);
    for(let id=b0;id<=b0+NSEG;id++)for(const side of [-1,1]){const sh=shopAt(id,side),z=doorZ(id);if(sh&&z>8&&z<20)out.push({id,side,sh,z})}
    return out;
  }
  function shopTraffic(dt){
    shopT-=dt;if(shopT>0||pan||MON.on)return;shopT=2.2+Math.random()*2.5;
    const vs=visibleShops();if(!vs.length)return;
    const cafeV=vs.find(v=>v.sh.cafe),cp=chars.find(q=>q.mate&&!q.follower&&!q.shop&&!q.mate.shop&&q.irate<=0&&q.wait<=0&&q.ent.z>6&&q.ent.z<22);
    if(cafeV&&cp&&Math.random()<.7){cp.shop={id:cafeV.id,side:cafeV.side};cp.mate.shop=cp.shop;say(cp,rndp(['Coffee?','カフェ行こ♥','Кофе?','카페 가요','Our table ♥']),'say',2.4);return}
    const s=rndp(vs);
    if(Math.random()<.5&&chars.length<11){
      let n='';for(let i=0;i<12;i++){const t=rndp(COMMON);if(!NOSHOP(t)&&!LP.MODELS[t]().fly&&!LP.MODELS[t]().stat){n=t;break}}
      if(!n)return;spawn(false,n);const ch=chars[chars.length-1],e=ch.ent;
      ch.stat=false;ch.toward=Math.random()<.5;e.z=s.z;e.x=s.side*(WALL-SHOP_D+.3);e.yaw=s.side>0?-Math.PI/2:Math.PI/2;
      ch.emerge=2.0;ch.ex=s.side*(.4+Math.random()*.9);ch.age=0;
    }else{
      const c2=chars.filter(q=>!q.stat&&!q.def.fly&&!NOSHOP(q.name)&&!q.shop&&!q.mate&&q.buy==null&&!q.chase&&!q.emerge&&q.irate<=0&&q.wait<=0&&q.ent.z>6&&q.ent.z<22&&Math.abs(q.ent.z-s.z)<5)[0];
      if(c2)c2.shop={id:s.id,side:s.side};
    }
  }
  /* two unique characters who meet point, argue for three exchanges, hop with rage and storm off */
  const ARGUE=['No, YOU move!','Мой тротуар!','俺の道だ!','내 길이야!','Excuse me?!','Ewo! Biko!','¡Yo llegué primero!','Je ne bouge pas.','Tsk, rookie.','Pas moi!','まさか!','Нет, ты!','I was here first!','Unbelievable.','お前こそ!','Gị onwe gị!'];
  let pairs=[];
  /* a monster attack: everyone runs for the nearest shop and hides until it is over */
  const SCREAM=['AAAH!','怪獣!','Монстр!','괴물이다!','Ewo!','KAIJU!','¡Corre!','Sauve qui peut!'];
  function nearestShop(ez){
    let best=null,bd=1e9;const b0=Math.floor(scroll/SEG);
    for(let id=b0;id<=b0+NSEG;id++)for(const side of [-1,1]){if(!shopAt(id,side))continue;const d=Math.abs(doorZ(id)-ez);if(d<bd){bd=d;best={id:id,side:side}}}
    return best;
  }
  function panicCheck(dt){
    if(MON.on&&!wasMon){wasMon=true;pairs=[];
      for(const ch of chars){
        ch.fled=true;ch.irate=0;ch.wait=0;ch.buy=null;ch.chase=null;ch.met=false;ch.emerge=0;ch.tint=null;ch.ent.tint=null;ch.hopT=0;ch.ent.elev=ch.def.fly?ch.ent.elev:0;
        delete ch.ent.arms[gk(ch)];ch.ent.parts=ch.ent.parts.filter(p=>!p.snack);ch.snack=false;
        ch.stat=false;ch.life=999;ch.hurry=true;
        const s=(NOSHOP(ch.name)||ch.def.fly)?null:nearestShop(ch.ent.z);
        if(s){ch.shop=s;ch.fleeShop=true;ch.vanish=0}
        else{ch.shop=null;ch.toward=Math.random()<.5;ch.sp=Math.max(ch.sp,4.5)}
        say(ch,rndp(SCREAM),'irate',2.2);
      }}
    if(!MON.on&&wasMon){wasMon=false;emergeQ=sheltered.splice(0);emT=1.5;chars.forEach(ch=>{ch.fled=false;ch.fleeShop=false;ch.hurry=false})}
    if(!MON.on&&emergeQ.length){emT-=dt;if(emT<=0){emT=.45;const q=emergeQ.shift(),vs=visibleShops();
      spawn(false,q.name,{fem:q.fem});const ch=chars[chars.length-1],e=ch.ent;
      ch.myth=q.myth;ch.agev=q.agev;ch.body=q.body;ch.prof=q.prof;if(q.sh){e.sh=q.sh;e.sw=q.sw}
      if(vs.length&&!ch.def.fly){const s=rndp(vs);ch.stat=false;ch.toward=Math.random()<.5;e.z=s.z;e.x=s.side*(WALL-SHOP_D+.3);e.yaw=s.side>0?-Math.PI/2:Math.PI/2;ch.emerge=2.0;ch.ex=s.side*(.4+Math.random()*.9);ch.age=0}}}
  }
  function updPairs(dt){
    pairs=pairs.filter(p=>{
      const A=p.A,B=p.B;
      if(A.dead||B.dead||!chars.includes(A)||!chars.includes(B)){A.wait=Math.min(A.wait,0);B.wait=Math.min(B.wait,0);return false}
      p.t+=dt;
      [[A,B],[B,A]].forEach(([a,b])=>{if(a.irate>0)return;a.ent.yaw=Math.atan2(b.ent.x-a.ent.x,b.ent.z-a.ent.z);if(!a.hopT)a.ent.arms[a.def.gk||'R']=-1.5+Math.sin(p.t*8+(a===A?0:2))*.3});
      const st=Math.floor((p.t-.9)/1.25);
      if(p.t>=.9&&st>p.n-1&&p.n<6){p.n++;const sp=p.n%2?A:B;say(sp,rndp(ARGUE),'irate',1.5)}
      if(p.n>=6&&p.t>=.9+6*1.25+.4&&!p.hop){p.hop=true;[A,B].forEach(q=>{q.hopT=.55;say(q,rndp(FRUST),'irate',1.2)})}
      if(p.hop&&p.t>=.9+6*1.25+1.05){const sw=Math.random()<.5;A.leave=sw?'toward':'away';B.leave=sw?'away':'toward';A.meetT=B.meetT=.01;return false}
      return true;
    });
  }
  function updChars(dt){
    updPairs(dt);
    clock+=dt;spawnT-=dt;shopTraffic(dt);
    if(spawnT<=0&&chars.length<9&&!MON.on&&!emergeQ.length){spawn(false);spawnT=1+Math.random()*2}
    panicCheck(dt);
    for(const ch of chars){
      const e=ch.ent;ch.age+=dt;e.clock=clock;ch.cool=Math.max(0,ch.cool-dt);
      ch.life-=dt;
      const drift=-SCR;
      if(ch.wait>0){ch.wait-=dt;e.z+=drift*dt}
      else if(ch.stat){e.z+=drift*dt}
      else e.z+=(ch.toward?-(ch.sp*.7+SCR):Math.max(.12,ch.sp*.7-SCR))*dt;
      if(!ch.stat&&ch.wait<=0)e.ph+=dt*Math.min(ch.sp,6)*3.4*(ch.hurry?1.5:1);
      if(!ch.stat&&!ch.def.fly&&ch.wait<=0)e.x+=Math.sin(clock*.6+ch.seed)*.01*dt*10;
      if(ch.def.drib&&ch.irate<=0&&ch.wait<=0){const sb=Math.abs(Math.sin(clock*7));e.arms.R=-.2-.25*sb;e.arms.eR=-.55+.1*sb}
      e.bob=ch.def.fly?Math.sin(clock*2+ch.seed)*.08:0;
      if(ch.hopT>0){ch.hopT-=dt;e.elev=Math.sin(Math.PI*clamp(1-ch.hopT/.55,0,1))*.7;if(ch.hopT<=0){e.elev=0;ch.hopT=0}}
      if(ch.emerge>0){ch.emerge-=dt;e.x+=(ch.ex-e.x)*Math.min(1,dt*1.6);
        e.yaw+=((ch.toward?Math.PI:0)-e.yaw)*Math.min(1,dt*2.5);if(ch.emerge<=0)e.yaw=ch.toward?Math.PI:0}
      if(ch.shop&&ch.irate>0&&!ch.vanish)ch.shop=null;
      if(ch.shop){const zd=doorZ(ch.shop.id),sd=ch.shop.side,tx=sd*(WALL-SHOP_D+.35);
        e.z+=(zd-e.z)*Math.min(1,dt*2.2);e.x+=(tx-e.x)*Math.min(1,dt*1.2);
        if(Math.abs(e.z-zd)<1.4)e.yaw+=((sd>0?Math.PI/2:-Math.PI/2)-e.yaw)*Math.min(1,dt*4);
        if(Math.abs(e.x)>WALL-SHOP_D-.1){ch.vanish=(ch.vanish||0)+dt/.5;if(ch.vanish>=1){ch.dead=true;if(ch.fleeShop)sheltered.push({name:ch.name,fem:ch.fem,myth:ch.myth,agev:ch.agev,body:ch.body,prof:ch.prof,sh:ch.ent.sh,sw:ch.ent.sw})}}}
      /* preacher gesticulates, samurai stays calm */
      if(ch.stat&&ch.wait<=0&&ch.irate<=0){
        if(ch.name==='preacher')e.arms.R=-2.5+Math.sin(clock*3)*.35;
        if(ch.name==='dealer')e.yaw=Math.PI+Math.sin(clock*.5+ch.seed)*.5;
        if(ch.name==='sage'){e.arms.L=-.3+Math.sin(clock*1.1)*.2;e.yaw=Math.PI+Math.sin(clock*.4+ch.seed)*.25}
      }
      if(ch.stat&&ch.life<=0&&ch.irate<=0)ch.dead=true;
      if(ch.meetT>0){ch.meetT-=dt;if(ch.meetT<=0){
        /* walk off in opposite directions, hurried and annoyed */
        ch.stat=false;ch.hurry=true;ch.toward=ch.leave==='toward';ch.sp=2+Math.random()*.9;ch.wait=0;
        delete e.arms[gk(ch)];e.yaw=ch.toward?Math.PI:0;say(ch,rndp(FRUST),'irate',1.8);ch.cool=3}}
      /* anger: shake, turn to face the viewer, flash red */
      if(ch.irate>0){
        ch.irate-=dt;e.x+=Math.sin(clock*60)*.012;
        let dy=Math.PI-(e.yaw%(Math.PI*2));e.yaw+=dy*Math.min(1,dt*6);
        e.tint=[255,30,30,.35+.25*Math.sin(clock*18)];e.arms[gk(ch)]=-2.6+Math.sin(clock*25)*.4;
        if(ch.irate<=0){e.tint=null;if(ch.name!=='preacher')delete e.arms[gk(ch)];e.yaw=ch.toward?Math.PI:(ch.stat?e.yaw:0)}
        ch.wait=Math.max(ch.wait,0);
      }
      /* random chatter */
      ch.bubT-=dt;if(ch.bubT<=0){
        if(ch.name==='sage'&&ch.stat){ch.bubT=8+Math.random()*3;if(ch.irate<=0&&ch.wait<=0&&e.z<24)say(ch,Lore.parable(),'wisdom',6.5)}
        else{ch.bubT=5+Math.random()*7;if(ch.irate<=0&&ch.wait<=0&&e.z<22&&Math.random()<.6)say(ch,(ch.cy&&Math.random()<.35)?rndp(CYB):rndp(ch.def.bub||['…']),'say',2.4)}
      }
      if(ch.bubL>0)ch.bubL-=dt;else ch.bub=null;
      /* detective stops people and asks questions */
      if(ch.name==='detective'&&ch.wait<=0&&!ch.asked&&!ch.met){
        const t=chars.find(o=>o!==ch&&!o.met&&!o.def.fly&&o.name!=='detective'&&Math.abs(o.ent.z-e.z)<1.7&&Math.abs(o.ent.x-e.x)<1.4&&o.irate<=0&&o.wait<=0);
        if(t){ch.asked=true;ch.wait=3.2;t.wait=3.2;e.yaw=t.ent.x<e.x?-Math.PI/2:Math.PI/2;
          say(ch,rndp(ch.def.bub),'say',2.8);say(t,rndp(['?','…','知らない','No.','Нет.','몰라요','لا.']),'say',2.4);e.arms[gk(ch)]=-1.5}
      }
      if(ch.name==='detective'&&ch.wait<=0&&ch.asked&&e.arms[gk(ch)]===-1.5){delete e.arms[gk(ch)];e.yaw=ch.toward?Math.PI:0;ch.asked=false;ch.cool=Math.max(ch.cool,0)}
    }
    /* couples walk side by side; partners follow the leader and share a shop door */
    for(const ch of chars){if(!ch.follower)continue;const A=ch.mate,e=ch.ent;
      if(!A||A.dead||!chars.includes(A)){ch.follower=false;ch.mate=null;continue}
      if(A.shop){if(!ch.shop){ch.shop=A.shop}}
      else{ch.shop=null;ch.vanish=0;e.z=A.ent.z;e.x=A.ent.x+.58;e.yaw=A.ent.yaw;e.ph=A.ent.ph+.35;ch.wait=A.wait;ch.toward=A.toward;ch.sp=A.sp;ch.age=Math.max(ch.age,A.age)}}
    coupleT-=dt;if(coupleT<=0&&!MON.on){coupleT=26+Math.random()*30;if(!chars.some(q=>q.mate)&&chars.length<9)spawnCouple()}
    /* robocop chases the running kid but never catches it */
    {const rc=chars.find(q=>q.name==='robocop');
     if(rc&&rc.chase){const k=rc.chase;
       if(!chars.includes(k)||k.dead){rc.chase=null;rc.hurry=false;rc.sp=rc.sp0||rc.sp}
       else{rc.sp=k.sp*.88;rc.toward=k.toward;rc.hurry=true;if(rc.wait<=0)rc.ent.yaw=rc.toward?Math.PI:0;rc.ent.x+=(k.ent.x-rc.ent.x)*Math.min(1,dt*1.2);
         const dir=k.toward?1:-1;if((rc.ent.z-k.ent.z)*dir<1&&rc.wait<=0)rc.ent.z=k.ent.z+dir}}
     else if(rc&&rc.irate<=0&&!rc.met){
       const k=chars.find(k=>k.name==='kidrun'&&!k.chased&&!k.dead&&k.ent.z>4&&k.ent.z<26&&Math.abs(k.ent.z-rc.ent.z)<4.5&&Math.abs(k.ent.x-rc.ent.x)<3.2);
       if(k){const dir=k.toward?1:-1,gap=(rc.ent.z-k.ent.z)*dir;
         if(gap>0.9||Math.abs(gap)<.8){rc.chase=k;k.chased=true;rc.sp0=rc.sp;rc.wait=.5;rc.ent.yaw=k.toward?Math.PI:0;
           say(rc,rndp(['STOP!!','止まれ!','СТОЙ!','멈춰!']),'irate',1.8);say(k,rndp(['Zoom!','捕まらない!','Не поймаешь!','못 잡아!']),'say',2)}}}}
    /* snack time: customers buy a hotdog or a bowl from a vendor */
    buyT-=dt;
    if(buyT<=0&&!MON.on){buyT=5+Math.random()*6;
      const vs=chars.filter(v=>(v.name==='ramen'||v.name==='hotdog')&&v.ent.z>6&&v.ent.z<21&&v.irate<=0&&v.wait<=0&&!v.met);
      if(vs.length){const v=rndp(vs);
        const cu=chars.find(q=>q!==v&&!q.stat&&!q.def.fly&&!q.mate&&!q.met&&!q.shop&&!q.chase&&!q.chased&&!q.emerge&&q.irate<=0&&q.wait<=0&&q.buy==null&&!['ramen','hotdog','kidball','oldlady','dog','monk','robocop'].includes(q.name)&&Math.abs(q.ent.z-v.ent.z)<2&&Math.abs(q.ent.x-v.ent.x)<2.6);
        if(cu){cu.buy=3.4;cu.buyV=v;cu.bside=cu.ent.x<v.ent.x?-1:1;cu.wait=3.4;v.wait=3.4;cu.hotdog=v.name==='hotdog';
          say(cu,cu.hotdog?rndp(['One hotdog!','ホットドッグ!','Хот-дог!','핫도그 주세요']):rndp(['Ramen, please!','ラーメン1つ!','Рамен!','라멘 주세요']),'say',1.8);say(v,rndp(['Coming up!','毎度!','Готово!','Ewo, nri!']),'say',1.8)}}}
    for(const ch of chars){if(ch.buy==null)continue;ch.buy-=dt;const e=ch.ent,v=ch.buyV,k=gk(ch);
      if(v&&chars.includes(v)){e.yaw=Math.atan2(v.ent.x-e.x,v.ent.z-e.z);e.x+=((v.ent.x+ch.bside*1.05)-e.x)*Math.min(1,dt*2.5)}
      if(ch.buy>1.9){e.arms[k]=-1.1}
      else if(ch.buy>0){
        if(!ch.snack){ch.snack=true;const ax=k==='L'?-.3:.3;e.parts=e.parts.concat(LP.compile(ch.hotdog?[{p:[ax,1.33,.5],s:[.09,.08,.36],c:'#d9a05b',snack:1},{p:[ax,1.4,.5],s:[.06,.06,.4],c:'#c8402a',snack:1}]:[{p:[ax,1.28,.46],s:[.2,.1,.2],c:'#f5efe0',snack:1},{p:[ax,1.37,.46],s:[.16,.04,.16],c:'#ffb347',snack:1}]).map(p=>Object.assign(p,{snack:1})))}
        e.arms[k]=-1.55+Math.sin(clock*9)*.08}
      else{e.parts=e.parts.filter(p=>!p.snack);delete e.arms[k];e.yaw=ch.toward?Math.PI:0;ch.buy=null;ch.snack=false;say(ch,rndp(['Mmm!','うまい!','Вкусно!','맛있다!','Oma!']),'say',1.8)}}
    /* two unique characters who meet stop, point at each other, then storm off */
    const us=chars.filter(q=>UNIQUE.has(q.name)&&!q.met&&q.irate<=0&&q.ent.z<22);
    if(us.length>=2){const A=us[0],B=us[1];
      if(Math.abs(A.ent.z-B.ent.z)<2.2&&Math.abs(A.ent.x-B.ent.x)<2.2){
        A.met=B.met=true;A.wait=B.wait=99;A.life=B.life=99;pairs.push({A,B,t:0,n:0});
        [[A,B],[B,A]].forEach(([p,q])=>{p.ent.yaw=Math.atan2(q.ent.x-p.ent.x,q.ent.z-p.ent.z);p.ent.arms[gk(p)]=-1.5;say(p,rndp(POINT),'irate',2.2)});
      }}
    /* walkers that cross paths bump into each other */
    for(let i=0;i<chars.length;i++)for(let j=i+1;j<chars.length;j++){
      const A=chars[i],B=chars[j];if(A.stat||B.stat||A.def.fly||B.def.fly||A.irate>0||B.irate>0||A.cool>0||B.cool>0)continue;
      if(A.mate===B||A.chase||B.chase||A.buy!=null||B.buy!=null)continue;
      if(Math.abs(A.ent.z-B.ent.z)<.4&&Math.abs(A.ent.x-B.ent.x)<.4&&A.ent.z<20){if(Math.random()<.2){makeIrate(A);makeIrate(B)}else{A.cool=Math.max(A.cool,6);B.cool=Math.max(B.cool,6)}}
    }
    chars=chars.filter(ch=>!ch.dead&&ch.ent.z>1.3&&ch.ent.z<36);
  }
  function drawChars(){
    const list=chars.slice().sort((a,b)=>b.ent.z-a.ent.z);
    CAM.f=f;
    list.forEach(ch=>{const e=ch.ent;ch.vis=false;if(e.z<1.4)return;
      const fogk=CAM.fogK(e.z);
      const fade=(1-(ch.vanish||0))*clamp(Math.min((33-e.z)/3,1,ch.age/.6,ch.stat?ch.life/1.2:1),0,1)*clamp((e.z-1.4)/1.2,0,1);
      if(fade<=0)return;
      const m=Object.assign({},e,{mir:true});LP.drawEnt(c,m,CAM,.16*(1-fogk)*fade);
      /* contact shadow */
      const sp=P(e.x,FLOOR,e.z),rr=f/e.z*.35*e.sc;c.fillStyle='rgba(0,0,0,'+.4*fade+')';c.beginPath();c.ellipse(sp[0],sp[1],rr,rr*.22,0,0,7);c.fill();
      const B=LP.drawEnt(c,e,CAM,fade);ch.bb=B.bb;ch.vis=true;
    });
    placeTerm();
    list.forEach(ch=>{if(ch.bub&&ch.bb&&ch.ent.z>1.8){const bw=clamp(f/ch.ent.z/260,.5,1.5);LP.bubble(c,(ch.bb[0]+ch.bb[2])/2,ch.bb[1]-2,ch.bub,bw,ch.bubK)}});
  }
  /* ---- 3D rain ---- */
  const drops=Array.from({length:260},()=>({x:(Math.random()*2-1)*WALL,y:-6+Math.random()*7.3,z:1+Math.random()*27,v:9+Math.random()*4}));
  let splashes=[];
  function updRain(dt){
    for(const d of drops){d.y+=d.v*dt;if(d.y>FLOOR){if(splashes.length<70&&Math.random()<.5)splashes.push({x:d.x,z:d.z,t:0});d.y=-6;d.x=(Math.random()*2-1)*WALL;d.z=1+Math.random()*27}}
    splashes.forEach(s=>s.t+=dt);splashes=splashes.filter(s=>s.t<.7);
  }
  function drawRain(){
    c.lineWidth=1;
    for(const d of drops){
      const a=P(d.x,d.y,d.z),b=P(d.x+.02,d.y-.55,d.z);
      c.strokeStyle=`rgba(200,225,255,${clamp(.5-d.z/70,.08,.5)})`;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
    }
    c.strokeStyle='rgba(200,230,255,.5)';
    for(const s of splashes){
      const p=P(s.x,FLOOR,s.z),r=s.t/.7*.18*f/s.z;c.globalAlpha=(1-s.t/.7)*.6;
      c.beginPath();c.ellipse(p[0],p[1],r,r*.25,0,0,7);c.stroke();
    }
    c.globalAlpha=1;
  }
  /* ---- sky: distant skyline, lightning, holo logo, daytime and monster attacks ---- */
  let dayOn=false,dayK=0,flashT=99,boltPts=null,nextBolt=5,shake=0,dust=[];
  try{if(localStorage.getItem('jowo.day')==='1'){dayOn=true;dayK=1}}catch(e){}
  DAYST.on=dayOn;DAYST.k=dayK;
  const mixc=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),rgb=a=>`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`;
  const BLD=[];
  {let s=11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
   for(let i=0;i<34;i++){const u=i/33*2-1;BLD.push({u:u+(rnd()-.5)*.03,w:.016+rnd()*.022,h:.05+rnd()*.1+(1-Math.abs(u))*.07,tint:rnd(),ant:rnd()<.3,seed:rnd(),hit:null,delay:0})}
   BLD.sort((a,b)=>a.u-b.u);BLD.push({u:.03,w:.052,h:.25,tint:.5,ant:true,main:true,seed:.3,hit:null,delay:0})}
  const MON={on:false,t:0,end:-999,last:-999,next:0,dur:13.5,type:'kaiju',prev:''};
  DAYST.mon=MON;
  const MONS={kaiju:p=>.5-p,mecha:p=>.5-p*.95,kraken:p=>.32-p*.64+Math.sin(p*12)*.03,flyer:p=>-.5+p};
  MON.mx=p=>MONS[MON.type](p);
  let skyClock=0;const SPAN=.36;
  function schedMonster(){MON.next=Math.max(MON.last+180+Math.random()*120,skyClock+20+Math.random()*30)}
  schedMonster();
  function startMonster(kind){
    if(MON.on)return;
    const ks=Object.keys(MONS).filter(k=>k!==MON.prev);MON.type=kind&&MONS[kind]?kind:ks[Math.floor(Math.random()*ks.length)];MON.prev=MON.type;
    if(!dayOn){flashT=0;boltPts=[[0,-.5],[.03,-.3],[-.02,-.15],[.01,-.03]]}MON.on=true;MON.t=0;MON.last=skyClock;BLD.forEach(b=>{b.hit=null});MON.ended=false;
    const a=document.querySelector('.toast');
  }
  function bFactor(b){
    if(b.hit==null)return 1;
    const t=skyClock-b.hit;
    if(MON.on||skyClock<MON.end){if(t<.9)return 1-t/.9;return 0}
    const rb=clamp((skyClock-MON.end-b.delay)/20,0,1);return rb;
  }
  function updSky(dt){
    skyClock+=dt;
    dayK=clamp(dayK+(dayOn?1:-1)*dt/1.3,0,1);DAYST.on=dayOn;DAYST.k=dayK;
    const k=dayK;
    FOGC[0]=58+(150-58)*k;FOGC[1]=15+(180-15)*k;FOGC[2]=74+(215-74)*k;
    CAM.amb=[.16+.42*k,.16+.42*k,.2+.4*k];
    CAM.lights[0].k=.9*(1-k*.85);CAM.lights[1].k=.9*(1-k*.85);CAM.lights[2].k=.5*(1-k*.6);
    if(!CAM.lights[3])CAM.lights.push({d:nz3([-.3,-1,-.4]),c:[255,250,235],k:0});
    CAM.lights[3].k=.95*k;
    /* lightning (night only) */
    if(flashT<2)flashT+=dt;
    if(!dayOn&&dayK<.2){nextBolt-=dt;if(nextBolt<=0){nextBolt=6+Math.random()*11;flashT=0;
      const bx=(Math.random()-.5)*.5,pts=[[bx,-.62]];let y=-.62,x=bx;while(y<-.02){y+=.04+Math.random()*.05;x+=(Math.random()-.5)*.06;pts.push([x,y])}boltPts=pts}}
    /* monster attack: daytime only, at most 15 s long and at most once per 3 minutes */
    if(!MON.on&&dayOn&&dayK>.9&&skyClock>=MON.next&&skyClock-MON.last>=180)startMonster();
    if(MON.on){
      MON.t+=dt;shake=Math.max(shake,0);
      const p=MON.t/MON.dur,mx=MON.mx(p);
      shake=MON.t<MON.dur-.5?3+Math.sin(MON.t*40):0;
      for(const b of BLD){if(b.hit==null&&Math.abs(b.u*SPAN-mx*1.0)<b.w*.8+.05&&(Math.sin(MON.t*3)>-.2||Math.abs(b.u*SPAN-mx)<b.w)){b.hit=skyClock;
          for(let i=0;i<16;i++)dust.push({x:b.u*SPAN+(Math.random()-.5)*b.w,y:-b.h*Math.random(),vx:(Math.random()-.5)*.05,vy:-Math.random()*.03,l:1+Math.random()*1.4,t:0})}}
      if(MON.t>=MON.dur){MON.on=false;MON.end=skyClock;MON.last=Math.min(MON.last,skyClock-MON.dur);shake=0;
        BLD.forEach(b=>{b.delay=Math.random()*10});schedMonster()}
    }
    dust.forEach(d=>{d.t+=dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=.01*dt});dust=dust.filter(d=>d.t<d.l);
    if(!MON.on&&skyClock>MON.end+31)BLD.forEach(b=>{b.hit=null});
  }
  /* every alley gets its own hologram on the distant tower */
  const LSHAPES=['octa','cube','pyramid','prism','stella','rings'],LTXT=['NJ','OBA','夜','都','電','光','雨','Ω','∞','Ụ','EJ','NEO','7','龍','星','2099','AI'];
  const LPAL=[['#19e3ff','#ff2e88'],['#3dff9a','#ffb347'],['#7c5cff','#19e3ff'],['#ffb347','#ff3a3a'],['#ff2e88','#f5efe0'],['#19e3ff','#3dff9a'],['#ffd42a','#ff2e88']];
  let LOGO=null;
  function newLogo(){const pl=LPAL[Math.floor(Math.random()*LPAL.length)];LOGO={shape:LSHAPES[Math.floor(Math.random()*LSHAPES.length)],txt:LTXT[Math.floor(Math.random()*LTXT.length)],c1:pl[0],c2:pl[1],spin:(Math.random()<.5?-1:1)*(1.1+Math.random()*1.2),tilt:.2+Math.random()*.5}}
  newLogo();
  const LG={
    octa:{V:[[1,0,0],[-1,0,0],[0,1.35,0],[0,-1.35,0],[0,0,1],[0,0,-1]],E:[[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[4,2],[4,3],[5,2],[5,3]]},
    cube:{V:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>v.map(n=>n*.85)),E:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]},
    pyramid:{V:[[-1,-.9,-1],[1,-.9,-1],[1,-.9,1],[-1,-.9,1],[0,1.6,0]],E:[[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]]},
    prism:{V:(()=>{const v=[];for(let k=0;k<6;k++){const a=k*Math.PI/3;v.push([Math.cos(a),-1.1,Math.sin(a)]);v.push([Math.cos(a),1.1,Math.sin(a)])}return v})(),E:(()=>{const e=[];for(let k=0;k<6;k++){const n=(k+1)%6;e.push([2*k,2*n],[2*k+1,2*n+1],[2*k,2*k+1])}return e})()},
    stella:{V:[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1],[-1,-1,-1],[-1,1,1],[1,-1,1],[1,1,-1]].map(v=>v.map(n=>n*.85)),E:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3],[4,5],[4,6],[4,7],[5,6],[5,7],[6,7]]},
    rings:{V:[],E:[]}
  };
  function holoLogo(x,y,r,al){
    const a=skyClock*LOGO.spin,ca=Math.cos(a),sa=Math.sin(a),ct=Math.cos(LOGO.tilt),st=Math.sin(LOGO.tilt),cy0=y-r*1.4,G=LG[LOGO.shape];
    c.save();c.globalCompositeOperation='lighter';c.globalAlpha=al;
    const g=c.createLinearGradient(0,y-r*.6,0,y+r*2.5);g.addColorStop(0,LOGO.c1+'59');g.addColorStop(1,LOGO.c1+'00');
    c.fillStyle=g;c.beginPath();c.moveTo(x-r*.3,y-r*.5);c.lineTo(x+r*.3,y-r*.5);c.lineTo(x+r*.9,y+r*2.5);c.lineTo(x-r*.9,y+r*2.5);c.fill();
    c.strokeStyle=LOGO.c1;c.shadowColor=LOGO.c1;c.shadowBlur=8;c.lineWidth=Math.max(1,r*.07);
    if(LOGO.shape==='rings'){
      for(let k=0;k<3;k++){c.beginPath();c.ellipse(x,cy0,r*1.25*Math.abs(Math.cos(a+k*1.0472)),r*1.25,k*.55-.55+Math.sin(a*.3)*.2,0,7);c.stroke()}
    }else{
      const pr=G.V.map(v=>{const X=v[0]*ca+v[2]*sa,Z=-v[0]*sa+v[2]*ca,Y=v[1]*ct-Z*st;return[x+X*r,cy0-Y*r*.9]});
      c.beginPath();G.E.forEach(e=>{c.moveTo(pr[e[0]][0],pr[e[0]][1]);c.lineTo(pr[e[1]][0],pr[e[1]][1])});c.stroke();
    }
    c.strokeStyle=LOGO.c2;c.beginPath();c.ellipse(x,cy0,r*1.45,r*.3,0,0,7);c.stroke();
    c.shadowBlur=0;c.fillStyle='#e8fbff';const L=[...LOGO.txt].length;c.font=`800 ${Math.round(r*(L>2?.55:.9))}px "Share Tech Mono","Zen Kaku Gothic New",monospace`;c.textAlign='center';c.textBaseline='middle';
    c.save();c.translate(x,cy0);c.scale(Math.max(.12,Math.abs(ca)),1);c.fillText(LOGO.txt,0,0);c.restore();
    c.restore();
  }
  function drawMonster(mx,base,hh){
    const s=H*.66,dir=-1;
    c.save();c.translate(mx,base);c.scale(dir,1);
    const ph=skyClock*4,L=(x,y)=>[x*s,y*s];
    const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>{const q=L(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])});c.closePath();c.fill()};
    const body=mixc([16,10,30],[60,70,90],dayK*.6),dk=rgb(body),lt=rgb(mixc(body,[110,100,150],.35));
    const sw=Math.sin(ph)*.04;
    poly([[-.05,-.22],[.0,-.22],[.0+sw,0],[-.07+sw,0]],dk);poly([[.02,-.22],[.08,-.22],[.1-sw,0],[.03-sw,0]],dk);
    poly([[-.14,-.3],[.12,-.3],[.15,-.55],[.08,-.68],[-.1,-.6]],dk);
    poly([[-.12,-.34],[-.42,-.1+Math.sin(ph*.5)*.03],[-.12,-.48]],dk);
    poly([[.1,-.52],[.2,-.4],[.16,-.36],[.08,-.42]],dk);
    poly([[.04,-.66],[.22,-.7],[.3,-.64],[.2,-.58],[.06,-.58]],dk);
    c.fillStyle='#ff3a2a';const e=L(.19,-.66);c.fillRect(e[0],e[1],s*.03,s*.016);
    c.globalCompositeOperation='lighter';
    [[-.1,-.62],[-.05,-.68],[.0,-.72],[.05,-.72]].forEach((q,i)=>{const a=L(q[0],q[1]);c.fillStyle=i%2?'rgba(255,46,136,.8)':'rgba(25,227,255,.8)';c.beginPath();c.moveTo(a[0]-s*.015,a[1]);c.lineTo(a[0]+s*.015,a[1]);c.lineTo(a[0],a[1]-s*.045);c.fill()});
    c.restore();
  }
  function drawMon(base){
    const p=MON.t/MON.dur,mx=cx+MON.mx(p)*H,k=dayK;
    const dark=mixc([16,10,30],[64,72,96],k*.65),dk=rgb(dark),lt=rgb(mixc(dark,[120,110,160],.4));
    const T=skyClock;
    c.save();
    if(MON.type==='kaiju'){
      drawMonster(mx,base+H*.02);
      if(Math.sin(MON.t*3)>0){const hx=mx-H*.66*.26,hy=base+H*.02-H*.66*.62;
        c.save();c.globalCompositeOperation='lighter';const g=c.createLinearGradient(hx,hy,hx-H*.25,hy+H*.12);g.addColorStop(0,'rgba(255,240,180,.95)');g.addColorStop(.4,'rgba(255,120,40,.7)');g.addColorStop(1,'rgba(255,40,20,0)');
        c.strokeStyle=g;c.lineWidth=H*.025*(.8+.4*Math.sin(MON.t*30));c.lineCap='round';c.beginPath();c.moveTo(hx,hy);c.lineTo(hx-H*.25,hy+H*.12);c.stroke();c.restore()}
    }else if(MON.type==='mecha'){
      const s=H*.7,ph=T*3,sw=Math.sin(ph);
      c.translate(mx,base+H*.02);c.scale(-1,1);
      const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x*s,y*s,w*s,h*s)};
      R(-.11+sw*.035,-.28,.09,.28,dk);R(.03-sw*.035,-.28,.09,.28,dk);R(-.13+sw*.035,-.03,.14,.03,lt);R(.01-sw*.035,-.03,.14,.03,lt);
      R(-.17,-.6,.34,.34,dk);R(-.2,-.62,.1,.12,lt);R(.1,-.62,.1,.12,lt);R(-.1,-.3,.2,.05,lt);
      [[-.2,-.58,1],[.2,-.58,-1]].forEach(([sx,sy,sg],i)=>{c.save();c.translate(sx*s,sy*s);c.rotate((i?-sw:sw)*.5*sg*-1);R(-.035,0,.07,.3,dk);R(-.045,.28,.09,.07,lt);c.restore()});
      R(-.08,-.74,.16,.13,dk);R(-.005,-.77,.01,.06,lt);
      c.globalCompositeOperation='lighter';
      R(-.05,-.5,.1,.06,'rgba(25,227,255,.9)');R(.0,-.7,.08,.035,'rgba(255,60,60,.95)');
      if(Math.sin(T*2.2)>.1){const g=c.createLinearGradient(.04*s,-.68*s,.55*s,-.05*s);g.addColorStop(0,'rgba(255,230,200,.95)');g.addColorStop(1,'rgba(255,50,40,0)');
        c.strokeStyle=g;c.lineWidth=H*.012*(.8+.4*Math.sin(T*40));c.lineCap='round';c.beginPath();c.moveTo(.04*s,-.68*s);c.lineTo(.55*s,-.05*s);c.stroke()}
    }else if(MON.type==='kraken'){
      const s=H*.9;c.translate(mx,base+H*.04);
      c.fillStyle=dk;c.strokeStyle=dk;c.lineCap='round';
      for(let i=0;i<7;i++){
        let x=(-.27+i*.09)*s,y=0,a=-Math.PI/2+(i-3)*.28+Math.sin(T*1.6+i*1.3)*.45+Math.max(0,Math.sin(T*.9+i*.8))*.5*(i<3?1:-1);
        const n=14,len=.043*s;c.beginPath();c.moveTo(x,y);const pts=[[x,y]];
        for(let sg=0;sg<n;sg++){a+=Math.sin(T*3+i+sg*.55)*.17;x+=Math.cos(a)*len;y+=Math.sin(a)*len;pts.push([x,y])}
        for(let sg=1;sg<pts.length;sg++){c.lineWidth=Math.max(2,.07*s*(1-sg/n*.8));c.beginPath();c.moveTo(pts[sg-1][0],pts[sg-1][1]);c.lineTo(pts[sg][0],pts[sg][1]);c.stroke()}
        c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,46,136,.7)';for(let sg=2;sg<n;sg+=3){c.beginPath();c.arc(pts[sg][0],pts[sg][1],Math.max(1,.008*s),0,7);c.fill()}c.restore();
      }
      c.fillStyle=dk;c.beginPath();c.ellipse(0,-.02*s,.2*s,.17*s,0,Math.PI,0);c.fill();c.fillRect(-.2*s,-.02*s,.4*s,.05*s);
      c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,220,60,.95)';[-.07,.07].forEach(ex=>{c.beginPath();c.ellipse(ex*s,-.07*s,.022*s,.03*s*(.6+.4*Math.abs(Math.sin(T*.7))),0,0,7);c.fill()});c.restore();
    }else{
      /* winged giant: flaps across the skyline and strafes it with lightning */
      const s=H*.5,fl=Math.sin(T*9),y0=base-H*.42+Math.sin(T*2)*H*.015;
      c.translate(mx,y0);
      c.fillStyle=dk;c.beginPath();c.ellipse(0,0,.13*s,.05*s,0,0,7);c.fill();c.beginPath();c.arc(.14*s,-.01*s,.04*s,0,7);c.fill();
      c.strokeStyle=dk;c.lineWidth=2;c.beginPath();c.moveTo(.16*s,-.04*s);c.lineTo(.24*s,-.12*s);c.moveTo(.15*s,-.04*s);c.lineTo(.19*s,-.14*s);c.stroke();
      c.beginPath();c.moveTo(-.12*s,0);c.lineTo(-.3*s,.03*s+Math.sin(T*4)*.02*s);c.lineTo(-.12*s,.02*s);c.fill();
      [[1,.55],[-1,1]].forEach(([dir,al])=>{
        const ang=fl*.85*dir*.9-.1;c.save();c.globalAlpha=al;c.translate(-.02*s,-.03*s);c.rotate(-ang*(dir>0?1:.6)-0.15);
        c.fillStyle=dk;c.beginPath();c.moveTo(0,0);c.lineTo(-.1*s,-.46*s);c.lineTo(-.3*s,-.34*s);c.lineTo(.12*s,-.04*s);c.closePath();c.fill();
        c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,46,136,.5)';c.beginPath();c.arc(-.13*s,-.25*s,.05*s,0,7);c.fill();c.fillStyle='rgba(25,227,255,.5)';c.beginPath();c.arc(-.06*s,-.34*s,.03*s,0,7);c.fill();
        c.restore()});
      c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,70,50,.95)';c.fillRect(.15*s,-.02*s,.025*s,.015*s);c.restore();
      if(Math.sin(MON.t*2.4)>.2){c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(220,235,255,.95)';c.shadowColor='#9ab0ff';c.shadowBlur=12;c.lineWidth=2;c.beginPath();
        let x=0,y=.04*s;c.moveTo(x,y);const dy=(base-y0)-.04*s;for(let sg=1;sg<=8;sg++){x+=(Math.random()-.5)*.05*s;y=.04*s+dy*sg/8;c.lineTo(x,y)}c.stroke();c.restore()}
    }
    c.restore();
  }
  let pendLogo=null;
  function drawSkyline(){
    pendLogo=null;
    const base=cy+H*.03,span=H*SPAN,k=dayK;
    const lit=Math.max((flashT<.08?1:flashT<.16?.15:flashT<.3?.95:flashT<.9?Math.max(0,.9*(1-(flashT-.3)/.6)):0),MON.on?.5:0)*(1-k);
    const showAmt=Math.max(.32,k,lit);   /* skyline is dim at night until lightning shows it */
    let mainTop=null;
    for(const b of BLD){
      const fac=bFactor(b),reb=b.hit!=null&&!MON.on&&skyClock>=MON.end,q=reb?Math.floor(fac*10)/10:fac;
      if(q<=0)continue;
      const x=cx+b.u*span,w=b.w*H,hh=b.h*H*q,y=base-hh;
      const nCol=mixc([13,8,24],[78,66,124],lit*.9),dCol=mixc([120,140,176],[170,190,214],b.tint);
      const col=mixc(nCol,dCol,k);
      c.globalAlpha=b.main?1:Math.max(.55*showAmt+.2,showAmt);
      c.fillStyle=rgb(col);c.fillRect(x-w/2,y,w,hh);
      if(b.main){c.fillRect(x-w*.32,y-hh*.07,w*.64,hh*.07);c.fillRect(x-w*.12,y-hh*.2,w*.24,hh*.13)}
      if(b.ant){c.fillRect(x-1,y-H*.03*(b.main?2:1),2,H*.03*(b.main?2:1));if(Math.floor(skyClock*1.3+b.seed*9)%2){c.fillStyle='#ff2a3a';c.fillRect(x-1.5,y-H*.03*(b.main?2:1)-2,3,3)}}
      /* windows */
      const rows=Math.floor(hh/(H*.012));
      for(let rr=1;rr<rows;rr++)for(let cc=0;cc<(w>H*.03?3:2);cc++){
        const hs=Math.sin((rr*7+cc*13+b.seed*97)*12.9)*.5+.5;if(hs<.5)continue;
        const wx=x-w/2+w*(.18+cc*(w>H*.03?.3:.4)),wy=y+rr*(H*.012);
        c.fillStyle=k>.5?'#cfe8ff':(hs>.85?'#ff2e88':hs>.7?'#19e3ff':'#ffb347');
        c.globalAlpha=(k>.5?.5:(.3+.6*lit))*(b.main?1:.9);c.fillRect(wx,wy,H*.005,H*.006);
      }
      if(lit>.3){c.globalAlpha=lit*.7;c.fillStyle='#cdd6ff';c.fillRect(x-w/2,y,w,1.5)}
      c.globalAlpha=1;
      if(b.main)mainTop=[x,y-(b.ant?H*.06:0),q];
    }
    /* holographic spinning logo above the tallest tower */
    if(mainTop&&mainTop[2]>.5){const rep=mainTop[2]<1?Math.random()*.6:1;pendLogo=[mainTop[0],mainTop[1]-H*.01,H*.034,.95*rep]}
    /* the monster */
    if(MON.on)drawMon(base);
    /* dust and rubble */
    dust.forEach(d=>{c.globalAlpha=Math.max(0,.55*(1-d.t/d.l));c.fillStyle=k>.5?'#b8aa98':'#3a3050';const r=H*.012*(1+d.t);c.beginPath();c.arc(cx+d.x*H,base+d.y*H,r,0,7);c.fill()});c.globalAlpha=1;
    /* lightning bolt */
    if(lit>.25&&boltPts){c.save();c.strokeStyle='rgba(235,240,255,'+lit+')';c.shadowColor='#9ab0ff';c.shadowBlur=14;c.lineWidth=2;c.beginPath();
      boltPts.forEach((p,i)=>{const X=cx+p[0]*H,Y=cy+p[1]*H;i?c.lineTo(X,Y):c.moveTo(X,Y)});c.stroke();c.restore()}
    return lit;
  }
  function frame(t){
    smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
    cx=W/2-smx*W*.1;cy=H*.44-smy*H*.05;
    if(pan){const p=pan.t/PAN,e3=u=>u*u*u,e4=u=>1-Math.pow(1-u,3);cx+=(p<.5?-pan.dir*e3(p*2):pan.dir*(1-e4((p-.5)*2)))*W*1.4}
    /* sky */
    const dk=dayK;
    if(shake){cx+=Math.sin(skyClock*47)*shake;cy+=Math.cos(skyClock*53)*shake}
    const sk=c.createLinearGradient(0,0,0,cy+H*.1);
    sk.addColorStop(0,rgb(mixc([10,6,18],[74,156,240],dk)));sk.addColorStop(.7,rgb(mixc([58,15,74],[156,203,245],dk)));sk.addColorStop(1,rgb(mixc([255,46,136],[234,246,255],dk)));
    c.fillStyle=sk;c.fillRect(0,0,W,H);
    if(dk>0){c.globalAlpha=dk;
      const sg=c.createRadialGradient(cx-H*.03,cy-H*.46,0,cx-H*.03,cy-H*.46,H*.16);sg.addColorStop(0,'rgba(255,255,230,1)');sg.addColorStop(.25,'rgba(255,245,190,.9)');sg.addColorStop(1,'rgba(255,230,150,0)');c.fillStyle=sg;c.fillRect(0,0,W,H);
      c.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<7;i++){const cxp=((skyClock*6+i*H*.31)%(H*2.2))-H*.4+cx-H*1.1,cyp=cy-H*(.2+(i*37%10)*.05),rr=H*(.05+(i%3)*.02);c.beginPath();c.ellipse(cxp,cyp,rr*1.6,rr*.5,0,0,7);c.ellipse(cxp+rr*.7,cyp-rr*.3,rr,rr*.55,0,0,7);c.fill()}
      c.globalAlpha=1}
    const gl=c.createRadialGradient(cx,cy,0,cx,cy,H*.5);gl.addColorStop(0,dk>.5?'rgba(255,255,235,.55)':'rgba(255,200,120,.55)');gl.addColorStop(1,dk>.5?'rgba(255,255,255,0)':'rgba(255,46,136,0)');
    c.fillStyle=gl;c.fillRect(0,0,W,H);
    const flashL=drawSkyline();
    /* floor */
    const fl=c.createLinearGradient(0,cy,0,H);fl.addColorStop(0,rgb(mixc([42,15,58],[122,122,150],dayK)));fl.addColorStop(1,rgb(mixc([7,3,13],[74,74,98],dayK)));
    c.fillStyle=fl;quad(P(-WALL,FLOOR,1),P(WALL,FLOOR,1),P(WALL,FLOOR,SEG*NSEG),P(-WALL,FLOOR,SEG*NSEG));c.fill();
    /* walls, far to near */
    const base=Math.floor(scroll/SEG),off=scroll-base*SEG;
    for(let k=NSEG;k>=0;k--){
      const z1=Math.max(.8,k*SEG-off),z2=(k+1)*SEG-off;if(z2<=.8)continue;
      const id=base+k;wall(-1,id,z1,z2,k*SEG-off);wall(1,id,z1,z2,k*SEG-off);if(J&&id===J.id)opening(J.side,z1);
      if((id&1)===0)lantern(id,z1+SEG*.5);
    }
    /* distance fog */
    const fg=c.createRadialGradient(cx,cy,0,cx,cy,H*.35);fg.addColorStop(0,dayK>.5?'rgba(255,255,245,.45)':'rgba(255,140,170,.5)');fg.addColorStop(1,dayK>.5?'rgba(255,255,255,0)':'rgba(255,46,136,0)');
    c.fillStyle=fg;c.fillRect(0,0,W,H);
    drawChars();if(dayK<.5)drawRain();
    if(flashL>.05){c.fillStyle='rgba(190,205,255,'+(flashL*.13)+')';c.fillRect(0,0,W,H)}
    /* foreground streaks */
    if(dayK<.5){c.strokeStyle='rgba(190,220,255,.3)';c.lineWidth=1.2;c.beginPath();
    for(const r of rain){const x=r.x*W,y=r.y*H;c.moveTo(x,y);c.lineTo(x-r.l*W*.05,y+r.l*H*1.4);
      if(!reduce){r.y+=r.s*.02;r.x-=r.s*.002;if(r.y>1){r.y=-.05;r.x=Math.random()*1.1}}}
    c.stroke()}
    /* speed lines while the viewer hurries */
    if(boost>.15){c.strokeStyle='rgba(255,200,230,'+Math.min(.28,boost*.12)+')';c.lineWidth=1.5;c.beginPath();
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2+clock*.2,r0=H*(.25+.1*((i*7)%5)/5),r1=r0+H*.35;c.moveTo(cx+Math.cos(a)*r0*1.5,cy+Math.sin(a)*r0);c.lineTo(cx+Math.cos(a)*r1*1.5,cy+Math.sin(a)*r1)}c.stroke()}
    if(dayK>.01){c.save();c.globalCompositeOperation='multiply';c.globalAlpha=dayK;c.fillStyle='rgb(160,166,186)';c.fillRect(0,0,W,H);c.restore()}
    if(pendLogo)holoLogo(pendLogo[0],pendLogo[1],pendLogo[2],pendLogo[3])
    if(pan){c.fillStyle='rgba(6,2,12,'+(Math.sin(Math.PI*pan.t/PAN)*.92)+')';c.fillRect(0,0,W,H)}
  }
  /* a side alley opens off the wall; we will turn into it */
  function opening(side,z1){
    const x=side*WALL,xb=side*(WALL+2.8),za=z1+.55,zb=z1+2.35,y0=FLOOR-2.3;
    c.fillStyle='#150a24';quad(P(x,y0,zb),P(xb,y0,zb),P(xb,FLOOR,zb),P(x,FLOOR,zb));c.fill();
    c.fillStyle='#1a0b28';quad(P(x,FLOOR,za),P(x,FLOOR,zb),P(xb,FLOOR,zb),P(xb,FLOOR,za));c.fill();
    c.fillStyle='#09040f';quad(P(x,y0,za),P(x,y0,zb),P(xb,y0,zb),P(xb,y0,za));c.fill();
    const g=c.createLinearGradient(P(x,0,zb)[0],0,P(xb,0,zb)[0],0);g.addColorStop(0,'rgba(255,60,130,.2)');g.addColorStop(1,'rgba(255,120,170,.95)');
    c.fillStyle=g;quad(P(xb,y0,za),P(xb,y0,zb),P(xb,FLOOR,zb),P(xb,FLOOR,za));c.fill();
    c.globalAlpha=.16;c.fillStyle='#ff2e88';quad(P(x,FLOOR,za),P(x,FLOOR,zb),P(side*.2,FLOOR,zb+.6),P(side*.2,FLOOR,za+.2));c.fill();c.globalAlpha=1;
    const m=P(x,y0-.15,(za+zb)/2),px=f/((za+zb)/2);
    c.fillStyle='#ffb347';c.font=`800 ${px*.28}px "Zen Kaku Gothic New","Noto Sans",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText('路地 · ALLEY',m[0],m[1]);
  }
  for(let i=0;i<4;i++)spawn(true);
  /* turning into a new alley that looks just like this one */
  function swapWorld(){
    SALT++;alleyNo++;newLogo();J=null;nextTurn=95+Math.random()*70;scroll=10+Math.random()*60;chars=[];splashes.length=0;if(!pinned)closeTerm();
    for(let i=0;i<4;i++)spawn(true);
    const t=document.querySelector('.toast');if(t){t.textContent='ALLEY '+String(alleyNo).padStart(2,'0')+' · 路地 · '+['زقاق','골목','переулок','σοκάκι','गली'][alleyNo%5];t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
  }
  /* click a person: they get angry and a little terminal shows their made-up file */
  const term=document.createElement('div');term.className='ctm';term.hidden=true;
  term.innerHTML='<div class="ch"><span class="tt"></span><button aria-label="Close">×</button></div><pre></pre>';
  document.body.appendChild(term);
  let termCh=null,termTxt='',termN=0,termSide='R',pinned=false;
  function closeTerm(){term.hidden=true;termCh=null;pinned=false;term.classList.remove('pin')}
  term.addEventListener('pointerdown',()=>{pinned=true;term.classList.add('pin')});
  term.querySelector('button').onclick=closeTerm;
  function showTerm(ch,pin){
    const p=ch.prof||(ch.prof=Lore.profile(ch));termCh=ch;pinned=!!pin;term.classList.toggle('pin',!!pin);
    termTxt='age ........ '+p.age+(p.body?'\nbody ....... '+p.body:'')+'\npassion .... '+p.passion+'\ngenre ...... '+p.genre+'\nnote ....... '+p.fact+((ch.cy||CYN.has(ch.name))?'\naugments ... '+(ch.augs||(ch.augs=rndp(AUG)+' + '+rndp(AUG))):'')+(ch.mate?'\nstatus ..... in love':'');
    {const tt=term.querySelector('.tt');tt.textContent='ID://'+p.name+' ';
      (p.codes||[]).forEach((cd,i)=>{if(!cd)return;const im=document.createElement('img');im.className='flg';im.alt=(p.flags||'').split(' ')[i]||cd;im.title=cd;im.src='https://flagcdn.com/w40/'+cd.toLowerCase()+'.png';
        im.onerror=()=>{im.replaceWith(document.createTextNode(im.alt+' '))};tt.appendChild(im)})}termN=0;term.hidden=false;placeTerm();
  }
  function placeTerm(){
    if(!termCh||!termCh.bb||term.hidden)return;
    const sx=innerWidth/W,sy=innerHeight/H,bb=termCh.bb,tw=term.offsetWidth||300;
    termSide=(bb[2]*sx+tw+24<innerWidth)?'R':'L';term.dataset.side=termSide;
    const left=termSide==='R'?bb[2]*sx+14:bb[0]*sx-14-tw;
    term.style.left=clamp(left,6,innerWidth-tw-6)+'px';term.style.top=clamp(bb[1]*sy-8,48,innerHeight-190)+'px';
  }
  function updTerm(dt){
    if(!termCh)return;termN+=dt*70;
    term.querySelector('pre').textContent=termTxt.slice(0,Math.floor(termN))+(termN<termTxt.length||Math.floor(clock*2)%2?'█':' ');
    if(termCh.dead||termCh.ent.z<1.6||!chars.includes(termCh)){
      /* a clicked terminal stays up even when its person walks off; only the X or a click elsewhere closes it */
      if(pinned){term.querySelector('pre').textContent=termTxt;termCh=null;term.classList.add('pin')}else closeTerm();
    }
  }
  document.addEventListener('pointerdown',e=>{if(term.hidden||term.contains(e.target)||e.target===cv)return;closeTerm()},true);
  const hitAt=(px,py)=>chars.filter(q=>q.vis&&q.bb&&px>=q.bb[0]&&px<=q.bb[2]&&py>=q.bb[1]&&py<=q.bb[3]).sort((a,b)=>a.ent.z-b.ent.z)[0];
  cv.addEventListener('pointerdown',e=>{
    const hit=hitAt(e.clientX*W/innerWidth,e.clientY*H/innerHeight);
    if(hit){makeIrate(hit,null,true);if(termCh===hit){pinned=true;term.classList.add('pin')}else showTerm(hit,true)}
    else{boost=Math.min(3,boost+1.2);closeTerm()}
  });
  addEventListener('pointermove',e=>{
    if(e.target!==cv)return;
    const hit=hitAt(e.clientX*W/innerWidth,e.clientY*H/innerHeight);
    cv.style.cursor=hit?'pointer':'default';
    if(pinned)return;
    if(hit){if(termCh!==hit)showTerm(hit,false)}else if(termCh)closeTerm();
  });
  const mbtn=document.getElementById('mon');let cdEnd=0;
  if(mbtn){const msync=()=>{const left=Math.ceil((cdEnd-performance.now())/1000);mbtn.disabled=left>0||MON.on;mbtn.textContent=MON.on?'\u2604 INCOMING\u2026':left>0?'\u2604 WAIT '+left+'s':'\u2604 MONSTER'};
    mbtn.addEventListener('click',()=>{if(MON.on||performance.now()<cdEnd)return;startMonster();cdEnd=performance.now()+30000;msync()});
    setInterval(msync,250);msync()}
  const dbtn=document.getElementById('day');
  if(dbtn){const sync=()=>{dbtn.textContent=dayOn?'\u263E NIGHT':'\u2600 DAY';dbtn.setAttribute('aria-pressed',dayOn?'true':'false');document.documentElement.classList.toggle('day',dayOn)};
    dbtn.addEventListener('click',()=>{dayOn=!dayOn;try{localStorage.setItem('jowo.day',dayOn?'1':'0')}catch(e){}sync();setBeach(dayOn);if(reduce){dayK=dayOn?1:0;updSky(0);frame(0);if(DAYST.map)DAYST.map()}});sync()}
  if(/[?&]debug/.test(location.search))window.__alley={couple:spawnCouple,day:v=>{dayOn=v},monster:(k)=>{dayOn=true;dayK=1;startMonster(k)},logo:()=>LOGO,newLogo:newLogo,sky:()=>({dayK,mon:MON.on,t:MON.t,last:MON.last,next:MON.next,clock:skyClock}),bolt:()=>{flashT=0;nextBolt=99;boltPts=[[0,-.5],[.03,-.3],[-.02,-.15],[.01,-.03]]},spawn:spawn,chars:()=>chars,turn:()=>{nextTurn=0},J:()=>J,pan:()=>pan,alleyNo:()=>alleyNo};
  let last=0;
  function loop(t){
    /* with windows open the alley only needs 30fps; and it lowers its own resolution if the machine struggles */
    const winOpen=Object.keys(open).length>0,gap=t-last;
    if(winOpen&&gap<30){requestAnimationFrame(loop);return}
    if(gap>0&&gap<250){ema+=(gap-ema)*.06;const tgt=winOpen?33.3:16.7;
      if(ema>tgt*1.6){if(++slowN>120&&QS>.46){QS=Math.max(.46,QS-.12);size();slowN=0;ema=tgt}}else slowN=Math.max(0,slowN-2);
      if(ema<tgt*1.15){if(++fastN>1500&&QS<.8){QS=Math.min(.8,QS+.12);size();fastN=0}}else fastN=0}
    const dt=Math.min((t-last)/1000||0,.05);last=t;
    boost=Math.max(0,boost-dt*.5);SCR=SCR0*(1+boost*2.2);window.__pace=SCR/SCR0;
    if(pan){pan.t+=dt;if(!pan.swapped&&pan.t>=PAN/2){pan.swapped=true;swapWorld()}if(pan.t>=PAN)pan=null}
    else{nextTurn-=dt;
      if(!J&&nextTurn<=0)J={id:Math.floor(scroll/SEG)+4,side:Math.random()<.5?-1:1};
      if(J){const b0=Math.floor(scroll/SEG),z=(J.id-b0)*SEG-(scroll-b0*SEG);if(z<=1.7)pan={t:0,dir:J.side,swapped:false}}}
    if(BEACH.on!==dayOn&&typeof setBeach==='function')setBeach(dayOn);
    try{scroll+=dt*SCR;updChars(dt);updSky(dt);if(dayK<.5)updRain(dt);frame(t);updTerm(dt)}catch(err){console.error('alley frame error',err)}
    if(!reduce)requestAnimationFrame(loop);
  }
  if(reduce){scroll=2;for(let i=0;i<5;i++)spawn(true);frame(0)}else requestAnimationFrame(loop);
  addEventListener('resize',()=>{if(reduce)frame(0)});
})();

/* ---------- window manager ---------- */
const apps={
  about:{jp:'我',t:'ABOUT',t2:'عني · 소개 · О себе',w:420,x:.03,y:62},
  skills:{jp:'技',t:'SKILLS',t2:'навыки · 技能 · कौशल',w:420},
  map:{jp:'地',t:'DISTRICT MAP',t2:'خريطة · 지도 · Карта',w:null,init:initMap,x:.4,y:80,w:600},
  contact:{jp:'連',t:'CONTACT',t2:'связь · 連絡 · اتصال',w:380},
  club:{jp:'踊',get t(){return BEACH.on?'PLAYA SOFIA':'CASA SOFIA'},t2:'نادي · 클럽 · клуб',frame:'nightclub.html?embed&v=20261007zb',cls:'app-win',ar:1.5}
};
const open={};let zTop=100,n=0;
function openApp(id){
  const a=apps[id];if(!a)return;
  if(open[id]){front(open[id]);return}
  const w=document.createElement('div');w.className='win '+(a.cls||'');
  w.innerHTML=`<div class="bar"><span class="jp">${a.jp}</span><span class="t">${a.t}</span><span class="t2">${a.t2||""}</span><button aria-label="Close">×</button></div><div class="body"></div>`;
  const body=w.querySelector('.body');
  if(a.frame){const ifr=document.createElement('iframe');ifr.className='frame';ifr.src=a.frame;ifr.title=a.t;ifr.loading='lazy';ifr.style.setProperty('--ar',a.ar||1.78);ifr.style.aspectRatio=String(a.ar||1.78);body.appendChild(ifr)}
  else body.appendChild(document.getElementById('t-'+id).content.cloneNode(true));
  if(a.w)w.style.width=a.w+'px';
  document.body.appendChild(w);
  const k=n++%5;
  w.style.left=clamp(innerWidth*(a.x??.08)+(a.x==null?k*34:0),8,Math.max(8,innerWidth-w.offsetWidth-8))+'px';
  w.style.top=clamp((a.y??60+k*30),48,Math.max(48,innerHeight-w.offsetHeight-90))+'px';
  open[id]=w;front(w);syncDock();
  w.addEventListener('pointerdown',()=>front(w));
  w.querySelector('button').onclick=()=>{w.classList.add('closing');setTimeout(()=>{w.remove();delete open[id];syncDock()},150)};
  drag(w,w.querySelector('.bar'));
  if(a.init)a.init(w);
}
function front(w){document.querySelectorAll('.win').forEach(x=>x.classList.remove('front'));w.style.zIndex=++zTop;w.classList.add('front')}
function syncDock(){document.querySelectorAll('.app').forEach(b=>b.classList.toggle('on',!!open[b.dataset.app]))}
function drag(w,h){
  h.addEventListener('pointerdown',e=>{
    if(e.target.tagName==='BUTTON'||innerWidth<=760)return;
    const r=w.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
    h.setPointerCapture(e.pointerId);
    const mv=ev=>{w.style.left=clamp(ev.clientX-dx,-r.width+80,innerWidth-80)+'px';w.style.top=clamp(ev.clientY-dy,40,innerHeight-100)+'px'};
    const up=()=>{h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up)};
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);
  });
}
document.querySelectorAll('.app').forEach(b=>b.addEventListener('click',()=>openApp(b.dataset.app)));
addEventListener('keydown',e=>{if(e.key==='Escape'){const ws=[...document.querySelectorAll('.win:not(.closing)')];const t=ws.sort((a,b)=>b.style.zIndex-a.style.zIndex)[0];if(t)t.querySelector('button').click()}});

/* ---------- isometric pixel district ---------- */
function initMap(win){
  const cv=win.querySelector('#map'),cap=win.querySelector('#cap');let c=cv.getContext('2d');
  const gcv=document.createElement('canvas');gcv.width=360;gcv.height=260;let gKey=-1;
  const glw=document.createElement('canvas');glw.width=glw.height=16;{const g=glw.getContext('2d'),r=g.createRadialGradient(8,8,0,8,8,8);r.addColorStop(0,'rgba(255,200,110,.15)');r.addColorStop(1,'rgba(255,200,110,0)');g.fillStyle=r;g.fillRect(0,0,16,16)}
  const TW=39,TH=19.5,OX=180,OY=66,N=9;
  const iso=(gx,gy,z=0)=>[OX+(gx-gy)*TW/2,OY+(gx+gy)*TH/2-z];
  const RD=[3,6],isRoad=(x,y)=>x===3||x===6||y===3||y===6;
  const DEC=(gx,gy,w,dd,h,col,glow,sign)=>({n:'',d:'',gx:gx,gy:gy,w:w,dd:dd,h:Math.round(h*.55),col:col,glow:glow,sign:sign||'',deco:1});
  const B=[
    {n:'Casa Sofia',d:'OPEN: a hologram DJ, a pulsing floor and a very friendly moshpit.',gx:1,gy:1,w:2,dd:2,h:49,col:'#7a1f4d',app:'club',glow:'#ff2e88',sign:'踊',club:1},
    {n:'About Tower',d:'OPEN: who I am.',gx:1,gy:4,w:1,dd:2,h:67,col:'#243a6a',app:'about',glow:'#19e3ff',sign:'我'},
    {n:'Lot 01',d:'UNDER CONSTRUCTION: a future project will go here.',gx:4.1,gy:4.1,w:.8,dd:.8,h:17,col:'#2c2440',lot:1},
    {n:'Lot 02',d:'UNDER CONSTRUCTION: a future project will go here.',gx:5.1,gy:4.1,w:.8,dd:1.75,h:23,col:'#2c2440',lot:1},
    {n:'Lot 03',d:'UNDER CONSTRUCTION: a future project will go here.',gx:4.1,gy:5.05,w:.8,dd:.8,h:14,col:'#2c2440',lot:1},
    DEC(4.15,.2,1.7,1.25,32,'#3a2a5c','#ffb347','店'),DEC(4.15,1.7,1.7,1.1,21,'#24354f','#3dff9a'),
    DEC(7.15,.2,1.7,1.5,44,'#2d2250','#ff2e88','夢'),DEC(7.15,1.85,1.7,1.0,18,'#3a2440','#19e3ff'),
    DEC(.15,4.1,.7,1.8,24,'#33264a','#ffb347'),DEC(2.1,4.1,.75,1.8,20,'#26354e','#7c5cff','宿'),
    DEC(.2,7.15,1.4,1.7,28,'#243a6a','#19e3ff','麺'),DEC(1.75,7.15,1.1,1.7,38,'#3b2455','#ffb347'),
    DEC(4.15,7.15,1.7,.8,24,'#2d2a4f','#ff2e88','酒'),DEC(4.15,8.0,1.7,.85,16,'#35303c','#3dff9a'),
    DEC(7.15,4.15,1.7,.8,36,'#2a2f55','#19e3ff'),DEC(7.15,5.05,1.7,.8,26,'#432640','#ffb347','薬'),
    DEC(7.2,7.2,1.6,1.6,52,'#1f3b55','#19e3ff','塔')
  ];
  /* traffic: cars drive both ways on every street, stop at red lights and keep a gap */
  const CCOL=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a','#e8e8f0','#ff4646'];
  const cars=[];
  RD.forEach(r=>[0,1].forEach(ax=>[0,1].forEach(dir=>[0,1].forEach(k=>cars.push({ax:ax,r:r,dir:dir?1:-1,lane:dir?.64:.36,p:k*4.6+Math.random()*1.5-.5,v:.55+Math.random()*.35,c:CCOL[(cars.length*3)%CCOL.length]})))));
  const PEDS=[];for(let i=0;i<7;i++)PEDS.push({ax:i%2,r:RD[(i>>1)%2],side:i%3?.1:.9,p:Math.random()*N,v:(.12+Math.random()*.1)*(i%2?1:-1),col:['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a','#e8e8f0'][i%6],fem:i%3===0});
  /* north-south cars (ax 0) run along y at x=r+lane; east-west cars (ax 1) run along x at y=r+lane */
  const lightGreen=(ax,ix,iy)=>{const cy=((t*.1+(ix*.7+iy*.4))%2);return ax===0?cy<.9:(cy>=1&&cy<1.9)};
  const lightCol=(ax,ix,iy)=>{const cy=((t*.1+(ix*.7+iy*.4))%2),g=ax===0?cy<.9:(cy>=1&&cy<1.9),y=ax===0?(cy>=.9&&cy<1):(cy>=1.9);return g?'#3dff9a':y?'#ffcf2a':'#ff3a3a'};
  function updCars(){
    cars.forEach(k=>{
      const step=k.dir*k.v*.016*.9;let np=k.p+step;
      RD.forEach(cr=>{ /* intersections along this street are at the other street's coordinates */
        const ix=k.ax===0?k.r:cr,iy=k.ax===0?cr:k.r;
        if(k.dir>0){const sl=cr-.15;if(k.p<sl&&np>=sl&&!lightGreen(k.ax,ix,iy))np=sl}
        else{const sl=cr+1.15;if(k.p>sl&&np<=sl&&!lightGreen(k.ax,ix,iy))np=sl}
      });
      for(let j=0;j<cars.length;j++){const o=cars[j];if(o===k||o.ax!==k.ax||o.r!==k.r||o.dir!==k.dir)continue;const d=(o.p-k.p)*k.dir;if(d>0&&d<.5&&(k.p+step-k.p)*k.dir>0){np=k.p;break}}
      k.p=np;if(k.p>N+.8)k.p=-.8;if(k.p<-.8)k.p=N+.8;
    });
    PEDS.forEach(q=>{q.p+=q.v*.016;if(q.p>N+.5)q.p=-.5;if(q.p<-.5)q.p=N+.5});
  }
  let hover=null,t=0;
  const poly=(pts,fill,stroke)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}};
  const shade=(hex,k)=>{k*=1+DAYST.k*.8;const v=parseInt(hex.slice(1),16);const r=clamp((v>>16)*k,0,255)|0,g=clamp(((v>>8)&255)*k,0,255)|0,b=clamp((v&255)*k,0,255)|0;return`rgb(${r},${g},${b})`};
  function shapes(b){
    const x0=b.gx,y0=b.gy,x1=b.gx+b.w,y1=b.gy+b.dd,h=b.h;
    return{top:[iso(x0,y0,h),iso(x1,y0,h),iso(x1,y1,h),iso(x0,y1,h)],
      left:[iso(x0,y1,h),iso(x1,y1,h),iso(x1,y1,0),iso(x0,y1,0)],
      right:[iso(x1,y0,h),iso(x1,y1,h),iso(x1,y1,0),iso(x1,y0,0)]};
  }
  function inPoly(p,pts){let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])ins=!ins}return ins}
  const DPAL=[[255,46,136],[25,227,255],[255,179,71],[124,92,255],[61,255,154],[255,70,70]];
  function doorCol(){const ms=performance.now(),i=Math.floor(ms/3000),k=Math.min(1,(ms%3000)/300),a=DPAL[i%6],b=DPAL[(i+5)%6];return[b[0]+(a[0]-b[0])*k,b[1]+(a[1]-b[1])*k,b[2]+(a[2]-b[2])*k]}
  /* people shown out of the club: some walk out alone, some are thrown out by a bouncer who walks them out and goes back in */
  const outs=[];let outT=4;if(/[?&]debug/.test(location.search))window.__outs=outs;
  const PCOL=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a','#e8e8f0'];
  function actorPos(a){
    const t=a.t,d=a.dir,r=[];
    const lerp=(p,q,u)=>p+(q-p)*Math.max(0,Math.min(1,u));
    if(a.kind==='walk'){
      const al=Math.min(1,t/.35);let gx,gy;
      if(t<1.3){gx=lerp(3,3.55,t/1.3);gy=2+.04*Math.sin(t*5)}else{gx=3.55+.04*Math.sin(t*2);gy=2+d*(t-1.3)*.55}
      const fade=gy<.5||gy>6.4?Math.max(0,1-Math.abs(d>0?gy-6.4:.5-gy)/.5*0+(d>0?(gy-6.4):(.5-gy))*-2):1;
      r.push({gx:gx,gy:gy,fem:a.fem,col:a.col,al:Math.min(al,fade),bob:Math.sin(t*8)});
    }else{
      const al=Math.min(1,t/.35);
      /* bouncer and patron emerge together */
      let px,py,bx,by,lie=false,hop=0,mad=false,say=null;
      if(t<1.6){px=lerp(3,3.5,t/1.6);py=2.07;bx=px;by=1.93}
      else{
        bx=3.5;by=1.93;
        const s=(t-1.6)/.45;
        px=lerp(3.5,3.95,s);py=2.1;if(s>0&&s<1)hop=Math.sin(Math.PI*s)*5;
        if(t>=1.6&&t<3.2)say='OUT!';
        if(t>=2.05&&t<3.0)lie=true;
        if(t>=3.0)mad=true;
        if(t>=3.0){px=3.95+.1*Math.min(1,(t-3)/.5);py=2.1+d*(t-3)*.6}
        if(t>=2.3){const u=(t-2.3)/1.5;bx=lerp(3.5,3.02,u);by=lerp(1.93,2.0,u)}
      }
      const ba=(t>3.7)?Math.max(0,1-(t-3.7)/.3):al;
      r.push({gx:px,gy:py,fem:a.fem,col:a.col,al:al*(py>6.4||py<.5?.4:1),hop:hop,lie:lie,mad:mad,say:say,bob:Math.sin(t*8)});
      r.push({gx:bx,gy:by,bouncer:true,al:ba});
    }
    return r;
  }
  function updOuts(){
    outT-=.016;
    if(outT<=0){outT=8+Math.random()*9;if(outs.length<2&&BEACH.p<.35)outs.push({kind:Math.random()<.5?'walk':'thrown',t:0,dir:Math.random()<.5?-1:1,fem:Math.random()<.4,col:PCOL[Math.floor(Math.random()*PCOL.length)]})}
    for(let i=outs.length-1;i>=0;i--){const a=outs[i];a.t+=.016;if(a.t>(a.kind==='walk'?12:11))outs.splice(i,1)}
  }
  const hx=h=>{const v=parseInt(h.slice(1),16);return[v>>16,(v>>8)&255,v&255]},mx=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),rg=a=>`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`;
  /* daytime extras: drifting clouds (with soft ground shadows) and delivery drones crossing the district */
  const clouds=[],drones=[];let cloudT=1,droneT=4;
  function updFx(){
    const k=DAYST.k;
    if(k>.5){
      cloudT-=.016;if(cloudT<=0){cloudT=5+Math.random()*7;if(clouds.length<4){const sc=.8+Math.random()*.9;clouds.push({x:-70*sc,y:10+Math.random()*210,s:7+Math.random()*9,sc:sc})}}
      droneT-=.016;if(droneT<=0){droneT=7+Math.random()*9;if(drones.length<2){const g0=.3+Math.random()*5.4,fw=Math.random()<.5;drones.push({u:0,dur:9+Math.random()*5,fw:fw,g0:g0,g1:g0+(Math.random()*3-1.5),z:30+Math.random()*16,box:Math.random()<.5,ph:Math.random()*6})}}
    }
    for(let i=clouds.length-1;i>=0;i--){clouds[i].x+=clouds[i].s*.016;if(clouds[i].x>440)clouds.splice(i,1)}
    for(let i=drones.length-1;i>=0;i--){drones[i].u+=.016/drones[i].dur;if(drones[i].u>1)drones.splice(i,1)}
  }
  const PUF=[[0,0,9],[11,-5,11],[23,0,9],[12,4,8],[-8,3,6],[32,3,6]];
  function drawFx(){
    const k=DAYST.k;if(k<.02)return;
    /* cloud shadows on the ground, then the clouds */
    c.save();
    clouds.forEach(o=>{c.globalAlpha=k*.16;c.fillStyle='#000';PUF.forEach(q=>{c.beginPath();c.ellipse(o.x+(q[0]+8)*o.sc,o.y+(q[1]*.5+34)*o.sc,q[2]*o.sc,q[2]*.55*o.sc,0,0,7);c.fill()})});
    drones.forEach(d=>{const gx=d.fw?-1+(N+2)*d.u:N+1-(N+2)*d.u,gy=d.g0+(d.g1-d.g0)*d.u,sp=iso(gx,gy,0);
      c.globalAlpha=k*.22;c.fillStyle='#000';c.beginPath();c.ellipse(sp[0],sp[1],5,2,0,0,7);c.fill()});
    drones.forEach(d=>{const gx=d.fw?-1+(N+2)*d.u:N+1-(N+2)*d.u,gy=d.g0+(d.g1-d.g0)*d.u,p=iso(gx,gy,d.z+Math.sin(t*3+d.ph)*1.5),x=p[0],y=p[1],spin=Math.floor(t*30+d.ph)%2;
      c.save();c.translate(x,y);c.scale(1.7,1.7);c.translate(-x,-y);c.globalAlpha=k;
      c.strokeStyle='#1c2030';c.lineWidth=1;c.beginPath();c.moveTo(x-5,y-1);c.lineTo(x+5,y-1);c.stroke();
      c.fillStyle='#2a2f3d';c.fillRect(x-2,y-2,4,3);c.fillStyle='#19e3ff';c.fillRect(x-1,y,2,1);
      c.fillStyle='#dfe6f5';[-5,5].forEach(o=>{c.globalAlpha=k*(spin?.85:.4);c.fillRect(x+o-2,y-3,4,1)});c.globalAlpha=k;
      c.fillStyle=Math.floor(t*3+d.ph)%2?'#ff3a3a':'#3dff9a';c.fillRect(d.fw?x+2:x-3,y-2,1,1);
      if(d.box){c.strokeStyle='#5a4a3a';c.beginPath();c.moveTo(x,y+1);c.lineTo(x,y+3);c.stroke();c.fillStyle='#c89a5a';c.fillRect(x-2,y+3,4,3);c.fillStyle='#8a6a3a';c.fillRect(x-2,y+4,4,1)}c.restore()});
    clouds.forEach(o=>{c.globalAlpha=k*.93;c.fillStyle='#fff';PUF.forEach(q=>{c.beginPath();c.arc(o.x+q[0]*o.sc,o.y+q[1]*o.sc,q[2]*o.sc,0,7);c.fill()});
      c.globalAlpha=k*.35;c.fillStyle='#b5c3dd';PUF.forEach(q=>{c.beginPath();c.ellipse(o.x+q[0]*o.sc,o.y+(q[1]+q[2]*.55)*o.sc,q[2]*.85*o.sc,q[2]*.35*o.sc,0,0,7);c.fill()})});
    c.restore();c.globalAlpha=1;
  }
  /* ---------- streets: pavements, crosswalks, lane markings, traffic lights, lamps and trees ---------- */
  const SEG=[[0,3],[4,6],[7,9]];
  function ground(dk){
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const road=isRoad(x,y);
      poly([iso(x,y),iso(x+1,y),iso(x+1,y+1),iso(x,y+1)],rg(mx(road?[24,19,42]:((x+y)&1?[23,16,39]:[29,21,48]),road?[88,92,112]:((x+y)&1?[136,142,160]:[146,152,170]),dk)),null);
    }
    const pv=rg(mx([52,44,76],[178,180,194],dk)),cb=rg(mx([8,5,16],[96,98,112],dk));
    const band=(x0,y0,x1,y1)=>{poly([iso(x0,y0),iso(x1,y0),iso(x1,y1),iso(x0,y1)],pv,null)};
    RD.forEach(r=>SEG.forEach(sg=>{band(r,sg[0],r+.25,sg[1]);band(r+.75,sg[0],r+1,sg[1]);band(sg[0],r,sg[1],r+.25);band(sg[0],r+.75,sg[1],r+1)}));
    RD.forEach(rx=>RD.forEach(ry=>{[[0,0],[.75,0],[0,.75],[.75,.75]].forEach(o=>band(rx+o[0],ry+o[1],rx+o[0]+.25,ry+o[1]+.25))}));
    /* curb lines */
    c.strokeStyle=cb;c.lineWidth=1;c.beginPath();
    RD.forEach(r=>SEG.forEach(sg=>{[r+.25,r+.75].forEach(q=>{let a=iso(q,sg[0]),b=iso(q,sg[1]);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);a=iso(sg[0],q);b=iso(sg[1],q);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])})}));
    c.stroke();
    /* lane dashes (not through the junctions) */
    c.fillStyle=rg(mx([255,179,71],[240,226,150],dk));
    RD.forEach(r=>{for(let i=0;i<N;i++){if(i===3||i===6)continue;const a=iso(r+.5,i+.45),b=iso(i+.45,r+.5);c.fillRect(a[0]-1,a[1]-1,2,1);c.fillRect(b[0]-1,b[1]-1,2,1)}});
    /* zebra crossings on every approach */
    c.fillStyle='rgba(235,235,245,'+(.7-.2*dk)+')';
    RD.forEach(rx=>RD.forEach(ry=>{
      [[ry-.34,ry-.1],[ry+1.1,ry+1.34]].forEach(yy=>{for(let k=0;k<5;k++){const xa=rx+.3+k*.09;poly([iso(xa,yy[0]),iso(xa+.05,yy[0]),iso(xa+.05,yy[1]),iso(xa,yy[1])],c.fillStyle,null)}});
      [[rx-.34,rx-.1],[rx+1.1,rx+1.34]].forEach(xx=>{for(let k=0;k<5;k++){const ya=ry+.3+k*.09;poly([iso(xx[0],ya),iso(xx[1],ya),iso(xx[1],ya+.05),iso(xx[0],ya+.05)],c.fillStyle,null)}});
    }));
  }
  function drawCars(){
    cars.forEach(k=>{const gx=k.ax===0?k.r+k.lane:k.p,gy=k.ax===0?k.p:k.r+k.lane,p=iso(gx,gy);
      c.fillStyle='#000';c.fillRect(p[0]-3,p[1]-1,7,3);c.fillStyle=k.c;c.fillRect(p[0]-3,p[1]-3,6,3);c.fillStyle='#d8f4ff';c.fillRect(p[0]+(k.dir>0?1:-2),p[1]-3,2,1);
      if(DAYST.k<.6){c.fillStyle='#fff6c8';c.fillRect(p[0]+(k.dir>0?3:-3),p[1]-2,1,1)}})
  }
  function drawPeds(){
    PEDS.forEach(q=>{const gx=q.ax===0?q.r+q.side:q.p,gy=q.ax===0?q.p:q.r+q.side,s0=iso(gx,gy),x=s0[0],y=s0[1],bob=Math.sin(t*7+q.p*9)*.5;
      c.fillStyle='#07040d';c.fillRect(x-1,y-1,3,1);c.fillStyle=q.col;c.fillRect(x-1,y-4,2,3);if(q.fem)c.fillRect(x-2,y-2,4,1);c.fillStyle='#f0c9a5';c.fillRect(x-1,y-6+bob,2,2)});
  }
  const LAMPK=[.7,2.7,4.5,5.5,7.5,8.5],TREES=[[3.88,.7],[3.12,5.5],[6.12,1.3],[6.88,7.6],[3.88,8.5],[1.5,3.12],[5.5,3.88],[7.6,6.12],[2.4,6.88],[8.4,3.12]];
  function drawStreetFurniture(dk){
    /* trees */
    TREES.forEach(q=>{const p=iso(q[0],q[1]);c.fillStyle='#3a2a1e';c.fillRect(p[0],p[1]-4,1,4);
      c.fillStyle=rg(mx([22,70,48],[60,150,70],dk));[[0,-8,3],[-2,-6,2.5],[2,-6,2.5]].forEach(o=>{c.beginPath();c.arc(p[0]+o[0]+.5,p[1]+o[1],o[2],0,7);c.fill()})});
    /* lamps */
    const lamps=[];RD.forEach(r=>[.1,.9].forEach(sd=>LAMPK.forEach(k=>{if(r===3&&sd===.1&&k>2&&k<3)return;lamps.push(iso(r+sd,k));lamps.push(iso(k,r+sd))})));
    lamps.forEach(p=>{c.fillStyle='#14101e';c.fillRect(p[0],p[1]-10,1,10);c.fillRect(p[0]-1,p[1]-11,3,1);
      if(dk<.7){c.fillStyle='#ffe9a8';c.globalAlpha=1-dk;c.fillRect(p[0],p[1]-10,1,1);c.globalAlpha=1}});
    c.save();c.globalCompositeOperation='lighter';
    if(dk<.7){c.globalAlpha=1-dk;lamps.forEach(p=>c.drawImage(glw,p[0]-8,p[1]-8));c.globalAlpha=1}
    c.restore();
    /* traffic lights at every corner */
    RD.forEach(rx=>RD.forEach(ry=>{
      [[.1,.1,0],[.9,.9,0],[.9,.1,1],[.1,.9,1]].forEach(o=>{const p=iso(rx+o[0],ry+o[1]),col=lightCol(o[2],rx,ry);
        c.fillStyle='#0c0a14';c.fillRect(p[0],p[1]-9,1,9);c.fillRect(p[0]-1,p[1]-12,3,3);c.fillStyle=col;c.fillRect(p[0],p[1]-11,1,1);
        c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.35;c.beginPath();c.arc(p[0]+.5,p[1]-10.5,3.5,0,7);c.fill();c.restore()})
    }));
    /* a manhole breathing steam */
    const m=iso(6.4,2.5);c.fillStyle='#050308';c.fillRect(m[0]-2,m[1]-1,4,2);
    for(let i=0;i<5;i++){const u=((t*.35+i*.2)%1);c.globalAlpha=(1-u)*.28*(1-dk*.5);c.fillStyle='#d9d4ea';c.beginPath();c.arc(m[0]+Math.sin(t+i*2)*3*u,m[1]-2-u*14,1.5+u*3.5,0,7);c.fill()}c.globalAlpha=1;
  }
  /* ---------- Playa Sofia: the club crumbles away and a beach grows in its place ---------- */
  const debris=[],dust=[];
  const bsh=(hex,k)=>{const v=hx(hex);return rg(v.map(q=>clamp(q*k,0,255)))};
  const circ=(cx,cy,r,z,n=18)=>{const a=[];for(let i=0;i<n;i++)a.push(iso(cx+Math.cos(i/n*6.2832)*r,cy+Math.sin(i/n*6.2832)*r,z));return a};
  function spawnDebris(b,fh,p){
    for(let i=0;i<3&&debris.length<150;i++){const gx=b.gx+Math.random()*b.w,gy=b.gy+b.dd*(Math.random()<.6?1:Math.random()),z=Math.random()*fh,s0=iso(gx,gy,z),g0=iso(gx,gy,0);
      debris.push({x:s0[0],y:s0[1],vx:(Math.random()-.5)*.9,vy:-Math.random()*.4,gy:g0[1],sz:1+Math.random()*2.2,col:Math.random()<.2?(b.glow||'#ffb347'):shade(b.col,.5+Math.random()*.8),a:1,land:false})}
    if(Math.random()<.5&&dust.length<30){const g0=iso(b.gx+Math.random()*b.w,b.gy+Math.random()*b.dd,0);dust.push({x:g0[0],y:g0[1],r:3,a:.4})}
  }
  function updDebris(){
    for(let i=debris.length-1;i>=0;i--){const d=debris[i];d.vy+=.13;d.x+=d.vx;d.y+=d.vy;if(d.y>=d.gy){d.y=d.gy;d.vy=0;d.vx*=.4;d.land=true}if(d.land){d.a-=.012;if(d.a<=0)debris.splice(i,1)}}
    for(let i=dust.length-1;i>=0;i--){const d=dust[i];d.r+=.2;d.y-=.25;d.a-=.007;if(d.a<=0)dust.splice(i,1)}
  }
  function drawDebris(dk){
    dust.forEach(d=>{c.globalAlpha=d.a;c.fillStyle=rg(mx([150,140,165],[200,196,210],dk));c.beginPath();c.arc(d.x,d.y,d.r,0,7);c.fill()});
    debris.forEach(d=>{c.globalAlpha=d.a;c.fillStyle=d.col;c.fillRect(d.x,d.y-d.sz,d.sz,d.sz)});c.globalAlpha=1;
  }
  const BDANCE=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a','#e8e8f0'];
  function palm(gx,gy,hh,sw,lt){
    const b=iso(gx,gy),sway=Math.sin(t*1.3+gx*3)*sw;
    c.strokeStyle=bsh('#7a5230',lt);c.lineWidth=2;c.beginPath();c.moveTo(b[0],b[1]);c.quadraticCurveTo(b[0]+3+sway*.4,b[1]-hh*.55,b[0]+sway+5,b[1]-hh);c.stroke();
    const tx=b[0]+sway+5,ty=b[1]-hh;
    for(let i=0;i<7;i++){const a=-Math.PI*.95+i*Math.PI*.95/3.2,l=11+((i*7)%3)*2,dx=Math.cos(a)*l,dy=Math.sin(a)*l*.55+Math.abs(Math.cos(a))*4+Math.sin(t*2+i)*.8;
      c.strokeStyle=bsh(i%2?'#2f9e44':'#43b95a',lt);c.lineWidth=1.6;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(tx+dx*.5,ty+dy*.2-3,tx+dx,ty+dy);c.stroke()}
    c.fillStyle=bsh('#5a3a1e',lt);c.fillRect(tx-1,ty+1,2,2);c.fillRect(tx+1,ty+1,2,2);
  }
  function umbrella(gx,gy,c1,c2,lt){
    const b=iso(gx,gy);
    poly([iso(gx-.3,gy-.14),iso(gx+.3,gy-.14),iso(gx+.3,gy+.14),iso(gx-.3,gy+.14)],bsh('#f3e9d0',lt),null);poly([iso(gx-.25,gy-.1),iso(gx+.25,gy-.1),iso(gx+.25,gy+.1),iso(gx-.25,gy+.1)],bsh(c1,lt*.9),null);
    c.strokeStyle=bsh('#d8d0c0',lt);c.lineWidth=1;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(b[0],b[1]-11);c.stroke();
    for(let i=0;i<6;i++){const a0=Math.PI+i*Math.PI/6,a1=Math.PI+(i+1)*Math.PI/6;c.fillStyle=bsh(i%2?c1:c2,lt);c.beginPath();c.moveTo(b[0],b[1]-12);c.arc(b[0],b[1]-8,7,a0,a1);c.closePath();c.fill()}
  }
  function drawBeach(dk,p){
    const lt=.62+.38*dk;
    c.save();c.globalAlpha=p;
    /* sand with the sea along the back edge */
    poly([iso(.08,.08),iso(2.97,.08),iso(2.97,2.97),iso(.08,2.97)],bsh('#e9d094',lt),null);
    for(let i=0;i<9;i++){const q=iso(.3+((i*37)%25)/10,1.3+((i*53)%16)/10);c.fillStyle=bsh('#d2b878',lt);c.fillRect(q[0],q[1],2,1)}
    const sea=[iso(.08,.08),iso(2.97,.08),iso(2.97,1.0),iso(.08,1.0)],g=c.createLinearGradient(iso(0,0)[0],iso(0,0)[1],iso(3,1.1)[0],iso(3,1.1)[1]);
    g.addColorStop(0,bsh('#1f6fb5',lt));g.addColorStop(1,bsh('#35b9dc',lt));poly(sea,null,null);c.fillStyle=g;c.fill();
    poly([iso(.08,1.0),iso(2.97,1.0),iso(2.97,1.14),iso(.08,1.14)],bsh('#c7ad72',lt),null);
    c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=1;
    for(let i=0;i<7;i++){const u=(t*.22+i*.31)%1,gx=.15+u*2.6,gy=.2+i*.115,a=iso(gx,gy),b=iso(gx+.22,gy);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
    c.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<14;i++){const q=iso(.15+i*.2,1.02+Math.sin(t*1.4+i)*.03);c.fillRect(q[0],q[1],2,1)}
    c.fillStyle='#fff';for(let i=0;i<6;i++){if(Math.floor(t*3+i*5)%4===0){const q=iso(.3+((i*41)%24)/10,.25+((i*23)%7)/10);c.fillRect(q[0],q[1],1,1)}}
    /* rocks with a waterfall into a little pool */
    const rb=iso(.3,.2),rk=[[.3,.15,.5,.45,16],[.55,.3,.4,.35,11]];
    rk.forEach(r=>{const bx={gx:r[0],gy:r[1],w:r[2],dd:r[3],h:r[4]},s=shapes(bx);poly(s.left,bsh('#7d7a86',lt*.8),'#000');poly(s.right,bsh('#6a6773',lt*.6),'#000');poly(s.top,bsh('#9a97a3',lt),'#000')});
    for(let i=0;i<6;i++){const u=((t*1.6+i*.17)%1),q=iso(.6,.65,14-u*14);c.fillStyle='rgba(205,240,255,'+(.85-u*.3)+')';c.fillRect(q[0]-1+i%2,q[1],1.5,3)}
    poly(circ(.65,.92,.2,0,12),bsh('#38bfe6',lt),null);
    /* the round fountain basin with beating jets */
    const fx=2.0,fy=1.95;poly(circ(fx,fy,.5,0,20),bsh('#bdb09a',lt),'#000');poly(circ(fx,fy,.4,0,20),bsh('#33c0e8',lt),null);
    c.strokeStyle='rgba(255,255,255,.7)';for(let i=0;i<3;i++){const u=((t*.5+i*.33)%1);const pts=circ(fx,fy,.08+u*.3,0,14);c.globalAlpha=p*(1-u);c.beginPath();pts.forEach((q,j)=>j?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.stroke()}
    c.globalAlpha=p;const k=Math.abs(Math.sin(t*2.4));
    const top=iso(fx,fy,9+k*5);c.strokeStyle='rgba(215,245,255,.9)';c.lineWidth=1.3;const f0=iso(fx,fy);c.beginPath();c.moveTo(f0[0],f0[1]);c.lineTo(top[0],top[1]);c.stroke();
    for(let j=0;j<6;j++){const a=j/6*6.2832+t*.3,u=((t*1.3+j*.17)%1),q=iso(fx+Math.cos(a)*(.05+u*.28),fy+Math.sin(a)*(.05+u*.28),(9+k*5)*Math.sin(u*Math.PI)*.8);c.fillStyle='rgba(225,248,255,'+(1-u*.5)+')';c.fillRect(q[0],q[1],1.5,1.5)}
    /* palms, umbrellas, a tiki hut and the same dancers on the sand */
    c.restore();
  }
  function drawBeachProps(dk,p){
    const lt=.62+.38*dk;c.save();c.globalAlpha=p;
    umbrella(1.05,2.45,'#ff2e88','#fff',lt);umbrella(2.7,2.6,'#19e3ff','#fff',lt);umbrella(.5,1.7,'#ffb347','#fff',lt);
    const hs={gx:.3,gy:2.25,w:.5,dd:.5,h:9},s=shapes(hs);poly(s.left,bsh('#8a6038',lt),'#000');poly(s.right,bsh('#6b4828',lt),'#000');
    const r0=iso(.3,2.25,16),r1=iso(.8,2.25,16),r2=iso(.8,2.75,16),r3=iso(.3,2.75,16),ap=iso(.55,2.5,22);
    poly([iso(.3,2.75,9),iso(.8,2.75,9),ap],bsh('#d9b45a',lt),'#000');poly([iso(.8,2.75,9),iso(.8,2.25,9),ap],bsh('#b8943f',lt),'#000');
    const dp=[[1.3,2.3],[1.55,2.55],[2.35,2.4],[2.55,2.15],[1.8,2.75]];
    dp.forEach((q,i)=>{const s0=iso(q[0],q[1]),hop=Math.abs(Math.sin(t*5+i*1.7))*(DAYST.k>.5?2:3),x=s0[0],y=s0[1]-hop;
      c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x-1,s0[1],3,1);c.fillStyle=BDANCE[i%6];c.fillRect(x-1,y-4,2,3);if(i%2)c.fillRect(x-2,y-2,4,1);c.fillStyle='#f0c9a5';c.fillRect(x-1,y-6,2,2);
      c.fillRect(x-2,y-5-(Math.sin(t*5+i)>0?1:0),1,1);c.fillRect(x+1,y-5-(Math.sin(t*5+i)>0?0:1),1,1)});
    palm(.5,1.4,22,2.5,lt);palm(2.7,1.5,26,3,lt);palm(2.75,2.85,20,2.2,lt);palm(1.5,2.9,17,2,lt);
    c.restore();
  }
  /* ---------- monster rampage: the alley's monster also crosses the district map ---------- */
  const ROUTES={kaiju:[[-1.3,3.5],[3.5,3.5],[3.5,6.5],[6.5,6.5],[6.5,10]],mecha:[[10.2,6.5],[6.5,6.5],[6.5,3.5],[3.5,3.5],[3.5,-1]],kraken:[[3.5,3.5],[6.5,3.5]],flyer:[[-1.2,-.4],[10.2,9.6]]};
  const REACH={kaiju:1.0,mecha:1.1,kraken:1.7,flyer:0};
  const mm={on:false,type:'kaiju',gx:0,gy:0,fx:1,strike:0,bolts:[],proxy:{mon:1,gx:0,gy:0,w:0,dd:0},bannerT:0};
  function routePos(path,p){
    let tot=0;const segs=[];for(let i=1;i<path.length;i++){const l=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);segs.push(l);tot+=l}
    let d=Math.max(0,Math.min(1,p))*tot;
    for(let i=0;i<segs.length;i++){if(d<=segs[i]||i===segs.length-1){const u=segs[i]?d/segs[i]:0,a=path[i],b=path[i+1];return{gx:a[0]+(b[0]-a[0])*u,gy:a[1]+(b[1]-a[1])*u,dx:b[0]-a[0],dy:b[1]-a[1]}}d-=segs[i]}
  }
  function hitBuilding(b,power,fireP){
    if(b.club&&BEACH.p>.01)return;
    b.dmg=Math.min(1,(b.dmg||0)+power);b.hitT=t;
    if(!b.chunks)b.chunks=[];
    if(b.chunks.length<4&&Math.random()<.8)b.chunks.push({side:Math.random()<.5?0:1,u:.08+Math.random()*.55,w:.25+Math.random()*.2,z:.15+Math.random()*.6,h:7+Math.random()*9});
    if(Math.random()<fireP)b.burn=1;
    spawnDebris(b,Math.max(4,b.h*(1-b.dmg*.6)),0);
  }
  function updMon(){
    const m=DAYST.mon,on=!!(m&&m.on);
    if(on){
      const rp=routePos(ROUTES[m.type]||ROUTES.kaiju,m.t/m.dur);
      mm.on=true;mm.type=m.type;mm.gx=rp.gx;mm.gy=rp.gy;mm.fx=(rp.dx-rp.dy)>=0?1:-1;
      mm.proxy.gx=mm.gx;mm.proxy.gy=mm.gy;mm.proxy.w=mm.type==='flyer'?4:1.4;mm.proxy.dd=mm.type==='flyer'?0:1.4;
      if(mm.type!=='flyer'){
        B.forEach(b=>{const d=Math.hypot(b.gx+b.w/2-mm.gx,b.gy+b.dd/2-mm.gy),r=REACH[mm.type]+Math.max(b.w,b.dd)*.5;
          if(d<r&&(!b.hitT||t-b.hitT>.55))hitBuilding(b,mm.type==='kraken'?.2:.16,mm.type==='mecha'?.8:mm.type==='kaiju'?.55:.15)});
      }else{
        mm.strike-=.016;
        if(mm.strike<=0){mm.strike=.5+Math.random()*.35;const near=B.filter(b=>Math.hypot(b.gx+b.w/2-mm.gx,b.gy+b.dd/2-mm.gy)<2.4);
          if(near.length){const b=near[Math.floor(Math.random()*near.length)];hitBuilding(b,.2,1);mm.bolts.push({b:b,t:0})}}
      }
    }else mm.on=false;
    for(let i=mm.bolts.length-1;i>=0;i--){mm.bolts[i].t+=.016;if(mm.bolts[i].t>.22)mm.bolts.splice(i,1)}
    /* afterwards the fires die down and the city rebuilds itself over about 30 seconds */
    if(!on)B.forEach(b=>{if(b.dmg>0){b.dmg=Math.max(0,b.dmg-.016/28);if(b.dmg<.12)b.chunks=null}if(b.burn>0)b.burn=Math.max(0,b.burn-.016/9)});
    else B.forEach(b=>{if(b.burn>0&&b.burn<1&&b.hitT&&t-b.hitT>1)b.burn=Math.max(.5,b.burn)});
  }
  function flame(x,y,sz,seed){
    const fl=Math.sin(t*13+seed*2.3)*.25+Math.sin(t*7+seed)*.15;
    c.fillStyle='rgba(255,120,30,.85)';c.beginPath();c.moveTo(x-sz*.45,y);c.quadraticCurveTo(x-sz*.5,y-sz*.7,x+fl*sz,y-sz*(1.5+fl));c.quadraticCurveTo(x+sz*.5,y-sz*.7,x+sz*.45,y);c.closePath();c.fill();
    c.fillStyle='rgba(255,225,90,.95)';c.beginPath();c.moveTo(x-sz*.22,y);c.quadraticCurveTo(x-sz*.25,y-sz*.5,x+fl*sz*.6,y-sz*.95);c.quadraticCurveTo(x+sz*.25,y-sz*.5,x+sz*.22,y);c.closePath();c.fill();
  }
  function drawDamage(b,s,lift){
    const dm=b.dmg||0;
    (b.chunks||[]).forEach((ch,i)=>{
      const z0=ch.z*b.h,z1=z0+ch.h;let q;
      if(ch.side===0){const x=b.gx+b.w,g0=b.gy+ch.u*b.dd,g1=g0+ch.w*b.dd;q=[iso(x,g0,z1),iso(x,g1,z1+2),iso(x,g1+.04,z0),iso(x,g0,z0-1)]}
      else{const y=b.gy+b.dd,g0=b.gx+ch.u*b.w,g1=g0+ch.w*b.w;q=[iso(g0,y,z1),iso(g1,y,z1+2),iso(g1+.04,y,z0),iso(g0,y,z0-1)]}
      q=q.map(p=>[p[0],p[1]+lift]);
      poly(q,'#06030c','#000');
      if((b.burn||0)>.15){c.save();c.globalCompositeOperation='lighter';poly(q.map((p,k)=>[(p[0]+(q[0][0]+q[2][0])/2)/2,(p[1]+(q[0][1]+q[2][1])/2)/2]),'rgba(255,110,30,'+(.5*b.burn)+')',null);c.restore();
        flame((q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2+2,4*b.burn+2,i+b.gx)}
      /* a few loose bricks hanging off the edge */
      c.fillStyle='#000';c.fillRect(q[2][0]-1,q[2][1]+1,2,2);
    });
    if((b.burn||0)>.02){
      const bn=b.burn,n=3+Math.ceil(bn*3);
      c.save();c.globalCompositeOperation='lighter';const g0=iso(b.gx+b.w/2,b.gy+b.dd/2,b.h);c.fillStyle='rgba(255,100,20,'+(.2*bn)+')';c.beginPath();c.arc(g0[0],g0[1]+lift,8+bn*6,0,7);c.fill();c.restore();
      for(let i=0;i<n;i++){const p=iso(b.gx+(.15+((i*37)%7)/9)*b.w,b.gy+(.15+((i*53)%5)/7)*b.dd,b.h);flame(p[0],p[1]+lift,(3+bn*3)*(.7+((i*13)%5)/9),i+b.gy)}
      for(let i=0;i<4;i++){const u=((t*.45+i*.25)%1),p=iso(b.gx+b.w*(.3+i*.12),b.gy+b.dd*(.4+(i%2)*.2),b.h);c.globalAlpha=(1-u)*.45*bn;c.fillStyle=rg(mx([60,56,70],[110,110,126],DAYST.k));c.beginPath();c.arc(p[0]+Math.sin(t+i)*3+u*4,p[1]+lift-6-u*24,2+u*5,0,7);c.fill()}c.globalAlpha=1;
    }
  }
  function drawMapMon(){
    const type=mm.type,fx=mm.fx,dk=DAYST.k,fly=type==='flyer',lt=.75+.25*dk;
    const g=iso(mm.gx,mm.gy,0),x=g[0],y=g[1]-(fly?0:0),T=t;
    /* ground shadow */
    c.fillStyle='rgba(0,0,0,'+(fly?.28:.35)+')';c.beginPath();c.ellipse(x,y,fly?16:type==='kraken'?20:12,fly?5:type==='kraken'?7:4.5,0,0,7);c.fill();
    c.save();c.translate(x,y);c.scale(fx,1);
    const P2=(col)=>bsh(col,lt),R=(rx,ry,w,h,col)=>{c.fillStyle=P2(col);c.fillRect(rx,ry,w,h)};
    if(type==='kaiju'){
      const st=Math.sin(T*5.5),tail=Math.sin(T*3)*6;
      R(-11+st*3,-27,9,27,'#255a3c');R(2-st*3,-27,9,27,'#2f6b4a');R(-12+st*3,-3,12,3,'#173a28');R(1-st*3,-3,12,3,'#173a28');
      c.strokeStyle=P2('#2f6b4a');c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-13,-32);c.quadraticCurveTo(-26,-26+tail,-42,-16+tail*1.4);c.stroke();
      c.fillStyle=P2('#2f6b4a');c.beginPath();c.moveTo(-15,-26);c.lineTo(-11,-62);c.lineTo(9,-66);c.lineTo(15,-26);c.closePath();c.fill();
      R(-4,-56,16,26,'#6fa57a');
      c.fillStyle=P2('#7c5cff');[[-13,-58],[-10,-48],[-9,-38]].forEach(([sx,sy],i)=>{c.beginPath();c.moveTo(sx,sy);c.lineTo(sx-8,sy-5-(i%2)*2);c.lineTo(sx,sy+7);c.fill()});
      R(7,-52,12,5,'#2f6b4a');c.save();c.translate(18,-50);c.rotate(.3+Math.sin(T*5.5)*.25);R(0,0,9,4,'#2f6b4a');c.restore();
      R(5,-82,19,17,'#2f6b4a');R(21,-77,9,8,'#2f6b4a');R(21,-69,9,3,'#173a28');
      c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,58,42,.95)';c.fillRect(16,-79,4,3);
      if(Math.sin(T*3)>0){const gr=c.createLinearGradient(30,-70,66,-30);gr.addColorStop(0,'rgba(255,240,180,.95)');gr.addColorStop(.5,'rgba(255,120,40,.75)');gr.addColorStop(1,'rgba(255,60,20,0)');c.strokeStyle=gr;c.lineWidth=7+Math.sin(T*35)*2;c.lineCap='round';c.beginPath();c.moveTo(30,-70);c.lineTo(66,-30);c.stroke()}
      c.restore();
    }else if(type==='mecha'){
      const st=Math.sin(T*4);
      R(-11+st*3,-26,9,26,'#2e3448');R(2-st*3,-26,9,26,'#2e3448');R(-13+st*3,-3,13,3,'#5a6684');R(0-st*3,-3,13,3,'#5a6684');
      R(-12,-58,24,32,'#4a5470');R(-9,-52,18,5,'#19e3ff');R(-8,-76,16,16,'#3a4258');R(-3,-82,3,7,'#5a6684');
      c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,60,60,.95)';c.fillRect(0,-72,8,4);c.fillStyle='rgba(25,227,255,.9)';c.fillRect(-4,-53,8,3);c.restore();
      c.save();c.translate(12,-54);c.rotate(-.5+Math.sin(T*4)*.1);R(0,-3,16,6,'#3a4258');R(14,-4,6,8,'#5a6684');c.restore();
      R(-18,-60,7,22,'#3a4258');
      if(Math.sin(T*2.2)>.1){c.save();c.globalCompositeOperation='lighter';const gr=c.createLinearGradient(30,-62,64,-4);gr.addColorStop(0,'rgba(255,230,200,.95)');gr.addColorStop(1,'rgba(255,50,40,0)');c.strokeStyle=gr;c.lineWidth=3.5+Math.sin(T*40);c.lineCap='round';c.beginPath();c.moveTo(27,-62);c.lineTo(64,-4);c.stroke();c.restore()}
    }else if(type==='kraken'){
      c.strokeStyle=P2('#6a2a7a');c.lineCap='round';
      for(let i=0;i<7;i++){let px=-18+i*6,py=0,a=-Math.PI/2+(i-3)*.3+Math.sin(T*2.2+i*1.3)*.55+Math.max(0,Math.sin(T*.9+i*.8))*.6*(i<3?1:-1);
        const pts=[[px,py]];for(let sg=0;sg<11;sg++){a+=Math.sin(T*3+i+sg*.5)*.2;px+=Math.cos(a)*5;py+=Math.sin(a)*5;pts.push([px,py])}
        for(let sg=1;sg<pts.length;sg++){c.lineWidth=Math.max(1.5,5.5*(1-sg/12));c.beginPath();c.moveTo(pts[sg-1][0],pts[sg-1][1]);c.lineTo(pts[sg][0],pts[sg][1]);c.stroke()}
        c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,46,136,.8)';for(let sg=2;sg<11;sg+=3){c.beginPath();c.arc(pts[sg][0],pts[sg][1],1,0,7);c.fill()}c.restore()}
      c.fillStyle=P2('#4a1c5a');c.beginPath();c.ellipse(0,-6,16,15,0,Math.PI,0);c.fill();c.fillRect(-16,-6,32,5);
      c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,220,60,.95)';[-6,6].forEach(ex=>{c.beginPath();c.ellipse(ex,-12,2.2,3*(.6+.4*Math.abs(Math.sin(T*.7))),0,0,7);c.fill()});c.restore();
    }else{
      const fl=Math.sin(T*9),oy=-62+Math.sin(T*2)*2.5;
      c.translate(0,oy);
      c.fillStyle=P2('#1c1530');c.beginPath();c.ellipse(0,0,13,5,0,0,7);c.fill();c.beginPath();c.arc(14,-1,4,0,7);c.fill();
      c.beginPath();c.moveTo(-12,0);c.lineTo(-30,3+Math.sin(T*4)*2);c.lineTo(-12,2);c.fill();
      [[1,.6],[-1,1]].forEach(([dir,al])=>{c.save();c.globalAlpha=al;c.translate(-2,-3);c.rotate(-(fl*.85*dir*.9-.1)*(dir>0?1:.6)-.15);
        c.fillStyle=P2('#241a3c');c.beginPath();c.moveTo(0,0);c.lineTo(-10,-46);c.lineTo(-30,-34);c.lineTo(12,-4);c.closePath();c.fill();
        c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,46,136,.5)';c.beginPath();c.arc(-13,-25,5,0,7);c.fill();c.restore()});
      c.save();c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,70,50,.95)';c.fillRect(15,-2,3,2);c.restore();
    }
    c.restore();
    if(fly){mm.bolts.forEach(bl=>{const b=bl.b,tp=iso(b.gx+b.w/2,b.gy+b.dd/2,b.h),sx=x,sy=y-62;
      c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(225,235,255,'+(1-bl.t/.22)+')';c.lineWidth=2;c.beginPath();c.moveTo(sx,sy);
      for(let k=1;k<=7;k++){const u=k/7;c.lineTo(sx+(tp[0]-sx)*u+(Math.random()-.5)*7,sy+(tp[1]-sy)*u)}c.stroke();c.restore()})}
  }
  function draw(){
    updOuts();updFx();updCars();updDebris();updMon();const dk=DAYST.k;
    BEACH.p=clamp(BEACH.p+(BEACH.on?1:-1)*.016/2.8,0,1);
    B[0].n=BEACH.p>.5?'Playa Sofia':'Casa Sofia';B[0].d=BEACH.p>.5?'OPEN: sun, sand, water features and the same dancers.':'OPEN: a hologram DJ, a pulsing floor and a very friendly moshpit.';
    c.fillStyle=rg(mx([11,7,22],[132,160,196],dk));c.fillRect(0,0,360,260);
    {const gk=Math.round(dk*30);if(gk!==gKey){gKey=gk;const main=c;c=gcv.getContext('2d');c.clearRect(0,0,360,260);ground(gk/30);c=main}c.drawImage(gcv,0,0)}
    if(BEACH.p>.01){drawBeach(dk,BEACH.p);drawBeachProps(dk,BEACH.p)}
    /* sort by depth */
    const list=(mm.on?B.concat([mm.proxy]):B.slice()).sort((a,b)=>(a.gx+a.gy+a.w+a.dd)-(b.gx+b.gy+b.w+b.dd));
    drawCars();
    list.forEach(b=>{
      if(b.mon){drawMapMon();return}
      const H0=b.h;let crum=0;
      if(b.club&&BEACH.p>0){const p=BEACH.p,e=p*p*(3-2*p);
        if(p>=.999){b._s={top:[iso(1,1),iso(3,1),iso(3,3),iso(1,3)],left:[iso(1,3),iso(3,3),iso(3,3),iso(1,3)],right:[iso(3,1),iso(3,3),iso(3,3),iso(3,1)]};return}
        b.h=H0*(1-e);crum=Math.sin(p*Math.PI)*2.4;if(BEACH.on)spawnDebris(b,b.h,p);c.globalAlpha=1-clamp((p-.55)/.45,0,1)}
      if(!b.club&&b.dmg>0){b.h=H0*(1-b.dmg*.6);crum=Math.max(crum,mm.on?b.dmg*1.8:0)}
      const s=shapes(b),hv=hover===b;
      const lift=(hv?-4:0)+(crum?(Math.random()-.5)*crum:0);
      const mv=pts=>pts.map(p=>[p[0],p[1]+lift]);
      poly(mv(s.left),shade(b.col,.75),'#000');poly(mv(s.right),shade(b.col,.5),'#000');poly(mv(s.top),shade(b.col,hv?1.5:1.15),'#000');
      /* windows */
      if(!b.lot){
        for(let r=0;r<Math.floor(b.h/13)-0;r++)for(let k=0;k<b.dd*2;k++){
          const on=((r*7+k*3+Math.floor(t*.4+r))%5)>1;const gx=b.gx+b.w,gy=b.gy+(k+.3)/2,z=7+r*13;
          const p=iso(gx,gy,z);c.fillStyle=on?rg(mx(hx(b.glow),[255,240,200],dk*.7)):rg(mx([20,12,34],[70,88,124],dk));c.fillRect(p[0]-1,p[1]+lift,2,3);
        }
        for(let r=0;r<Math.floor(b.h/13);r++)for(let k=0;k<b.w*2;k++){
          const on=((r*5+k*7+Math.floor(t*.3+r+k))%5)>1,q=iso(b.gx+(k+.3)/2,b.gy+b.dd,7+r*13);
          c.fillStyle=on?rg(mx(hx(b.glow).map(v=>v*.8),[235,220,170],dk*.7)):rg(mx([20,12,34],[60,76,110],dk));c.fillRect(q[0]-1,q[1]+lift,2,3)}
        const tp=iso(b.gx+b.w/2,b.gy+b.dd/2,b.h+13);
        const blink=(Math.floor(t*1.5)%7)!==0;
        c.globalAlpha=1-dk*.55;c.fillStyle=blink?b.glow:'#333';c.font='bold 10px "Zen Kaku Gothic New",sans-serif';c.textAlign='center';if(b.sign&&!(b.club&&BEACH.p>.02))c.fillText(b.sign,tp[0],tp[1]+lift);
        if(b.sign&&!(b.club&&BEACH.p>.02)){c.fillStyle=b.glow;c.globalAlpha=.25;c.fillRect(tp[0]-5,tp[1]+3+lift,10,1)}c.globalAlpha=1;
        if(b.deco){const rt=iso(b.gx+b.w*.3,b.gy+b.dd*.4,b.h),an=iso(b.gx+b.w*.75,b.gy+b.dd*.7,b.h);c.fillStyle='#2a2638';c.fillRect(rt[0]-2,rt[1]-3+lift,4,3);c.strokeStyle='#2a2638';c.beginPath();c.moveTo(an[0],an[1]+lift);c.lineTo(an[0],an[1]-7+lift);c.stroke();if(Math.floor(t*1.2+b.gx)%2){c.fillStyle='#ff3a3a';c.fillRect(an[0],an[1]-8+lift,1,1)}}
      }else{
        c.strokeStyle='#ffb347';c.setLineDash([2,2]);poly(mv(s.top),null,'#ffb347');c.setLineDash([]);
        /* hazard tape round the base, scaffolding poles, a crane and a blinking work light */
        [[b.gx,b.gy+b.dd,b.gx+b.w,b.gy+b.dd,1],[b.gx+b.w,b.gy,b.gx+b.w,b.gy+b.dd,0]].forEach(([ax,ay,bx,by,hor])=>{
          const n=Math.round(Math.hypot(bx-ax,by-ay)*9);
          for(let i=0;i<n;i++){const u0=i/n,u1=(i+1)/n,x0=ax+(bx-ax)*u0,y0=ay+(by-ay)*u0,x1=ax+(bx-ax)*u1,y1=ay+(by-ay)*u1;
            poly([iso(x0,y0,0+lift*-1*0),iso(x1,y1,0),iso(x1,y1,5),iso(x0,y0,5)].map(p=>[p[0],p[1]+lift]),i%2?'#ffcf2a':'#15101a',null)}});
        const cb=iso(b.gx+b.w*.35,b.gy+b.dd*.4,b.h);
        c.strokeStyle='#ffb347';c.lineWidth=1;c.beginPath();c.moveTo(cb[0],cb[1]+lift);c.lineTo(cb[0],cb[1]-16+lift);c.lineTo(cb[0]+10,cb[1]-16+lift);c.moveTo(cb[0]-5,cb[1]-16+lift);c.lineTo(cb[0],cb[1]-16+lift);c.moveTo(cb[0]+8,cb[1]-16+lift);c.lineTo(cb[0]+8,cb[1]-9+Math.sin(t*2+b.gx)*2+lift);c.stroke();
        c.fillStyle='#ffb347';c.fillRect(cb[0]+7,cb[1]-9+Math.sin(t*2+b.gx)*2+lift,3,2);
        const lp2=iso(b.gx+b.w*.8,b.gy+b.dd*.8,b.h);if(Math.floor(t*2)%2){c.fillStyle='#ffcf2a';c.fillRect(lp2[0]-1,lp2[1]-2+lift,2,2);c.globalAlpha=.25;c.beginPath();c.arc(lp2[0],lp2[1]-1+lift,5,0,7);c.fill();c.globalAlpha=1}
        c.fillStyle='#ffcf2a';c.font='4px "Share Tech Mono",monospace';c.textAlign='center';const tp2=iso(b.gx+b.w/2,b.gy+b.dd/2,b.h+7);c.fillText('UNDER CONSTRUCTION',tp2[0],tp2[1]+lift);
      }
      if(b.dmg>0||b.burn>0)drawDamage(b,s,lift);
      b.h=H0;c.globalAlpha=1;
      b._s=s;
    });
    drawPeds();drawStreetFurniture(dk);drawDebris(dk);
    /* the doorway light changes colour every 3 seconds */
    if(BEACH.p<.35){
      const dc=doorCol(),cs=`${dc[0]|0},${dc[1]|0},${dc[2]|0}`,col=`rgb(${cs})`;
      const fl=.85+.15*Math.sin(t*9)+(Math.floor(t*3)%9?0:.15);
      const pool=[iso(3,1.7,0),iso(3,2.3,0),iso(4.4,3.2,0),iso(4.4,.8,0)];
      c.save();c.globalCompositeOperation='lighter';
      const g=c.createLinearGradient(iso(3,2,0)[0],iso(3,2,0)[1],iso(4.3,2.8,0)[0],iso(4.3,2.8,0)[1]);
      g.addColorStop(0,`rgba(${cs},${.5*fl*(1-dk*.8)})`);g.addColorStop(1,`rgba(${cs},0)`);
      poly(pool,null,null);c.fillStyle=g;c.fill();c.restore();
      c.fillStyle=col;poly([iso(3,1.78,0),iso(3,2.22,0),iso(3,2.22,10),iso(3,1.78,10)],col,'#000');
      /* velvet rope posts */
      for(let g2=.3;g2<=1.7;g2+=.35){const p=iso(3.15,g2,0);c.fillStyle='#c8a24a';c.fillRect(p[0],p[1]-3,1,3);if(g2<1.6){const q=iso(3.15,g2+.35,0);c.strokeStyle=col;c.beginPath();c.moveTo(p[0],p[1]-3);c.lineTo(q[0],q[1]-3);c.stroke()}}
      /* gather everyone near the door: the queue and whoever is being shown out */
      const people=[],n=7+Math.floor(1.5+1.5*Math.sin(t*.15)),sh=(t*.35)%1;
      for(let i=n;i>=0;i--){const gy=1.62-(i-sh)*.2;if(gy<.1)continue;
        people.push({gx:3.32+Math.sin(i*5)*.04,gy:gy,fem:(i*7)%3===0,col:['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a','#e8e8f0'][(i*5)%6],bob:Math.sin(t*3+i)*.5})}
      outs.forEach(a=>{const ps=actorPos(a);ps.forEach(p=>people.push(p))});
      /* black shadows, thrown away from the door light, visible only where the light actually falls on the person */
      c.save();poly(pool,null,null);c.clip();
      people.forEach(p=>{
        const sp=iso(p.gx,p.gy,0),mid=[sp[0],sp[1]-3];if(!inPoly(sp,pool)&&!inPoly(mid,pool))return;
        const dx=p.gx-3,dy=p.gy-2,l=Math.hypot(dx,dy)||1,L=.5+(p.lie?0:.25);
        const e=iso(p.gx+dx/l*L,p.gy+dy/l*L,0),w=p.lie?3:1.6,nx=e[1]-sp[1],ny=-(e[0]-sp[0]),nl=Math.hypot(nx,ny)||1;
        c.globalAlpha=(p.al==null?1:p.al)*.9;c.fillStyle='#000';c.beginPath();
        c.moveTo(sp[0]+nx/nl*w,sp[1]+ny/nl*w);c.lineTo(e[0],e[1]);c.lineTo(sp[0]-nx/nl*w,sp[1]-ny/nl*w);c.closePath();c.fill();
      });
      c.restore();c.globalAlpha=1;
      /* the people themselves */
      people.sort((a,b)=>a.gx+a.gy-b.gx-b.gy).forEach(p=>{
        const s0=iso(p.gx,p.gy,0),x=s0[0],y=s0[1]-(p.hop||0);c.globalAlpha=p.al==null?1:p.al;
        if(p.bouncer){c.fillStyle='#0c0c12';c.fillRect(x-1.5,y-7,3,7);c.fillStyle='#e8e8f0';c.fillRect(x-1,y-9,2,2);c.fillStyle=col;c.fillRect(x-.5,y-6,1,3)}
        else if(p.lie){c.fillStyle=p.col;c.fillRect(x-3,y-2,6,2);c.fillStyle='#f0c9a5';c.fillRect(x+3,y-2,2,2)}
        else{c.fillStyle='#07040d';c.fillRect(x-1,y-1,3,1);c.fillStyle=p.col;c.fillRect(x-1,y-4,2,3);if(p.fem)c.fillRect(x-2,y-2,4,1);c.fillStyle='#f0c9a5';c.fillRect(x-1,y-6+(p.bob||0)*.4,2,2)}
        if(p.mad){c.fillStyle='#ff3a3a';c.font='bold 6px "Share Tech Mono",monospace';c.textAlign='center';c.fillText('!',x,y-9)}
        if(p.say){c.fillStyle='#fff';c.font='5px "Share Tech Mono",monospace';c.textAlign='center';c.fillText(p.say,x,y-10)}
        c.globalAlpha=1});
      /* the door bouncer */
      const bp=iso(3.12,2.4,0);c.fillStyle='#0c0c12';c.fillRect(bp[0]-1,bp[1]-6,3,6);c.fillStyle=col;c.fillRect(bp[0],bp[1]-5,1,3);
      c.font='5px "Share Tech Mono",monospace';c.fillStyle='#ffb347';c.textAlign='left';const lp=iso(3.5,.15,0);c.fillText('QUEUE',lp[0]+4,lp[1]);
    }
    drawFx();
    if(hover&&hover._s){
      const all=[].concat(hover._s.top,hover._s.left,hover._s.right);
      const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]-4);
      const pad=4+Math.sin(t*6)*1.2,x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-pad,y1=Math.max(...ys)+pad,L=7;
      c.strokeStyle='#19e3ff';c.lineWidth=1;c.beginPath();
      [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(q=>{c.moveTo(q[0]+q[2]*L,q[1]);c.lineTo(q[0],q[1]);c.lineTo(q[0],q[1]+q[3]*L)});c.stroke();
      c.globalAlpha=.25;c.fillStyle='#19e3ff';const sy=y0+((t*40)%(y1-y0));c.fillRect(x0,sy,x1-x0,1);c.globalAlpha=1;
      c.fillStyle='#19e3ff';c.font='6px "Share Tech Mono",monospace';c.textAlign='left';
      c.fillText('LOCK '+(hover.app?'// OPEN':'// UNDER CONSTRUCTION'),x0,y0-3);
    }
    if(hover){c.fillStyle='rgba(255,255,255,.9)';c.font='8px "Share Tech Mono",monospace';c.textAlign='center';const p=iso(hover.gx+hover.w/2,hover.gy+hover.dd/2,hover.h+30);
      c.fillStyle='#000';c.fillRect(p[0]-hover.n.length*2.4-3,p[1]-7,hover.n.length*4.8+6,10);c.fillStyle='#ffb347';c.fillText(hover.n,p[0],p[1])}
    /* monster alert: red pulse, blinking banner, screen shake */
    if(mm.on){
      c.fillStyle='rgba(255,30,40,'+(.07+.06*Math.sin(t*9))+')';c.fillRect(0,0,360,260);
      if(Math.floor(t*3)%2){c.font='bold 9px "Share Tech Mono",monospace';c.textAlign='center';const nm={kaiju:'KAIJU',mecha:'MECHA',kraken:'KRAKEN',flyer:'WINGED TERROR'}[mm.type]||'MONSTER',tx='\u26A0 '+nm+' ATTACK \u26A0';
        c.fillStyle='rgba(0,0,0,.7)';c.fillRect(180-tx.length*2.9,6,tx.length*5.8,13);c.fillStyle='#ff3a2a';c.fillText(tx,180,16)}
      if(!reduce)cv.style.transform='translate('+((Math.random()-.5)*3).toFixed(1)+'px,'+((Math.random()-.5)*3).toFixed(1)+'px)';
    }else if(cv.style.transform)cv.style.transform='';
  }
  function pick(e){
    const r=cv.getBoundingClientRect(),p=[(e.clientX-r.left)*360/r.width,(e.clientY-r.top)*260/r.height];
    const order=B.slice().sort((a,b)=>(b.gx+b.gy+b.w+b.dd)-(a.gx+a.gy+a.w+a.dd));
    return order.find(b=>!b.deco&&b._s&&(inPoly(p,b._s.top)||inPoly(p,b._s.left)||inPoly(p,b._s.right)))||null;
  }
  cv.addEventListener('pointermove',e=>{const b=pick(e);if(b!==hover){hover=b;cap.textContent=b?b.n+': '+b.d:'Hover a building. The lit ones are open; the rest are under construction.';cv.style.cursor=b&&b.app?'pointer':'crosshair'}});
  cv.addEventListener('pointerleave',()=>{hover=null});
  cv.addEventListener('click',e=>{const b=pick(e);if(b&&b.app)openApp(b.app)});
  let raf;function loop(){t+=.016;draw();if(!document.body.contains(win)){cancelAnimationFrame(raf);return}if(!reduce)raf=requestAnimationFrame(loop)}
  DAYST.map=()=>{if(document.body.contains(win))draw()};
  draw();if(!reduce)loop();
}

/* ---------- beach toggle: Casa Sofia <-> Playa Sofia ---------- */
function applyBeach(on){
  BEACH.on=on;if(reduce)BEACH.p=on?1:0;
  const b=document.getElementById('beach');if(b){b.setAttribute('aria-pressed',on?'true':'false');b.innerHTML=on?'&#9790; CASA':'&#127958; PLAYA'}
  const cw=open.club;if(cw){const t=cw.querySelector('.bar .t');if(t)t.textContent=on?'PLAYA SOFIA':'CASA SOFIA'}
  if(DAYST.map)DAYST.map();
}
function setBeach(on){try{localStorage.setItem('jowo.beach',on?'1':'0')}catch(e){}applyBeach(on)}
addEventListener('storage',e=>{if(e.key==='jowo.beach')applyBeach(e.newValue==='1')});
{const bb=document.getElementById('beach');if(bb)bb.addEventListener('click',()=>setBeach(!BEACH.on))}
applyBeach(BEACH.on);

/* ---------- system readout ---------- */
(function(){
  const t0=performance.now(),hex=$('#hex'),up=$('#up'),wn=$('#wn'),cur=$('#cur'),tg=$('#tg');
  const PH=['the rain remembers every footstep','connection established with the moon','please do not feed the vending machine after midnight','ejovwo was here','compiling dreams, 87 percent','your noodles are almost ready','a pigeon has requested root access','nobody has seen the third floor since tuesday','downloading a very small ocean','warning: umbrella firmware out of date','the alley is longer than it looks','rebooting the sun','all ghosts please use the side door','egbe bere, ugo bere','nnoo, welcome to neo-jowo','this sentence is a decoy','tea service resumes at dawn','packet lost somewhere near osaka','the bass is a rumour','hello from the other server','please remain calm and keep walking','kola nut handshake accepted','scanning for lost umbrellas','the neon never sleeps, it only blinks'];
  const AL='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',COLS=28,ri=n=>Math.floor(Math.random()*n);
  const junk=()=>{let o=[];const n=2+ri(4);for(let i=0;i<n;i++){let w='';const l=2+ri(6);for(let k=0;k<l;k++)w+=AL[ri(AL.length)];o.push(w)}return o.join(' ')};
  let q='';
  const line=()=>{
    while(q.length<COLS*2)q+=(Math.random()<.45?PH[ri(PH.length)]:junk())+' ';
    let ln=q.slice(0,COLS);
    if(q[COLS]!==' '&&ln.lastIndexOf(' ')>8)ln=ln.slice(0,ln.lastIndexOf(' '));
    q=q.slice(ln.length).replace(/^ +/,'');return ln.trimEnd();
  };
  const rows=[];for(let i=0;i<7;i++)rows.push(line());
  addEventListener('pointermove',e=>{cur.textContent=String(Math.round(e.clientX)).padStart(4,'0')+','+String(Math.round(e.clientY)).padStart(4,'0')});
  setInterval(()=>{
    const s=Math.floor((performance.now()-t0)/1000);
    up.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    wn.textContent=Object.keys(open).length;
    tg.textContent=(Object.keys(open).pop()||'none').toUpperCase();const pc=$('#pace');if(pc)pc.textContent=((window.__pace||1)).toFixed(1)+'x';
    hexT++;if(!reduce&&hexT%3===0){rows.shift();rows.push(line())}
    hex.textContent=rows.join('\n');
  },600);
  /* the data stream scrolls slowly: one new line every 1.8s */
  let hexT=0;
})();
window.openApp=openApp;
})();

/* ---------- sound toggle: synthesised house music (house.js) ---------- */
(function(){
  const b=document.getElementById('snd');if(!b||!window.House)return;
  const lab=on=>{b.textContent=on?'\u266A SOUND ON':'\u266A SOUND OFF';b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')};
  b.addEventListener('click',()=>House.toggle());House.onchange(lab);lab(false);
  const sh=document.getElementById('shf'),toast=document.querySelector('.toast');
  const say=t=>{if(!toast)return;toast.textContent='\u266A NOW PLAYING \u00b7 '+t.name.toUpperCase()+' \u00b7 '+t.key+' \u00b7 '+t.bpm+' BPM';toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),3200)};
  if(sh)sh.addEventListener('click',()=>{const t=House.shuffle();if(!House.on)House.toggle();say(t)});
})();

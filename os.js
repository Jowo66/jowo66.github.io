(function(){
'use strict';
const $=s=>document.querySelector(s);
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- clock ---------- */
function tick(){
  const d=new Date();
  $('#clock').textContent=d.toLocaleTimeString('en-GB',{hour12:false});
  $('#date').textContent=d.toLocaleDateString('en-CA');
}
tick();setInterval(tick,1000);

/* ---------- boot ---------- */
(function(){
  const lines=['<b>NEO-EDO OS</b>','mounting /district ........ ok','loading neon ............. ok','tuning rain .............. ok','waking the cabaret ....... ok','waking the dojo .......... ok','ようこそ · welcome · добро пожаловать · 환영합니다 · مرحبا'];
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
  const SIGNS=['酒','夜','龍','電','猫','麺','薬','バー','ラーメン','БАР','ПИВО','주점','한식','ΜΠΑΡ','ΟΥΖΟ','בר','مقهى','بار','बार','ผับ','ยา','PHARMA','NOODLE','SUSHI','CAFÉ','APTEKA','ÇAY','24H','OPEN','Ụlọ Nri','NNỌỌ','ỤLỌ AKWỤKWỌ'];
  const NEON=['#ff2e88','#19e3ff','#ffb347','#7c5cff','#3dff9a'];
  function size(){const s=Math.min(devicePixelRatio||1,1.5)*.8;W=cv.width=Math.floor(innerWidth*s);H=cv.height=Math.floor(innerHeight*s);f=H*.95}
  size();addEventListener('resize',size);
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;mouse.on=(e.target===cv);mouse.x=e.clientX*W/innerWidth;mouse.y=e.clientY*H/innerHeight});
  let SALT=0,alleyNo=1,J=null,pan=null,nextTurn=24+Math.random()*16,pulse=0;
  const PAN=1.7;
  const hash=n=>{let x=Math.sin(n*127.1+311.7+SALT*91.7)*43758.5453;return x-Math.floor(x)};
  let cx,cy;
  const P=(x,y,z)=>[cx+x*f/z,cy+y*f/z];
  function quad(a,b,c2,d){c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(c2[0],c2[1]);c.lineTo(d[0],d[1]);c.closePath()}
  const rain=Array.from({length:45},()=>({x:Math.random(),y:Math.random(),l:.03+Math.random()*.05,s:.9+Math.random()*.9}));
  function wall(side,id,z1,z2){
    const x=side*WALL,fog=clamp(1-z1/(SEG*NSEG),0,1);
    const h=hash(id*2+(side>0?1:0));
    const tone=Math.floor(10+h*14);
    c.fillStyle=`rgb(${tone+8},${tone},${tone+22})`;
    quad(P(x,TOP,z1),P(x,FLOOR,z1),P(x,FLOOR,z2),P(x,TOP,z2));c.fill();
    /* windows */
    const cols=3,rows=7;
    for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){
      const lit=hash(id*31+r*7+k*3+(side>0?5:0));
      if(lit<.45)continue;
      const zz=z1+(k+.25)*(z2-z1)/cols,zw=(z2-z1)/cols*.5,y0=-5.4+r*.62,y1=y0+.36;
      c.fillStyle=lit>.85?'#ff2e88':lit>.7?'#19e3ff':'#ffb347';
      c.globalAlpha=(.25+.55*fog)*(lit>.7?.9:.6);
      quad(P(x,y0,zz),P(x,y1,zz),P(x,y1,zz+zw),P(x,y0,zz+zw));c.fill();
    }
    c.globalAlpha=1;
    /* dark ledge */
    c.fillStyle='rgba(0,0,0,.45)';
    quad(P(x,FLOOR-.35,z1),P(x,FLOOR,z1),P(x,FLOOR,z2),P(x,FLOOR-.35,z2));c.fill();
    /* neon sign */
    const sg=hash(id*13+(side>0?9:2));
    if(sg>.5){
      const col=NEON[Math.floor(hash(id*5+side)*NEON.length)],zc=z1+(z2-z1)*.5,sy0=-3.8+hash(id)*1.2,sy1=sy0+1.6,zw=.28;
      const p0=P(x-side*.04,sy0,zc-zw),p1=P(x-side*.04,sy1,zc-zw),p2=P(x-side*.04,sy1,zc+zw),p3=P(x-side*.04,sy0,zc+zw);
      c.fillStyle='#0a0612';quad(p0,p1,p2,p3);c.fill();
      c.strokeStyle=col;c.lineWidth=Math.max(1,f/zc*.03);c.globalAlpha=.35+.65*fog;
      c.shadowColor=col;c.shadowBlur=fog>.4?10:0;quad(p0,p1,p2,p3);c.stroke();c.shadowBlur=0;
      const m=P(x-side*.05,(sy0+sy1)/2,zc),word=SIGNS[Math.floor(hash(id*3+side)*SIGNS.length)],len=[...word].length,px=f/zc;
      c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';
      if(len===1){const fs=px*.42;if(fs>7){c.font=`900 ${fs}px "Zen Kaku Gothic New","Noto Sans",sans-serif`;c.fillText(word,m[0],m[1])}}
      else{const fs=Math.min(px*.4,px*1.45/(len*.62));if(fs>6){c.save();c.translate(m[0],m[1]);c.rotate(Math.PI/2);c.font=`800 ${fs}px "Zen Kaku Gothic New","Noto Sans",sans-serif`;c.fillText(word,0,0);c.restore()}}
      c.globalAlpha=1;
      /* reflection on wet floor */
      c.fillStyle=col;c.globalAlpha=.07+.09*fog;
      quad(P(x,FLOOR,zc-zw),P(x,FLOOR,zc+zw),P(side*.4,FLOOR,zc+zw*2.4),P(side*.4,FLOOR,zc-zw*2.4));c.fill();c.globalAlpha=1;
    }
    /* missing posters */
    if(hash(id*17+(side>0?3:8))>.72){
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
  const WEIGHTS={umbrella:2,courier:2,kimono:1,dog:1,drone:2,ramen:1,dealer:1,preacher:1,robocop:1,oldlady:1,mascot:1,kidball:1,detective:1,samurai:1,kidrun:1,sage:1};
  const UNIQUE=new Set(['dealer','preacher','robocop','detective','samurai','sage','mascot']);
  const WLIST=Object.keys(WEIGHTS).flatMap(k=>Array(WEIGHTS[k]).fill(k));
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
  let chars=[],spawnT=0,clock=0;
  const rndp=a=>a[Math.floor(Math.random()*a.length)];
  function spawn(initial){
    const name=pickType(),def=LP.MODELS[name==='sage'&&Math.random()<.5?'sageF':name]();
    const stat=!!def.stat;
    const toward=stat?false:Math.random()<.65;
    const sp=stat?0:def.sp[0]+Math.random()*(def.sp[1]-def.sp[0]);
    const ent={parts:LP.compile(def.parts),x:name==='dealer'?(Math.random()<.5?-1:1)*(1.55+Math.random()*.3):(Math.random()*2-1)*1.5,
      z:initial?(6+Math.random()*20):(stat?10+Math.random()*5:(toward?30:6.5)),yaw:toward?Math.PI:0,sc:(def.sc||1)*(.9+Math.random()*.15)*(def.sc?1:1),
      ph:Math.random()*6,clock:0,elev:def.fly?.75+Math.random()*.9:0,bob:0,arms:Object.assign({},def.arms||{}),tint:null};
    if(name==='ramen')ent.sc=1;
    chars.push({name,def,ent,myth:Lore.mythName(),toward,sp,stat,age:0,life:stat?16+Math.random()*6:999,irate:0,cool:0,wait:0,bubT:2+Math.random()*6,bub:null,bubK:null,bubL:0,bump:false,seed:Math.random()*10,bb:null,asked:false});
  }
  function say(ch,txt,kind,dur){ch.bub=txt;ch.bubK=kind;ch.bubL=dur||2.2}
  function makeIrate(ch,txt,force){
    if(!force&&ch.cool>0)return;
    ch.irate=2.6;ch.cool=5;ch.wait=0;say(ch,txt||rndp(SHOUTS),'irate',2.4);
  }
  function updChars(dt){
    clock+=dt;spawnT-=dt;
    if(spawnT<=0&&chars.length<9){spawn(false);spawnT=1+Math.random()*2}
    for(const ch of chars){
      const e=ch.ent;ch.age+=dt;e.clock=clock;ch.cool=Math.max(0,ch.cool-dt);
      ch.life-=dt;
      const drift=-SCR;
      if(ch.wait>0){ch.wait-=dt;e.z+=drift*dt}
      else if(ch.stat){e.z+=drift*dt}
      else e.z+=(ch.toward?-(ch.sp*.7+SCR):Math.max(.12,ch.sp*.7-SCR))*dt;
      if(!ch.stat&&ch.wait<=0)e.ph+=dt*Math.min(ch.sp,6)*3.4*(ch.hurry?1.5:1);
      if(!ch.stat&&!ch.def.fly&&ch.wait<=0)e.x+=Math.sin(clock*.6+ch.seed)*.01*dt*10;
      e.bob=ch.def.fly?Math.sin(clock*2+ch.seed)*.08:0;
      /* preacher gesticulates, samurai stays calm */
      if(ch.stat&&ch.wait<=0&&ch.irate<=0){
        if(ch.name==='preacher'){e.arms.R=-2.5+Math.sin(clock*3)*.35;e.arms.L=-1.2+Math.sin(clock*2.4)*.5}
        if(ch.name==='dealer')e.yaw=Math.PI+Math.sin(clock*.5+ch.seed)*.5;
        if(ch.name==='sage'){e.arms.R=-1.1+Math.sin(clock*1.6)*.25;e.arms.L=-.3+Math.sin(clock*1.1)*.2;e.yaw=Math.PI+Math.sin(clock*.4+ch.seed)*.25}
      }
      if(ch.stat&&ch.life<=0&&ch.irate<=0)ch.dead=true;
      if(ch.meetT>0){ch.meetT-=dt;if(ch.meetT<=0){
        /* walk off in opposite directions, hurried and annoyed */
        ch.stat=false;ch.hurry=true;ch.toward=ch.leave==='toward';ch.sp=2+Math.random()*.9;ch.wait=0;
        delete e.arms.R;if(ch.name==='samurai')e.arms.R=-.9;e.yaw=ch.toward?Math.PI:0;say(ch,rndp(FRUST),'irate',1.8);ch.cool=3}}
      /* anger: shake, turn to face the viewer, flash red */
      if(ch.irate>0){
        ch.irate-=dt;e.x+=Math.sin(clock*60)*.012;
        let dy=Math.PI-(e.yaw%(Math.PI*2));e.yaw+=dy*Math.min(1,dt*6);
        e.tint=[255,30,30,.35+.25*Math.sin(clock*18)];e.arms.R=-2.6+Math.sin(clock*25)*.4;
        if(ch.irate<=0){e.tint=null;if(ch.name!=='preacher'&&ch.name!=='samurai')delete e.arms.R;if(ch.name==='samurai')e.arms.R=-.9;e.yaw=ch.toward?Math.PI:(ch.stat?e.yaw:0)}
        ch.wait=Math.max(ch.wait,0);
      }
      /* collide with the viewer */
      if(ch.toward&&!ch.bump&&e.z<3.3){ch.bump=true;makeIrate(ch,rndp(['Watch it!','邪魔だ!','Смотри!','조심해!','انتبه!']))}
      /* random chatter */
      ch.bubT-=dt;if(ch.bubT<=0){
        if(ch.name==='sage'&&ch.stat){ch.bubT=8+Math.random()*3;if(ch.irate<=0&&ch.wait<=0&&e.z<24)say(ch,Lore.parable(),'wisdom',6.5)}
        else{ch.bubT=5+Math.random()*7;if(ch.irate<=0&&ch.wait<=0&&e.z<22&&Math.random()<.6)say(ch,rndp(ch.def.bub||['…']),'say',2.4)}
      }
      if(ch.bubL>0)ch.bubL-=dt;else ch.bub=null;
      /* detective stops people and asks questions */
      if(ch.name==='detective'&&ch.wait<=0&&!ch.asked){
        const t=chars.find(o=>o!==ch&&!o.def.fly&&o.name!=='detective'&&Math.abs(o.ent.z-e.z)<1.7&&Math.abs(o.ent.x-e.x)<1.4&&o.irate<=0&&o.wait<=0);
        if(t){ch.asked=true;ch.wait=3.2;t.wait=3.2;e.yaw=t.ent.x<e.x?-Math.PI/2:Math.PI/2;
          say(ch,rndp(ch.def.bub),'say',2.8);say(t,rndp(['?','…','知らない','No.','Нет.','몰라요','لا.']),'say',2.4);e.arms.R=-1.5}
      }
      if(ch.name==='detective'&&ch.wait<=0&&ch.asked&&e.arms.R===-1.5){delete e.arms.R;e.yaw=ch.toward?Math.PI:0;ch.asked=false;ch.cool=Math.max(ch.cool,0)}
    }
    /* two unique characters who meet stop, point at each other, then storm off */
    const us=chars.filter(q=>UNIQUE.has(q.name)&&!q.met&&q.irate<=0&&q.ent.z<22);
    if(us.length>=2){const A=us[0],B=us[1];
      if(Math.abs(A.ent.z-B.ent.z)<2.2&&Math.abs(A.ent.x-B.ent.x)<2.2){
        A.met=B.met=true;A.meetT=B.meetT=2.4;A.wait=B.wait=2.4;const sw=Math.random()<.5;A.leave=sw?'toward':'away';B.leave=sw?'away':'toward';
        [[A,B],[B,A]].forEach(([p,q])=>{p.ent.yaw=Math.atan2(q.ent.x-p.ent.x,q.ent.z-p.ent.z);p.ent.arms.R=-1.5;say(p,rndp(POINT),'irate',2.2)});
      }}
    /* walkers that cross paths bump into each other */
    for(let i=0;i<chars.length;i++)for(let j=i+1;j<chars.length;j++){
      const A=chars[i],B=chars[j];if(A.stat||B.stat||A.def.fly||B.def.fly||A.irate>0||B.irate>0||A.cool>0||B.cool>0)continue;
      if(Math.abs(A.ent.z-B.ent.z)<.55&&Math.abs(A.ent.x-B.ent.x)<.5&&A.ent.z<20){makeIrate(A);makeIrate(B)}
    }
    chars=chars.filter(ch=>!ch.dead&&ch.ent.z>1.3&&ch.ent.z<36);
  }
  function drawChars(){
    const list=chars.slice().sort((a,b)=>b.ent.z-a.ent.z);
    CAM.f=f;
    list.forEach(ch=>{const e=ch.ent;ch.vis=false;if(e.z<1.4)return;
      const fogk=CAM.fogK(e.z);
      const fade=clamp(Math.min((33-e.z)/3,1,ch.age/.6,ch.stat?ch.life/1.2:1),0,1)*clamp((e.z-1.4)/1.2,0,1);
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
  function frame(t){
    smx+=(mx-smx)*.05;smy+=(my-smy)*.05;
    cx=W/2-smx*W*.1;cy=H*.44-smy*H*.05;
    if(pan){const p=pan.t/PAN,e3=u=>u*u*u,e4=u=>1-Math.pow(1-u,3);cx+=(p<.5?-pan.dir*e3(p*2):pan.dir*(1-e4((p-.5)*2)))*W*1.4}
    /* sky */
    const sk=c.createLinearGradient(0,0,0,cy+H*.1);
    sk.addColorStop(0,'#0a0612');sk.addColorStop(.7,'#3a0f4a');sk.addColorStop(1,'#ff2e88');
    c.fillStyle=sk;c.fillRect(0,0,W,H);
    const gl=c.createRadialGradient(cx,cy,0,cx,cy,H*.5);gl.addColorStop(0,'rgba(255,200,120,.55)');gl.addColorStop(1,'rgba(255,46,136,0)');
    c.fillStyle=gl;c.fillRect(0,0,W,H);
    /* floor */
    const fl=c.createLinearGradient(0,cy,0,H);fl.addColorStop(0,'#2a0f3a');fl.addColorStop(1,'#07030d');
    c.fillStyle=fl;quad(P(-WALL,FLOOR,1),P(WALL,FLOOR,1),P(WALL,FLOOR,SEG*NSEG),P(-WALL,FLOOR,SEG*NSEG));c.fill();
    /* walls, far to near */
    const base=Math.floor(scroll/SEG),off=scroll-base*SEG;
    for(let k=NSEG;k>=0;k--){
      const z1=Math.max(.8,k*SEG-off),z2=(k+1)*SEG-off;if(z2<=.8)continue;
      const id=base+k;wall(-1,id,z1,z2);wall(1,id,z1,z2);if(J&&id===J.id)opening(J.side,z1);
      if((id&1)===0)lantern(id,z1+SEG*.5);
    }
    /* distance fog */
    const fg=c.createRadialGradient(cx,cy,0,cx,cy,H*.35);fg.addColorStop(0,'rgba(255,140,170,.5)');fg.addColorStop(1,'rgba(255,46,136,0)');
    c.fillStyle=fg;c.fillRect(0,0,W,H);
    drawChars();drawRain();
    /* foreground streaks */
    c.strokeStyle='rgba(190,220,255,.3)';c.lineWidth=1.2;c.beginPath();
    for(const r of rain){const x=r.x*W,y=r.y*H;c.moveTo(x,y);c.lineTo(x-r.l*W*.05,y+r.l*H*1.4);
      if(!reduce){r.y+=r.s*.02;r.x-=r.s*.002;if(r.y>1){r.y=-.05;r.x=Math.random()*1.1}}}
    c.stroke();
    /* speed lines while the viewer hurries */
    if(boost>.15){c.strokeStyle='rgba(255,200,230,'+Math.min(.28,boost*.12)+')';c.lineWidth=1.5;c.beginPath();
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2+clock*.2,r0=H*(.25+.1*((i*7)%5)/5),r1=r0+H*.35;c.moveTo(cx+Math.cos(a)*r0*1.5,cy+Math.sin(a)*r0);c.lineTo(cx+Math.cos(a)*r1*1.5,cy+Math.sin(a)*r1)}c.stroke()}
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
    SALT++;alleyNo++;J=null;nextTurn=26+Math.random()*22;scroll=10+Math.random()*60;chars=[];splashes.length=0;closeTerm();
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
    termTxt='age ........ '+p.age+'\npassion .... '+p.passion+'\ngenre ...... '+p.genre+'\nnote ....... '+p.fact;
    term.querySelector('.tt').textContent='ID://'+p.name;termN=0;term.hidden=false;placeTerm();
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
    if(termCh.dead||termCh.ent.z<1.6||!chars.includes(termCh))closeTerm();
  }
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
  if(/[?&]debug/.test(location.search))window.__alley={chars:()=>chars,turn:()=>{nextTurn=0},J:()=>J,pan:()=>pan,alleyNo:()=>alleyNo};
  let last=0;
  function loop(t){
    const dt=Math.min((t-last)/1000||0,.05);last=t;
    boost=Math.max(0,boost-dt*.5);SCR=SCR0*(1+boost*2.2);window.__pace=SCR/SCR0;
    if(pan){pan.t+=dt;if(!pan.swapped&&pan.t>=PAN/2){pan.swapped=true;swapWorld()}if(pan.t>=PAN)pan=null}
    else{nextTurn-=dt;
      if(!J&&nextTurn<=0)J={id:Math.floor(scroll/SEG)+4,side:Math.random()<.5?-1:1};
      if(J){const b0=Math.floor(scroll/SEG),z=(J.id-b0)*SEG-(scroll-b0*SEG);if(z<=1.7)pan={t:0,dir:J.side,swapped:false}}}
    scroll+=dt*SCR;updChars(dt);updRain(dt);frame(t);updTerm(dt);
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
  cabaret:{jp:'酒',t:'THE RUSTY KOI CABARET',t2:'كاباريه · 카바레',frame:'future.html?embed',cls:'app-win',ar:1.6},
  dojo:{jp:'相',t:'THE DOJO',t2:'道場 · Додзё',frame:'sumo.html?embed',cls:'app-win',ar:1.3}
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
  const cv=win.querySelector('#map'),c=cv.getContext('2d'),cap=win.querySelector('#cap');
  const TW=46,TH=23,OX=180,OY=50,N=7;
  const iso=(gx,gy,z=0)=>[OX+(gx-gy)*TW/2,OY+(gx+gy)*TH/2-z];
  const B=[
    {n:'The Rusty Koi Cabaret',d:'OPEN: a chrome singer, five tables, and something behind the curtains.',gx:1,gy:1,w:2,dd:2,h:49,col:'#7a1f4d',app:'cabaret',glow:'#ff2e88',sign:'酒'},
    {n:'The Dojo',d:'OPEN: endless sumo bouts. Win streaks tilt the odds, but never lock them.',gx:4,gy:1,w:2,dd:2,h:38,col:'#8a3a22',app:'dojo',glow:'#ffb347',sign:'相'},
    {n:'About Tower',d:'OPEN: who I am.',gx:1,gy:4,w:1,dd:2,h:67,col:'#243a6a',app:'about',glow:'#19e3ff',sign:'我'},
    {n:'Lot 01',d:'Reserved for a future project.',gx:3,gy:4,w:1,dd:1,h:17,col:'#2c2440',lot:1},
    {n:'Lot 02',d:'Reserved for a future project.',gx:5,gy:4,w:1,dd:2,h:23,col:'#2c2440',lot:1},
    {n:'Lot 03',d:'Reserved for a future project.',gx:3,gy:5,w:1,dd:1,h:14,col:'#2c2440',lot:1}
  ];
  const cars=[{p:0,s:.5,c:'#ff2e88'},{p:.5,s:.35,c:'#19e3ff'}];
  let hover=null,t=0;
  const poly=(pts,fill,stroke)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}};
  const shade=(hex,k)=>{const v=parseInt(hex.slice(1),16);const r=clamp((v>>16)*k,0,255)|0,g=clamp(((v>>8)&255)*k,0,255)|0,b=clamp((v&255)*k,0,255)|0;return`rgb(${r},${g},${b})`};
  function shapes(b){
    const x0=b.gx,y0=b.gy,x1=b.gx+b.w,y1=b.gy+b.dd,h=b.h;
    return{top:[iso(x0,y0,h),iso(x1,y0,h),iso(x1,y1,h),iso(x0,y1,h)],
      left:[iso(x0,y1,h),iso(x1,y1,h),iso(x1,y1,0),iso(x0,y1,0)],
      right:[iso(x1,y0,h),iso(x1,y1,h),iso(x1,y1,0),iso(x1,y0,0)]};
  }
  function inPoly(p,pts){let ins=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])ins=!ins}return ins}
  function draw(){
    c.fillStyle='#0b0716';c.fillRect(0,0,360,260);
    /* tiles */
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const road=(x===3||y===3);
      poly([iso(x,y),iso(x+1,y),iso(x+1,y+1),iso(x,y+1)],road?'#1b1530':((x+y)&1?'#171027':'#1d1530'),null);
    }
    /* road dashes */
    c.fillStyle='#ffb347';for(let i=0;i<N;i++){const a=iso(3.5,i+.45),b=iso(i+.45,3.5);c.fillRect(a[0]-1,a[1]-1,2,1);c.fillRect(b[0]-1,b[1]-1,2,1)}
    /* sort by depth */
    const list=B.slice().sort((a,b)=>(a.gx+a.gy+a.w+a.dd)-(b.gx+b.gy+b.w+b.dd));
    /* cars before buildings that they pass behind is fine at this scale */
    cars.forEach(k=>{const q=((k.p+t*k.s*.06)%1);const along=q*N;const p=iso(3.5,along);const l=Math.floor(along*3)&0;
      c.fillStyle='#000';c.fillRect(p[0]-3,p[1]-1,7,3);c.fillStyle=k.c;c.fillRect(p[0]-3,p[1]-3,6,3);c.fillStyle='#fff';c.fillRect(p[0]+2,p[1]-3,1,1)});
    list.forEach(b=>{
      const s=shapes(b),hv=hover===b;
      const lift=hv?-4:0;
      const mv=pts=>pts.map(p=>[p[0],p[1]+lift]);
      poly(mv(s.left),shade(b.col,.75),'#000');poly(mv(s.right),shade(b.col,.5),'#000');poly(mv(s.top),shade(b.col,hv?1.5:1.15),'#000');
      /* windows */
      if(!b.lot){
        for(let r=0;r<Math.floor(b.h/13)-0;r++)for(let k=0;k<b.dd*2;k++){
          const on=((r*7+k*3+Math.floor(t*.4+r))%5)>1;const gx=b.gx+b.w,gy=b.gy+(k+.3)/2,z=7+r*13;
          const p=iso(gx,gy,z);c.fillStyle=on?b.glow:'#140c22';c.fillRect(p[0]-1,p[1]+lift,2,3);
        }
        const tp=iso(b.gx+b.w/2,b.gy+b.dd/2,b.h+13);
        const blink=(Math.floor(t*1.5)%7)!==0;
        c.fillStyle=blink?b.glow:'#333';c.font='bold 10px "Zen Kaku Gothic New",sans-serif';c.textAlign='center';c.fillText(b.sign,tp[0],tp[1]+lift);
        c.fillStyle=b.glow;c.globalAlpha=.25;c.fillRect(tp[0]-5,tp[1]+3+lift,10,1);c.globalAlpha=1;
      }else{
        c.strokeStyle='#ffb347';c.setLineDash([2,2]);poly(mv(s.top),null,'#ffb347');c.setLineDash([]);
      }
      b._s=s;
    });
    if(hover&&hover._s){
      const all=[].concat(hover._s.top,hover._s.left,hover._s.right);
      const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]-4);
      const pad=4+Math.sin(t*6)*1.2,x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-pad,y1=Math.max(...ys)+pad,L=7;
      c.strokeStyle='#19e3ff';c.lineWidth=1;c.beginPath();
      [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(q=>{c.moveTo(q[0]+q[2]*L,q[1]);c.lineTo(q[0],q[1]);c.lineTo(q[0],q[1]+q[3]*L)});c.stroke();
      c.globalAlpha=.25;c.fillStyle='#19e3ff';const sy=y0+((t*40)%(y1-y0));c.fillRect(x0,sy,x1-x0,1);c.globalAlpha=1;
      c.fillStyle='#19e3ff';c.font='6px "Share Tech Mono",monospace';c.textAlign='left';
      c.fillText('LOCK '+(hover.app?'// OPEN':'// VACANT'),x0,y0-3);
    }
    if(hover){c.fillStyle='rgba(255,255,255,.9)';c.font='8px "Share Tech Mono",monospace';c.textAlign='center';const p=iso(hover.gx+hover.w/2,hover.gy+hover.dd/2,hover.h+30);
      c.fillStyle='#000';c.fillRect(p[0]-hover.n.length*2.4-3,p[1]-7,hover.n.length*4.8+6,10);c.fillStyle='#ffb347';c.fillText(hover.n,p[0],p[1])}
  }
  function pick(e){
    const r=cv.getBoundingClientRect(),p=[(e.clientX-r.left)*360/r.width,(e.clientY-r.top)*260/r.height];
    const order=B.slice().sort((a,b)=>(b.gx+b.gy+b.w+b.dd)-(a.gx+a.gy+a.w+a.dd));
    return order.find(b=>b._s&&(inPoly(p,b._s.top)||inPoly(p,b._s.left)||inPoly(p,b._s.right)))||null;
  }
  cv.addEventListener('pointermove',e=>{const b=pick(e);if(b!==hover){hover=b;cap.textContent=b?b.n+': '+b.d:'Hover a building. The lit ones are open; empty lots are reserved for future projects.';cv.style.cursor=b&&b.app?'pointer':'crosshair'}});
  cv.addEventListener('pointerleave',()=>{hover=null});
  cv.addEventListener('click',e=>{const b=pick(e);if(b&&b.app)openApp(b.app)});
  let raf;function loop(){t+=.016;draw();if(!document.body.contains(win)){cancelAnimationFrame(raf);return}if(!reduce)raf=requestAnimationFrame(loop)}
  draw();if(!reduce)loop();
}

/* ---------- system readout ---------- */
(function(){
  const t0=performance.now(),hex=$('#hex'),up=$('#up'),wn=$('#wn'),cur=$('#cur'),tg=$('#tg');
  const rows=[];const rh=()=>Array.from({length:6},()=>Math.floor(Math.random()*65535).toString(16).padStart(4,'0')).join(' ');
  for(let i=0;i<7;i++)rows.push(rh());
  addEventListener('pointermove',e=>{cur.textContent=String(Math.round(e.clientX)).padStart(4,'0')+','+String(Math.round(e.clientY)).padStart(4,'0')});
  setInterval(()=>{
    const s=Math.floor((performance.now()-t0)/1000);
    up.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    wn.textContent=Object.keys(open).length;
    tg.textContent=(Object.keys(open).pop()||'none').toUpperCase();const pc=$('#pace');if(pc)pc.textContent=((window.__pace||1)).toFixed(1)+'x';
    if(!reduce){rows.shift();rows.push(rh())}
    hex.textContent=rows.join('\n');
  },600);
})();
window.openApp=openApp;
})();

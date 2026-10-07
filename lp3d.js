/* lp3d.js: a tiny flat-shaded low-poly engine for the 2D canvas (no libraries).
   World: x right, y DOWN, z forward. Models are lists of boxes ("parts") with y UP from the feet. */
(function(g){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hex=h=>{const v=parseInt(h.slice(1),16);return[v>>16,(v>>8)&255,v&255]};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]};
const FACES=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];

/* ---------- model builders ---------- */
/* part: p=[x,y,z] bottom-centre, s=[w,h,d], c colour, tp top taper, e emissive, sw swing amp, ph phase,
   ak 'L'|'R' arm key (poseable; any key name works), pk+pv parent joint (child limb: elbow/knee; psw/pph = parent swing when the key is unset), po own pivot override, sp spin, bn bounce amplitude, ya yaw offset */
/* jointed arm: upper arm (key side) + forearm and hand (key 'e'+side, hinged at the elbow) */
const UA=.34,FA=.3,HA=.08;
function arm(side,x,shY,col,o){
  o=o||{};const dz=o.dz||0,ey=shY-UA,k='e'+side,w=o.w||.12,sk=o.skin||'#c98f6b';
  const j={pk:side,pv:[shY,dz]};if(o.psw){j.psw=o.psw;j.pph=o.ph||0}
  const up={p:[x,ey,dz],s:[w,UA,w+.02],c:col,ak:side,e:!!o.e};if(o.sw){up.sw=o.sw;up.ph=o.ph||0}
  return[up,Object.assign({p:[x,ey-FA,dz],s:[w-.01,FA,w+.01],c:col,ak:k,po:[ey,dz],e:!!o.e},j),Object.assign({p:[x,ey-FA-HA,dz],s:[w-.03,HA,w-.02],c:sk,ak:k,po:[ey,dz]},j)];
}
/* items glued to a hand. f: forearm held horizontal (key e+side = -PI/2) so world offsets are used (dy up, dz forward of the hand);
   h: arm hanging, offsets from the hand. item {x,dy,dz,w,h,d,c,e} gives the box centre and WORLD size */
function hold(side,x,shY,items,mode,o){
  o=o||{};const dz0=o.dz||0,ey=shY-UA,k='e'+side,hc=FA+HA/2;
  return items.map(i=>{
    let fy,fz,fh,fd;
    if(mode==='h'){fy=-hc+(i.dy||0);fz=i.dz||0;fh=i.h;fd=i.d}
    else{fy=-(hc+(i.dz||0));fz=i.dy||0;fh=i.d;fd=i.h}
    const q={p:[x+(i.x||0),ey+fy-fh/2,dz0+fz],s:[i.w,fh,fd],c:i.c,ak:k,pk:side,pv:[shY,dz0],po:[ey,dz0]};
    if(i.e)q.e=true;if(o.psw){q.psw=o.psw;q.pph=o.ph||0}return q;
  });
}
function cyHead(L,y,dz){L.push({p:[0,y,dz+.115],s:[.2,.05,.03],c:CYC,e:true});L.push({p:[.08,y+.2,dz-.05],s:[.02,.2,.02],c:'#9aa4b8'});L.push({p:[.08,y+.4,dz-.05],s:[.04,.04,.04],c:'#ff2a3a',e:true})}
function human(o,dz){
  dz=dz||0;const L=[];
  const pant=o.pant||'#15101f',coat=o.coat||'#1a1f3a',skin=o.skin||'#c98f6b',hair=o.hair||'#0d0a14',lg=o.legW||.16;
  L.push({p:[-.11,0,dz],s:[lg,.82,.18],c:CY?'#8a93a8':pant,sw:o.legSw||.55,ph:0,tp:o.legTp});
  L.push({p:[.11,0,dz],s:[lg,.82,.18],c:pant,sw:o.legSw||.55,ph:Math.PI,tp:o.legTp});
  const fem=!!o.fem;
  L.push({p:[0,.78,dz],s:[fem?.4:.46,.72,.26],c:coat,tp:.88});
  if(o.long)L.push({p:[0,.3,dz],s:[.5,.62,.3],c:coat,tp:.82});
  else if(fem)L.push({p:[0,.44,dz],s:[.46,.34,.3],c:o.skirt||coat,tp:.74});
  const as=o.armSw||.5,j=o.j||'';
  [['L',-.3,o.armL,o.armLe,Math.PI],['R',.3,o.armR,o.armRe,0]].forEach(a=>{
    const col=(CY&&a[0]==='L')?'#9aa4b8':(a[2]||coat);
    if(j==='both'||j===a[0])arm(a[0],a[1],1.48,col,{dz:dz,skin:skin,sw:as,psw:as,ph:a[4],e:!!a[3]}).forEach(q=>L.push(q));
    else L.push({p:[a[1],.76,dz],s:[.12,.72,.14],c:col,sw:as,ph:a[4],ak:a[0],e:!!a[3]});
  });
  L.push({p:[0,1.5,dz],s:[.22,.26,.22],c:skin,tp:.82});
  if(CY){cyHead(L,1.57,dz);L.push({p:[0,1.12,dz+.14],s:[.1,.1,.02],c:CYC,e:true});L.push({p:[-.3,.9,dz+.02],s:[.13,.04,.16],c:CYC,e:true})}
  if(fem){L.push({p:[0,1.02,dz-.12],s:[.25,.6,.08],c:hair});L.push({p:[0,1.55,dz+.11],s:[.07,.025,.02],c:'#ff2e88',e:true})}
  if(o.hat==='fedora'){L.push({p:[0,1.72,dz],s:[.44,.04,.44],c:o.hatC||'#3a3028'});L.push({p:[0,1.74,dz],s:[.26,.15,.26],c:o.hatC||'#3a3028',tp:.85})}
  else if(o.hat==='cap'){L.push({p:[0,1.72,dz],s:[.25,.1,.25],c:o.hatC||'#d6246e'});L.push({p:[0,1.72,dz+.16],s:[.22,.03,.14],c:o.hatC||'#d6246e'})}
  else if(o.hat==='wide'){L.push({p:[0,1.72,dz],s:[.52,.04,.52],c:o.hatC||'#222'});L.push({p:[0,1.74,dz],s:[.3,.16,.3],c:o.hatC||'#222',tp:.8})}
  else L.push({p:[0,1.74,dz],s:[.25,.09,.25],c:hair,tp:.9});
  return L;
}
/* a person on a chair, facing +z */
function seated(o){
  const L=[];const pant=o.pant||'#15101f',coat=o.coat||'#1a1f3a',skin=o.skin||'#c98f6b',hair=o.hair||'#0d0a14';
  [-.11,.11].forEach(x=>{L.push({p:[x,.5,.27],s:[.16,.16,.54],c:pant});L.push({p:[x,0,.52],s:[.15,.5,.16],c:pant})});
  L.push({p:[0,.5,0],s:[.48,.72,.27],c:coat,tp:.88});
  L.push({p:[-.3,.5,0],s:[.12,.72,.14],c:coat,ak:'L'});
  L.push({p:[.3,.5,0],s:[.12,.72,.14],c:coat,ak:'R'});
  L.push({p:[0,1.24,0],s:[.22,.26,.22],c:skin,tp:.82});
  const hs=o.hs||'short';
  if(hs==='mohawk')L.push({p:[0,1.5,0],s:[.07,.2,.26],c:hair});
  else if(hs==='bun'){L.push({p:[0,1.48,0],s:[.25,.09,.25],c:hair,tp:.9});L.push({p:[0,1.56,-.04],s:[.1,.1,.1],c:hair})}
  else if(hs==='long'){L.push({p:[0,1.48,0],s:[.26,.09,.26],c:hair,tp:.9});L.push({p:[0,.82,-.1],s:[.24,.68,.08],c:hair})}
  else if(hs==='hood'){L.push({p:[0,1.2,-.02],s:[.3,.34,.28],c:coat,tp:.8})}
  else L.push({p:[0,1.48,0],s:[.25,.09,.25],c:hair,tp:.9});
  if(o.visor)L.push({p:[0,1.34,.11],s:[.21,.06,.04],c:o.acc||'#19e3ff',e:true});
  return L;
}
const M={};let CY=false,CYC='#19e3ff';
M.umbrella=(f)=>{const L=human({coat:f?'#3a2a66':'#202a52',long:true,hair:f?'#2a1020':'#15101f',j:'R',fem:f});
  /* umbrella held in the right fist, pole vertical through it */
  hold('R',.3,1.48,[{dy:.25,w:.03,h:1.3,d:.03,c:'#8a8a99'},{dy:-.12,w:.05,h:.12,d:.05,c:'#4a4a58'},
    {dy:.76,w:1.2,h:.05,d:1.2,c:'#ff7ab6',e:true},{dy:.8,w:1.12,h:.07,d:1.12,c:'#d6246e'},{dy:.87,w:.84,h:.07,d:.84,c:'#d6246e'},
    {dy:.94,w:.5,h:.07,d:.5,c:'#d6246e'},{dy:1.02,w:.1,h:.1,d:.1,c:'#8a8a99'}],'f').forEach(q=>L.push(q));
  return{parts:L,sp:[1.1,1.9],h:2.1,arms:{R:0,eR:-1.57},bub:['…','雨','Rain.','Дождь','비'],gk:'L'}};
M.courier=(f)=>{const L=human({coat:'#0e1d2a',armRe:true,armR:'#19e3ff',pant:'#0a0a12',hair:f?'#19e3ff':'#ff2e88',fem:f,skirt:'#19e3ff'});
  L.push({p:[0,1.55,.11],s:[.2,.07,.05],c:'#19e3ff',e:true});L.push({p:[0,.9,-.19],s:[.36,.5,.16],c:'#222338'});
  L.push({p:[0,1.2,-.28],s:[.3,.05,.02],c:'#ffb347',e:true});return{parts:L,sp:[1.6,2.4],h:1.9,bub:['配達!','Move!','Быстро!','빨리!']}};
M.kimono=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.55,1.1,.42],c:'#7d1330',tp:.55,sw:.04,ph:0});L.push({p:[0,.85,0],s:[.52,.2,.42],c:'#ffb347',e:true});
  L.push({p:[0,1.3,0],s:[.38,.18,.28],c:'#7d1330',tp:.7});
  L.push({p:[0,1.42,0],s:[.2,.25,.2],c:'#ece8f4',tp:.85});L.push({p:[0,1.65,0],s:[.26,.16,.26],c:'#0d0a14',tp:.7});
  L.push({p:[0,1.5,.1],s:[.1,.03,.02],c:'#19e3ff',e:true});if(CY)cyHead(L,1.52,0);
  const sk={skin:'#ece8f4',w:.13};
  arm('L',-.27,1.4,'#7d1330',Object.assign({sw:.06,psw:.06,ph:Math.PI},sk)).forEach(q=>L.push(q));
  arm('R',.27,1.4,'#7d1330',sk).forEach(q=>L.push(q));
  /* parasol in the right hand */
  hold('R',.27,1.4,[{dy:.25,w:.025,h:1.2,d:.025,c:'#6a5a4a'},
    {dy:.62,w:1.0,h:.05,d:1.0,c:'#ff6a5a',e:true},{dy:.67,w:.9,h:.06,d:.9,c:'#e0352b'},{dy:.73,w:.62,h:.06,d:.62,c:'#e0352b'},
    {dy:.79,w:.32,h:.06,d:.32,c:'#e0352b'},{dy:.85,w:.07,h:.1,d:.07,c:'#ffb347'}],'f').forEach(q=>L.push(q));
  return{parts:L,sp:[.5,.9],h:2.0,arms:{R:0,eR:-1.57,eL:-.2},bub:['あら','Ara?','Oh…'],gk:'L'}};
M.dog=()=>{const L=[];
  L.push({p:[0,.36,0],s:[.3,.26,.74],c:'#6b7390',tp:.9});L.push({p:[0,.46,.45],s:[.2,.2,.26],c:'#4b516a',tp:.8});
  L.push({p:[0,.55,.58],s:[.12,.05,.03],c:'#ff2a2a',e:true});
  [[-.1,.28,0],[.1,.28,Math.PI],[-.1,-.28,Math.PI],[.1,-.28,0]].forEach(q=>L.push({p:[q[0],0,q[1]],s:[.07,.4,.07],c:'#2a2d3d',sw:.7,ph:q[2]}));
  L.push({p:[0,.6,-.4],s:[.02,.34,.02],c:'#19e3ff',e:true});return{parts:L,sp:[1.5,2.4],h:.9,bub:['WOOF.EXE','ワン','ГАВ','멍']}};
M.drone=()=>{const L=[];
  L.push({p:[0,0,0],s:[.42,.16,.42],c:'#30344a',tp:.6});L.push({p:[0,-.04,0],s:[.14,.05,.14],c:'#ffb347',e:true});
  [[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(q=>{L.push({p:[q[0],.13,q[1]],s:[.3,.02,.07],c:'#99aadd',sp:1});L.push({p:[q[0]*.5,.05,q[1]*.5],s:[.05,.05,.05],c:'#222'})});
  return{parts:L,sp:[.8,1.5],h:.3,fly:true,bub:['BZZT','ビビ','ЖЖЖ']}};
M.ramen=(f)=>{const L=[];
  L.push({p:[0,.4,0],s:[.95,.55,.6],c:'#5a3a22'});L.push({p:[0,.95,0],s:[1.1,.3,.75],c:'#20161a',tp:.7});
  L.push({p:[.58,.85,0],s:[.2,.3,.2],c:'#ff3a2a',e:true});L.push({p:[-.58,.85,0],s:[.2,.3,.2],c:'#ffb347',e:true});
  L.push({p:[-.5,0,0],s:[.06,.38,.38],c:'#15101a'});L.push({p:[.5,0,0],s:[.06,.38,.38],c:'#15101a'});
  L.push({p:[0,.7,.31],s:[.7,.1,.02],c:'#19e3ff',e:true});
  return{parts:L.concat(human({coat:'#e8e4ee',pant:'#222',hair:f?'#3a2418':'#e8e4ee',j:'both',armSw:.15,fem:f},-.75)),sp:[.3,.5],h:2.0,arms:{L:-1.0,R:-1.15,eL:-.5,eR:-.4},bub:['ラーメン!','Ramen!','Рамен!','라멘!','ราเมน!','Nri ọhụrụ!']}};
M.hotdog=(f)=>{const L=[];
  L.push({p:[0,.35,0],s:[.95,.55,.6],c:'#c8ccd8'});L.push({p:[0,.9,0],s:[1.0,.08,.66],c:'#8a8fa0'});
  L.push({p:[-.5,0,0],s:[.06,.36,.36],c:'#15101a'});L.push({p:[.5,0,0],s:[.06,.36,.36],c:'#15101a'});
  L.push({p:[-.2,.98,.1],s:[.4,.09,.12],c:'#d9a05b'});L.push({p:[-.2,1.04,.1],s:[.44,.06,.08],c:'#c8402a'});
  L.push({p:[.25,.98,.1],s:[.3,.09,.12],c:'#d9a05b'});L.push({p:[.25,1.04,.1],s:[.34,.06,.08],c:'#c8402a'});
  L.push({p:[.4,1.0,-.1],s:[.1,.14,.1],c:'#ffd42a',e:true});L.push({p:[-.4,1.0,-.1],s:[.1,.14,.1],c:'#ff3a2a',e:true});
  L.push({p:[0,.58,.31],s:[.7,.12,.02],c:'#ffb347',e:true});
  L.push({p:[.46,.9,-.2],s:[.03,1.0,.03],c:'#6a5a4a'});
  L.push({p:[.46,1.82,-.2],s:[1.5,.05,1.1],c:'#ff7a4a',e:true});L.push({p:[.46,1.86,-.2],s:[1.4,.1,1.0],c:'#e0352b',tp:.75});L.push({p:[.46,1.95,-.2],s:[.9,.08,.6],c:'#ffd42a'});
  return{parts:L.concat(human({coat:'#e0352b',pant:'#222',hair:f?'#2a1a14':'#111',hat:'cap',hatC:'#ffd42a',j:'both',armSw:.15,fem:f},-.75)),sp:[.3,.5],h:2.1,arms:{L:-1.0,R:-1.15,eL:-.5,eR:-.4},bub:['Hot dogs!','ホットドッグ','Хот-доги!','핫도그!','Suya!','Akara!']}};
M.lover=(f)=>{const L=human(f?{coat:'#ff7ab6',pant:'#3a2a5a',hair:'#2a1020',fem:true,skirt:'#ff7ab6',legSw:.4,armSw:.25}:{coat:'#2a4a8a',pant:'#1a1f3a',hair:'#15101f',legSw:.4,armSw:.25});
  /* a floating heart that pulses above them */
  [[-.06,2.12,.08,.08],[.06,2.12,.08,.08],[0,2.04,.2,.08],[0,1.97,.12,.07],[0,1.92,.05,.05]].forEach(q=>L.push({p:[q[0],q[1],0],s:[q[2],q[3],.05],c:'#ff2e88',e:true,bn:.05}));
  return{parts:L,sp:[.5,.7],h:2.1,bub:['♥','好きだよ','Люблю','사랑해','Ife m','Je t\'aime','♡']}};
M.ripperdoc=(f)=>{CY=true;CYC='#ffb347';const L=human({coat:'#24303e',pant:'#1a1f2a',hair:f?'#c8d0e0':'#2a2a30',hat:'cap',hatC:'#3a4a5a',fem:f,armSw:.4});CY=false;
  /* two extra mechanical arms, a toolbox on the back and a welding torch */
  [[-.4,.5,Math.PI],[.4,.5,0]].forEach(q=>{L.push({p:[q[0],.98,.02],s:[.06,.55,.07],c:'#9aa4b8',sw:q[1],ph:q[2]+1.2,ak:'X'+(q[0]<0?'L':'R')});L.push({p:[q[0],.9,.02],s:[.07,.08,.09],c:'#ffb347',e:true,sw:q[1],ph:q[2]+1.2,ak:'X'+(q[0]<0?'L':'R')})});
  L.push({p:[0,.85,-.21],s:[.34,.28,.14],c:'#cc3a2a'});L.push({p:[0,1.12,-.21],s:[.14,.04,.05],c:'#8a93a8'});
  L.push({p:[0,1.58,.12],s:[.24,.05,.03],c:'#ffb347',e:true});
  return{parts:L,sp:[.5,.9],h:2.0,bub:['Upgrade?','改造どう?','Апгрейд?','개조 해요?','Nwere m ike!','Chrome, cheap.']}};
M.netrunner=(f)=>{CY=true;CYC='#ff2e88';const L=human({coat:'#1a0f2a',pant:'#0a0a12',hair:'#19e3ff',fem:f,armSw:.3});CY=false;
  L.push({p:[0,1.38,0],s:[.32,.4,.3],c:'#1a0f2a',tp:.8});
  /* jack cable down the back and a floating holo-deck */
  L.push({p:[0,.5,-.16],s:[.03,.9,.03],c:'#ff2e88',e:true});
  L.push({p:[.5,1.1,.22],s:[.5,.34,.025],c:'#19e3ff',e:true,bn:.04});L.push({p:[.5,1.1,.2],s:[.56,.4,.02],c:'#10142a',bn:.04});
  [[.3,.1],[.2,.2],[.28,.3]].forEach((q,i)=>L.push({p:[.36+(i%2)*.04,1.14+q[1]*.6,.24],s:[q[0]*.5,.025,.02],c:'#ff2e88',e:true,bn:.04}));
  return{parts:L,sp:[.6,1.0],h:1.9,bub:['jacking in…','接続中','Подключаюсь','접속 중','010101','Ping 12ms']}};
M.monk=()=>{const L=[];
  L.push({p:[-.12,0,0],s:[.16,.5,.2],c:'#8a6a3a',sw:.35,ph:0});L.push({p:[.12,0,0],s:[.16,.5,.2],c:'#8a6a3a',sw:.35,ph:Math.PI});
  L.push({p:[0,.3,0],s:[.62,1.0,.4],c:'#d6781e',tp:.6});L.push({p:[0,1.2,0],s:[.5,.3,.3],c:'#d6781e',tp:.78});L.push({p:[0,.74,.12],s:[.5,.1,.2],c:'#ffb347',e:true});
  arm('L',-.32,1.42,'#d6781e',{skin:'#9aa4b8',sw:.3,psw:.3,ph:Math.PI}).forEach(q=>L.push(q));
  arm('R',.32,1.42,'#d6781e',{skin:'#9aa4b8'}).forEach(q=>L.push(q));
  hold('R',.32,1.42,[{dy:-.25,w:.03,h:.6,d:.03,c:'#6a5a4a'},{dy:.1,w:.16,h:.16,d:.16,c:'#ffb347',e:true}],'f').forEach(q=>{if(q.s[1]===.16||q.s[2]===.16)q.sp=1;L.push(q)});
  L.push({p:[0,1.42,0],s:[.23,.28,.23],c:'#9aa4b8',tp:.85});L.push({p:[0,1.58,.115],s:[.05,.05,.03],c:'#ffb347',e:true});
  L.push({p:[-.06,1.5,.115],s:[.04,.03,.02],c:'#19e3ff',e:true});L.push({p:[.06,1.5,.115],s:[.04,.03,.02],c:'#19e3ff',e:true});
  /* halo of light that spins above the head */
  L.push({p:[0,1.86,0],s:[.5,.02,.05],c:'#ffb347',e:true,sp:1});L.push({p:[0,1.86,0],s:[.05,.02,.5],c:'#ffb347',e:true,sp:1});
  return{parts:L,sp:[.4,.7],h:2.1,arms:{R:0,eR:-1.57},gk:'L',bub:['om…','無','Ом…','옴…','Chi.exe','404 ego']}};
M.dealer=(f)=>{const L=human({coat:f?'#3a1f40':'#2a2030',long:true,hat:'wide',hatC:'#17121d',armR:'#ff2a3a',armRe:true,hair:'#111',fem:f});
  L.push({p:[0,.95,.14],s:[.3,.4,.02],c:'#ff2e88',e:true});L.push({p:[0,1.52,.12],s:[.2,.05,.03],c:'#ff2a3a',e:true});
  L.push({p:[-.14,.55,.15],s:[.06,.06,.02],c:'#19e3ff',e:true});L.push({p:[.0,.55,.15],s:[.06,.06,.02],c:'#ffb347',e:true});
  return{parts:L,sp:[0,0],h:1.9,stat:true,bub:['Psst…','チップ?','Чипы?','칩 팔아요','شريحة؟','Chips?']}};
M.preacher=(f)=>{const L=[];
  if(f){L.push({p:[0,1.0,-.13],s:[.27,.62,.08],c:'#2a1a14'});L.push({p:[0,1.5,.11],s:[.07,.025,.02],c:'#ff2e88',e:true})}
  L.push({p:[0,.05,0],s:[.6,1.3,.4],c:'#d8d0c0',tp:.6});L.push({p:[0,1.3,0],s:[.46,.2,.3],c:'#d8d0c0',tp:.8});
  arm('R',.34,1.45,'#d8d0c0',{skin:'#b88a6a'}).forEach(q=>L.push(q));
  arm('L',-.34,1.45,'#d8d0c0',{skin:'#b88a6a'}).forEach(q=>L.push(q));
  L.push({p:[0,1.45,0],s:[.22,.26,.22],c:'#b88a6a',tp:.82});L.push({p:[0,1.62,0],s:[.28,.1,.28],c:'#d8d0c0',tp:.8});if(CY)cyHead(L,1.55,0);
  /* placard held up in the left hand */
  hold('L',-.34,1.45,[{dy:-.05,w:.04,h:1.7,d:.04,c:'#6a5a4a'},{dy:.6,x:-.2,w:.8,h:.52,d:.04,c:'#e8e4ee'},
    {dy:.72,x:-.2,dz:.03,w:.62,h:.07,d:.02,c:'#ff2a2a',e:true},{dy:.6,x:-.2,dz:.03,w:.44,h:.05,d:.02,c:'#ff2a2a',e:true}],'f').forEach(q=>L.push(q));
  return{parts:L,sp:[0,0],h:2.1,stat:true,arms:{L:0,eL:-1.57},gk:'R',bub:['機械を信じるな','NO MACHINES','Никаких машин','기계는 거짓','لا للآلات','मशीनें झूठ']}};
M.robocop=()=>{const L=[];
  L.push({p:[-.14,0,0],s:[.22,.85,.24],c:'#3a4560',sw:.45,ph:0});L.push({p:[.14,0,0],s:[.22,.85,.24],c:'#3a4560',sw:.45,ph:Math.PI});
  L.push({p:[0,.8,0],s:[.7,.8,.38],c:'#46567a',tp:.82});L.push({p:[0,1.38,0],s:[.9,.12,.4],c:'#2e3852'});
  arm('L',-.46,1.42,'#3a4560',{w:.16,skin:'#2a3348',sw:.35,psw:.35,ph:Math.PI}).forEach(q=>L.push(q));
  arm('R',.46,1.42,'#3a4560',{w:.16,skin:'#2a3348',sw:.35,psw:.35,ph:0}).forEach(q=>L.push(q));
  /* baton gripped in the left hand */
  hold('L',-.46,1.42,[{dy:-.05,dz:.06,w:.05,h:.5,d:.05,c:'#222'},{dy:.22,dz:.06,w:.07,h:.08,d:.07,c:'#46567a'}],'h',{psw:.35,ph:Math.PI}).forEach(q=>L.push(q));
  L.push({p:[0,1.48,0],s:[.32,.32,.32],c:'#56688e',tp:.9});L.push({p:[0,1.58,.17],s:[.26,.08,.02],c:'#ffb347',e:true});
  L.push({p:[.18,1.1,.2],s:[.1,.08,.02],c:'#19e3ff',e:true});
  return{parts:L,sp:[.5,.9],h:2.0,age:[2,9],ageUnit:' (serial yrs)',arms:{eL:-.35,eR:-.25},bub:['STOP!','止まれ','СТОЙ!','멈춰!','قف!','Halt.']}};
M.oldlady=()=>{const L=human({coat:'#5b7a52',pant:'#3a3030',skin:'#d8b090',hair:'#e8e4ee',long:true,legSw:.3,armSw:.2,j:'both'});
  L.push({p:[0,1.74,0],s:[.28,.1,.28],c:'#7d3a6a',tp:.9});
  /* a grocery bag in each hand, carried with the arms */
  const o1={psw:.2,ph:0},o2={psw:.2,ph:Math.PI};
  hold('R',.3,1.48,[{dy:-.21,w:.24,h:.34,d:.18,c:'#c8a46a'},{dy:.04,w:.04,h:.2,d:.04,c:'#4cc54a'},{dy:.0,x:.04,w:.05,h:.14,d:.04,c:'#e8a23a'}],'h',o1).forEach(q=>L.push(q));
  hold('L',-.3,1.48,[{dy:-.2,w:.22,h:.3,d:.18,c:'#c8a46a'}],'h',o2).forEach(q=>L.push(q));
  return{parts:L,sp:[.4,.7],h:1.8,sc:.88,age:[68,93],arms:{eL:-.25,eR:-.25},bub:['あらまぁ','My knees…','Ох уж…','아이고','يا ساتر','उफ़']}};
/* fast-food mascot parodies: original archetypes with punny names, picked at random each time */
const MASC=[
 {n:'Sir Patty',leg:'#c8283c',bod:'#ffd42a',say:['Free patties!','バーガー!','Бургер!','버거 공짜!','¡Hamburguesas!'],
  head:L=>{L.push({p:[0,.95,.12],s:[.9,.2,.82],c:'#d89a3a',tp:.82});L.push({p:[0,1.12,.12],s:[.96,.1,.9],c:'#4cc54a'});
   L.push({p:[0,1.2,.12],s:[.92,.16,.86],c:'#6a3a22'});L.push({p:[0,1.34,.12],s:[.9,.28,.82],c:'#e8a23a',tp:.7});
   L.push({p:[-.2,1.18,.54],s:[.14,.14,.02],c:'#fff',e:true});L.push({p:[.2,1.18,.54],s:[.14,.14,.02],c:'#fff',e:true});
   L.push({p:[0,1.0,.55],s:[.4,.05,.02],c:'#c8283c',e:true})}},
 {n:'Chuckles McMunch',leg:'#7c5cff',bod:'#3dff9a',say:['Hee-hee, burgers!','Catch!','Free lunch!','Honk honk!','¡Atrapa!'],
  head:L=>{L.push({p:[0,.98,.05],s:[.5,.5,.46],c:'#f5efe0',tp:.9});
   [[-.34,1.3],[.34,1.3],[-.3,1.52],[.3,1.52],[0,1.58]].forEach(q=>L.push({p:[q[0],q[1],.05],s:[.3,.3,.3],c:'#19e3ff'}));
   L.push({p:[0,1.12,.3],s:[.14,.14,.12],c:'#e0352b',e:true});
   L.push({p:[-.12,1.26,.29],s:[.08,.08,.02],c:'#111',e:true});L.push({p:[.12,1.26,.29],s:[.08,.08,.02],c:'#111',e:true});
   L.push({p:[0,1.02,.29],s:[.3,.05,.02],c:'#e0352b',e:true});
   L.push({p:[-.13,-.06,.1],s:[.26,.1,.42],c:'#ff2e88'});L.push({p:[.13,-.06,.1],s:[.26,.1,.42],c:'#ff2e88'})}},
 {n:'Duke Spud',leg:'#2b3a7a',bod:'#9a1f3a',say:['Fry for the realm!','Royal burgers!','Bow, eat!','Gold for all!','¡Viva el rey!'],
  head:L=>{L.push({p:[0,.98,.05],s:[.46,.46,.42],c:'#d8a37a',tp:.9});
   L.push({p:[0,1.44,.05],s:[.5,.1,.46],c:'#ffd42a'});
   [-.2,0,.2].forEach(x=>L.push({p:[x,1.54,.05],s:[.1,.22,.1],c:'#ffd42a'}));
   L.push({p:[-.1,1.18,.27],s:[.07,.07,.02],c:'#111',e:true});L.push({p:[.1,1.18,.27],s:[.07,.07,.02],c:'#111',e:true});
   L.push({p:[0,1.07,.27],s:[.3,.06,.03],c:'#3a2414'});
   L.push({p:[0,.5,-.2],s:[.6,.8,.06],c:'#e0352b'});
   [-.1,0,.1].forEach(x=>L.push({p:[.46+x,1.28,.25],s:[.05,.34,.05],c:'#ffd42a',e:true}))}},
 {n:'Admiral Drumstick',leg:'#f5efe0',bod:'#1b2a5c',say:['All hands, burgers!','Chicken ahoy!','Catch, sailor!','¡Al abordaje!','À table, matelots!'],
  head:L=>{L.push({p:[0,1.0,.05],s:[.46,.5,.44],c:'#c8782a',tp:.9});L.push({p:[0,1.5,.05],s:[.22,.2,.2],c:'#c8782a'});
   L.push({p:[-.06,1.66,.05],s:[.1,.12,.1],c:'#f5efe0'});L.push({p:[.06,1.66,.05],s:[.1,.12,.1],c:'#f5efe0'});
   L.push({p:[0,1.3,.05],s:[.62,.1,.5],c:'#f5efe0'});L.push({p:[0,1.38,.05],s:[.4,.1,.36],c:'#f5efe0'});
   L.push({p:[-.1,1.12,.27],s:[.07,.07,.02],c:'#111',e:true});L.push({p:[.1,1.12,.27],s:[.07,.07,.02],c:'#111',e:true});
   L.push({p:[0,1.0,.27],s:[.22,.05,.02],c:'#111',e:true})}},
 {n:'Señor Crunch',leg:'#3a2a1a',bod:'#e0352b',say:['¡Crunch time!','Taco-bout free burgers!','¡Ándale!','Tacos y burgers!','Free grub!'],
  head:L=>{L.push({p:[0,.98,.05],s:[.9,.12,.5],c:'#f0b840'});L.push({p:[0,1.1,.05],s:[.84,.2,.46],c:'#f0b840'});
   L.push({p:[0,1.3,.05],s:[.72,.2,.4],c:'#f0b840'});L.push({p:[0,1.48,.05],s:[.5,.16,.3],c:'#f0b840'});
   L.push({p:[0,1.18,.3],s:[.7,.12,.06],c:'#4cc54a'});L.push({p:[-.2,1.22,.34],s:[.18,.1,.04],c:'#e0352b'});
   L.push({p:[0,1.34,.3],s:[.56,.08,.04],c:'#111',e:true});L.push({p:[0,1.12,.32],s:[.3,.05,.02],c:'#111',e:true})}},
 {n:'Papa Pepperoni',leg:'#f5efe0',bod:'#f5efe0',say:['Mamma mia, burgers!','Fresh from the oven!','Pizza? No, burgers!','Bellissimo!','Mangia!'],
  head:L=>{L.push({p:[0,1.5,.05],s:[.9,.14,.4],c:'#f0b840'});L.push({p:[0,1.36,.05],s:[.7,.14,.4],c:'#f0b840'});
   L.push({p:[0,1.22,.05],s:[.5,.14,.4],c:'#f0b840'});L.push({p:[0,1.08,.05],s:[.3,.14,.4],c:'#f0b840'});
   L.push({p:[0,.96,.05],s:[.14,.14,.4],c:'#f0b840'});
   L.push({p:[-.18,1.44,.26],s:[.16,.16,.02],c:'#c8283c',e:true});L.push({p:[.2,1.38,.26],s:[.14,.14,.02],c:'#c8283c',e:true});
   L.push({p:[0,1.18,.26],s:[.14,.14,.02],c:'#c8283c',e:true});
   L.push({p:[0,1.66,.05],s:[.5,.22,.4],c:'#f5efe0'});
   L.push({p:[-.1,1.28,.27],s:[.06,.06,.02],c:'#111',e:true});L.push({p:[.1,1.28,.27],s:[.06,.06,.02],c:'#111',e:true})}},
 {n:'Dunk-O',leg:'#ff2e88',bod:'#19e3ff',say:['Glazed and amazed!','Free burgers, no hole!','Dunk it!','Sweet deal!','¡Rosquilla!'],
  head:L=>{L.push({p:[-.3,.98,.05],s:[.3,.6,.5],c:'#e8b86a'});L.push({p:[.3,.98,.05],s:[.3,.6,.5],c:'#e8b86a'});
   L.push({p:[0,.98,.05],s:[.3,.18,.5],c:'#e8b86a'});L.push({p:[0,1.4,.05],s:[.3,.18,.5],c:'#e8b86a'});
   L.push({p:[-.3,1.4,.05],s:[.3,.18,.5],c:'#ff2e88'});L.push({p:[.3,1.4,.05],s:[.3,.18,.5],c:'#ff2e88'});
   L.push({p:[-.3,1.52,.05],s:[.3,.1,.5],c:'#ff2e88'});L.push({p:[.3,1.52,.05],s:[.3,.1,.5],c:'#ff2e88'});
   [[-.3,1.56],[.28,1.58],[-.1,1.5],[.12,1.6]].forEach((q,i)=>L.push({p:[q[0],q[1]+.04,.3],s:[.06,.03,.06],c:['#ffd42a','#fff','#3dff9a','#19e3ff'][i],e:true}));
   L.push({p:[-.3,1.12,.3],s:[.08,.08,.02],c:'#111',e:true});L.push({p:[.3,1.12,.3],s:[.08,.08,.02],c:'#111',e:true})}},
 {n:'Sir Slurps-a-lot',leg:'#e0352b',bod:'#f5efe0',say:['Shake it, grab it!','Slurp slurp!','Brain freeze burgers!','Cherry on top!','¡Batido!'],
  head:L=>{L.push({p:[0,.98,.05],s:[.5,.12,.5],c:'#e0352b'});L.push({p:[0,1.1,.05],s:[.62,.14,.58],c:'#f5efe0'});
   L.push({p:[0,1.24,.05],s:[.7,.14,.64],c:'#e0352b'});L.push({p:[0,1.38,.05],s:[.78,.14,.7],c:'#f5efe0'});
   L.push({p:[0,1.5,.05],s:[.72,.1,.64],c:'#ffd0e0'});
   L.push({p:[0,1.58,.05],s:[.12,.12,.12],c:'#e0352b',e:true});L.push({p:[.12,1.72,.05],s:[.05,.34,.05],c:'#3dff9a'});
   L.push({p:[-.14,1.22,.4],s:[.1,.1,.02],c:'#111',e:true});L.push({p:[.14,1.22,.4],s:[.1,.1,.02],c:'#111',e:true});
   L.push({p:[0,1.1,.4],s:[.26,.05,.02],c:'#111',e:true})}},
 {n:'Cluck Rogers',leg:'#ffb347',bod:'#f5efe0',say:['Bawk bawk, burgers!','Cluck yeah!','Beak to the future!','Egg-cellent!','¡Pío pío!'],
  head:L=>{L.push({p:[0,.98,.05],s:[.54,.5,.5],c:'#f5efe0',tp:.9});
   L.push({p:[0,1.5,.05],s:[.1,.2,.2],c:'#e0352b'});L.push({p:[0,1.46,.15],s:[.1,.12,.1],c:'#e0352b'});
   L.push({p:[0,1.1,.34],s:[.14,.1,.14],c:'#ffb347',e:true});L.push({p:[0,.98,.3],s:[.1,.14,.08],c:'#e0352b'});
   L.push({p:[-.13,1.26,.31],s:[.07,.07,.02],c:'#111',e:true});L.push({p:[.13,1.26,.31],s:[.07,.07,.02],c:'#111',e:true})}}
];
M.mascot=()=>{const V=MASC[Math.floor(Math.random()*MASC.length)],L=[];
  L.push({p:[-.13,0,0],s:[.18,.55,.2],c:V.leg,sw:.5,ph:0});L.push({p:[.13,0,0],s:[.18,.55,.2],c:V.leg,sw:.5,ph:Math.PI});
  L.push({p:[0,.5,0],s:[.5,.55,.3],c:V.bod,tp:.9});
  L.push({p:[-.34,.52,0],s:[.14,.5,.15],c:V.bod,ak:'L',sw:.3,ph:Math.PI});L.push({p:[.34,.52,0],s:[.14,.5,.15],c:V.bod,ak:'R',sw:.3,ph:0});
  V.head(L);
  return{parts:L,sp:[.5,.8],h:1.8,mname:V.n,bub:V.say}};
M.kidball=(f)=>{const L=human({coat:f?'#d6246e':'#2b6fd6',pant:'#222',hair:'#111',hat:'cap',hatC:f?'#19e3ff':'#e0352b',legSw:.7,armSw:.6,j:'R',fem:f});
  /* basketball: orange body with black seams (all parts bounce together) */
  const bx=.32,by=.5,bz=.42,B=.2,K='#241208';
  L.push({p:[bx,by,bz],s:[B,B,B],c:'#ff8a2a',bn:.2,tp:.88});
  L.push({p:[bx,by+B*.46,bz],s:[B+.012,.026,B+.012],c:K,bn:.2});
  L.push({p:[bx,by,bz],s:[.026,B,B+.012],c:K,bn:.2});
  L.push({p:[bx,by,bz],s:[B+.012,B,.026],c:K,bn:.2});
  return{parts:L,sp:[.6,1.0],h:1.1,sc:.62,age:[8,12],arms:{R:-.3,eR:-.5},drib:true,bub:['バスケ!','Swish!','Мяч!','농구!']}};
M.detective=(f)=>{const L=human({coat:f?'#6a5a7a':'#8a7a5a',pant:'#2a2620',long:true,hat:'fedora',hatC:'#4a3a2a',armR:f?'#6a5a7a':'#8a7a5a',j:'R',fem:f,hair:'#4a2a1a'});
  hold('R',.3,1.48,[{dy:.1,dz:.02,w:.16,h:.22,d:.03,c:'#e8e4d0'},{dy:.2,dz:.03,w:.12,h:.02,d:.01,c:'#19e3ff',e:true}],'f').forEach(q=>L.push(q));
  L.push({p:[0,1.44,.12],s:[.2,.04,.02],c:'#19e3ff',e:true});
  return{parts:L,sp:[.6,1.0],h:1.9,det:true,arms:{R:0,eR:-1.57},gk:'L',bub:['Seen this face?','この顔を?','Вы видели?','본 적 있나요?','هل رأيته؟','¿La viste?']}};
M.samurai=()=>{const L=human({coat:'#eae6f0',pant:'#eae6f0',legW:.26,legTp:.9,hair:'#0d0a14',skin:'#d0a07a',j:'R'});
  L.push({p:[0,.74,0],s:[.5,.14,.3],c:'#15101a'});L.push({p:[0,1.74,-.04],s:[.1,.14,.1],c:'#0d0a14'});
  /* bokken gripped in the right fist, point resting down in front */
  hold('R',.3,1.48,[{dy:-.52,w:.05,h:1.0,d:.05,c:'#a9763c'},{dy:.1,w:.055,h:.22,d:.055,c:'#2a1a10'},{dy:-.02,w:.17,h:.04,d:.07,c:'#2a1a10'}],'f').forEach(q=>L.push(q));
  return{parts:L,sp:[.7,1.1],h:1.9,arms:{R:0,eR:-1.57},gk:'L',bub:['道','Honor.','Честь','도','شرف']}};
M.sage=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.66,1.3,.44],c:'#4f6a8c',tp:.62});L.push({p:[0,1.3,0],s:[.5,.2,.32],c:'#4f6a8c',tp:.8});
  L.push({p:[-.36,.9,0],s:[.12,.55,.14],c:'#4f6a8c',ak:'L'});
  arm('R',.36,1.45,'#4f6a8c',{skin:'#d8b090'}).forEach(q=>L.push(q));
  L.push({p:[0,1.45,0],s:[.22,.26,.22],c:'#d8b090',tp:.82});L.push({p:[0,1.62,0],s:[.32,.14,.32],c:'#4f6a8c',tp:.8});if(CY)cyHead(L,1.55,0);
  L.push({p:[0,1.12,.13],s:[.2,.42,.08],c:'#f2f2f6',tp:.4});L.push({p:[0,1.62,.12],s:[.22,.04,.04],c:'#f2f2f6'});
  /* staff planted on the ground, held in the right hand */
  hold('R',.36,1.45,[{dy:-.13,w:.045,h:1.96,d:.045,c:'#6a4a2a'},{dy:.93,w:.15,h:.15,d:.15,c:'#19e3ff',e:true}],'f').forEach(q=>L.push(q));
  return{parts:L,sp:[0,0],h:2.1,stat:true,age:[84,420],arms:{R:0,eR:-1.57},gk:'L',bub:['Hmm…','ふむ','Хм…','음…']}};
M.sageF=()=>{const L=[];
  L.push({p:[0,.05,0],s:[.7,1.25,.46],c:'#7a4f8a',tp:.6});L.push({p:[0,1.25,0],s:[.56,.22,.34],c:'#a07ab0',tp:.8});
  L.push({p:[-.36,.9,0],s:[.12,.55,.14],c:'#7a4f8a',ak:'L'});
  arm('R',.36,1.45,'#7a4f8a',{skin:'#c89a78'}).forEach(q=>L.push(q));
  L.push({p:[0,1.42,0],s:[.22,.26,.22],c:'#c89a78',tp:.82});L.push({p:[0,1.62,0],s:[.26,.1,.26],c:'#f2f2f6',tp:.85});L.push({p:[0,1.72,-.03],s:[.14,.12,.14],c:'#f2f2f6'});if(CY)cyHead(L,1.5,0);
  L.push({p:[0,1.52,.12],s:[.2,.05,.03],c:'#ffb347',e:true});
  /* lantern cane */
  hold('R',.36,1.45,[{dy:-.5,w:.04,h:1.1,d:.04,c:'#6a4a2a'},{dy:.14,w:.13,h:.2,d:.13,c:'#ffb347',e:true}],'f').forEach(q=>L.push(q));
  return{parts:L,sp:[0,0],h:2.0,stat:true,age:[84,420],arms:{R:0,eR:-1.57},gk:'L',bub:['Ah…','あらあら','Ох…','어이구']}};
M.kidrun=(f)=>{const L=human({coat:f?'#ff7ab6':'#ffd42a',pant:'#2a3a6a',hair:'#3a2418',legSw:1.1,armSw:1.0,legW:.18,fem:f});
  L.push({p:[0,.9,-.17],s:[.26,.3,.1],c:'#ffd42a'});
  return{parts:L,sp:[5,6.5],h:1.1,sc:.62,age:[7,11],run:true,bub:['速っ!','Zoom!','Бегу!','달려!']}};

/* ---------- compile + build ---------- */
function compile(parts){return parts.map(p=>Object.assign({},p,{rgb:hex(p.c)}))}
function build(ent,cam){
  const polys=[],glows=[];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  const cos=Math.cos(ent.yaw||0),sin=Math.sin(ent.yaw||0),sc=ent.sc||1,sw=ent.sw||1,sh=ent.sh||1,zc=ent.z,P=cam.P;
  const fogk=cam.fogK?cam.fogK(zc):0,fc=cam.fogC||[0,0,0],holo=ent.holo,tint=ent.tint;
  const baseY=ent.y==null?cam.floorY:ent.y,mir=ent.mir,el=(ent.elev||0)+(ent.bob||0),clock=ent.clock||0;
  const arms=ent.arms||{};
  ent.parts.forEach(pt=>{
    const px=pt.p[0],py=pt.p[1],pz=pt.p[2],w=pt.s[0],h=pt.s[1],d=pt.s[2],tp=pt.tp==null?1:pt.tp;
    const vs=[];
    let by=0;if(pt.bn)by=Math.abs(Math.sin(clock*7))*pt.bn;
    for(let k=0;k<8;k++){
      const top=k>=4,q=k&3,sx=(q===0||q===3)?-1:1,sz=q<2?-1:1;
      let x=sx*(top?w*tp:w)/2,y=top?h:0,z=sz*(top?d*tp:d)/2;
      x+=px;y+=py+by;z+=pz;
      let a=0;
      if(pt.ak&&arms[pt.ak]!=null)a=arms[pt.ak];else if(pt.sw)a=Math.sin((ent.ph||0)+pt.ph)*pt.sw;
      if(a){const pv=pt.po?pt.po[0]:py+h,pw=pt.po?pt.po[1]:pz,yy=y-pv,zz=z-pw;y=pv+yy*Math.cos(a)-zz*Math.sin(a);z=pw+yy*Math.sin(a)+zz*Math.cos(a)}
      if(pt.pk){const a1=arms[pt.pk]!=null?arms[pt.pk]:(pt.psw?Math.sin((ent.ph||0)+(pt.pph||0))*pt.psw:0);if(a1){const pv1=pt.pv[0],pz1=pt.pv[1],y1=y-pv1,z1=z-pz1;y=pv1+y1*Math.cos(a1)-z1*Math.sin(a1);z=pz1+y1*Math.sin(a1)+z1*Math.cos(a1)}}
      if(pt.sp){const a2=clock*25,xx=x-px,zz=z-pz;x=px+xx*Math.cos(a2)-zz*Math.sin(a2);z=pz+xx*Math.sin(a2)+zz*Math.cos(a2)}
      if(ent.pt||ent.rl){const hv=.82;
        if(ent.pt){const yy=y-hv,cp=Math.cos(ent.pt),sp=Math.sin(ent.pt);y=hv+yy*cp-z*sp;z=yy*sp+z*cp}
        if(ent.rl){const yy=y-hv,cr=Math.cos(ent.rl),sr=Math.sin(ent.rl);const nx=x*cr-yy*sr;y=hv+x*sr+yy*cr;x=nx}}
      const X=x*cos+z*sin,Z=-x*sin+z*cos;
      vs.push([ent.x+X*sc*sw,mir?(baseY+(y+el)*sc*sh):(baseY-(y+el)*sc*sh),zc+Z*sc*sw]);
    }
    if(vs.some(v=>v[2]<.35))return;
    const cen=vs.reduce((a,v)=>[a[0]+v[0]/8,a[1]+v[1]/8,a[2]+v[2]/8],[0,0,0]);
    FACES.forEach(fi=>{
      const v0=vs[fi[0]],v1=vs[fi[1]],v2=vs[fi[2]],v3=vs[fi[3]];
      const fc2=[(v0[0]+v2[0])/2,(v0[1]+v2[1])/2,(v0[2]+v2[2])/2];
      let n=nrm(cross(sub(v1,v0),sub(v2,v0)));
      if(dot(n,sub(fc2,cen))<0)n=[-n[0],-n[1],-n[2]];
      if(!mir&&!holo&&dot(n,fc2)>=0)return;
      const pts=fi.map(i=>P(vs[i][0],vs[i][1],vs[i][2]));
      for(const p of pts){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]}
      const zz=(v0[2]+v1[2]+v2[2]+v3[2])/4;
      if(holo){polys.push({z:zz,pts,holo:true});return}
      let r,gg,b;
      if(pt.e){r=pt.rgb[0];gg=pt.rgb[1];b=pt.rgb[2]}
      else{
        const m=(cam.amb||[.16,.16,.2]).slice();
        for(const Lg of cam.lights){const dd=Math.max(0,dot(n,Lg.d))*Lg.k;m[0]+=dd*Lg.c[0]/255;m[1]+=dd*Lg.c[1]/255;m[2]+=dd*Lg.c[2]/255}
        r=pt.rgb[0]*m[0];gg=pt.rgb[1]*m[1];b=pt.rgb[2]*m[2];
      }
      if(tint){r+=(tint[0]-r)*tint[3];gg+=(tint[1]-gg)*tint[3];b+=(tint[2]-b)*tint[3]}
      r+=(fc[0]-r)*fogk;gg+=(fc[1]-gg)*fogk;b+=(fc[2]-b)*fogk;
      polys.push({z:zz,pts,col:`rgb(${r|0},${gg|0},${b|0})`});
    });
    if(pt.e&&!mir){const pp=P(ent.x+(px*cos+pz*sin)*sc*sw,baseY-(py+h/2+el)*sc*sh,zc+(-px*sin+pz*cos)*sc*sw);glows.push([pp,pt.rgb,Math.max(w,h,d)*sc*cam.f/zc])}
  });
  polys.sort((a,b)=>b.z-a.z);
  return{polys,glows,bb:[x0,y0,x1,y1]};
}
function drawEnt(c,ent,cam,alpha){
  const B=build(ent,cam);
  c.globalAlpha=alpha;
  if(ent.holo){
    const H=ent.holo;
    for(const p of B.polys){
      c.beginPath();c.moveTo(p.pts[0][0],p.pts[0][1]);for(let i=1;i<4;i++)c.lineTo(p.pts[i][0],p.pts[i][1]);c.closePath();
      c.fillStyle=`rgba(${H[0]},${H[1]},${H[2]},${H[3]})`;c.fill();
      c.strokeStyle=`rgba(${Math.min(255,H[0]+70)},${Math.min(255,H[1]+70)},${Math.min(255,H[2]+70)},.85)`;c.lineWidth=1;c.stroke();
    }
    c.globalAlpha=1;return B;
  }
  for(const p of B.polys){
    const q=p.pts;c.fillStyle=p.col;
    c.beginPath();c.moveTo(q[0][0],q[0][1]);for(let i=1;i<4;i++)c.lineTo(q[i][0],q[i][1]);c.closePath();c.fill();
    /* the hairline stroke only hides seams between neighbouring faces; on tiny faces it costs more than it shows */
    const bw=Math.max(q[0][0],q[1][0],q[2][0],q[3][0])-Math.min(q[0][0],q[1][0],q[2][0],q[3][0]),bh=Math.max(q[0][1],q[1][1],q[2][1],q[3][1])-Math.min(q[0][1],q[1][1],q[2][1],q[3][1]);
    if(bw*bh>14){c.strokeStyle=p.col;c.lineWidth=.6;c.stroke()}
  }
  c.globalAlpha=1;
  if(!ent.mir&&B.glows.length){
    c.globalCompositeOperation='lighter';
    for(const gl of B.glows){const r=gl[2]*2.6+3,gr=c.createRadialGradient(gl[0][0],gl[0][1],0,gl[0][0],gl[0][1],r);
      gr.addColorStop(0,`rgba(${gl[1][0]},${gl[1][1]},${gl[1][2]},.45)`);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(gl[0][0]-r,gl[0][1]-r,r*2,r*2)}
    c.globalCompositeOperation='source-over';
  }
  return B;
}
/* manga speech bubble in screen space */
function bubble(c,x,y,text,s,kind){
  s=s||1;c.save();
  const wis=kind==='wisdom';
  c.font=`${wis?'italic ':''}700 ${Math.round((wis?14:15)*s)}px "Share Tech Mono","Noto Sans",sans-serif`;
  /* word-wrap long text */
  const lines=[];const maxW=(wis?210:170)*s;
  if(c.measureText(text).width<=maxW)lines.push(text);
  else{let cur='';text.split(' ').forEach(wd=>{const t=cur?cur+' '+wd:wd;if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=wd}else cur=t});if(cur)lines.push(cur)}
  const lh=18*s,tw=Math.max(...lines.map(l=>c.measureText(l).width));
  const w=Math.max(34*s,tw+18*s),h=Math.max(24*s,lines.length*lh+8*s),irate=kind==='irate',r=irate?4:(lines.length>1?10*s:h/2);
  const bx=x-w/2,by=y-h-10*s;
  c.fillStyle=irate?'#fff1f0':(wis?'#f1e6c8':'#f4efe4');c.strokeStyle='#0a0612';c.lineWidth=2.2*s;
  c.beginPath();
  if(irate){
    const n=14;for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2,rr=i%2?.8:1.1,px=x+Math.cos(a)*(w/2+4*s)*rr,py=by+h/2+Math.sin(a)*(h/2+6*s)*rr;i?c.lineTo(px,py):c.moveTo(px,py)}
    c.closePath();
  }else{
    c.moveTo(bx+r,by);c.arcTo(bx+w,by,bx+w,by+h,r);c.arcTo(bx+w,by+h,bx,by+h,r);c.arcTo(bx,by+h,bx,by,r);c.arcTo(bx,by,bx+w,by,r);c.closePath();
  }
  c.fill();c.stroke();
  if(!irate){const f=wis?'#f1e6c8':'#f4efe4';c.beginPath();c.moveTo(x-5*s,by+h-1);c.lineTo(x,by+h+9*s);c.lineTo(x+5*s,by+h-1);c.closePath();c.fillStyle=f;c.fill();c.stroke();c.beginPath();c.moveTo(x-5*s,by+h);c.lineTo(x+5*s,by+h);c.strokeStyle=f;c.lineWidth=3*s;c.stroke()}
  c.fillStyle=irate?'#c8102e':(wis?'#3a2410':'#0a0612');c.textAlign='center';c.textBaseline='middle';
  lines.forEach((l,i)=>c.fillText(l,x,by+h/2+(i-(lines.length-1)/2)*lh+1));
  if(irate){
    const vx=x+w/2-4*s,vy=by-2*s;c.strokeStyle='#e0152b';c.lineWidth=2.4*s;c.lineCap='round';
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(q=>{c.beginPath();c.moveTo(vx+q[0]*3*s,vy+q[1]*3*s);c.lineTo(vx+q[0]*8*s,vy+q[1]*8*s);c.stroke()});
  }
  c.restore();
}
function make(name,fem,cy){CY=!!cy;CYC=['#19e3ff','#ff2e88','#3dff9a','#ffb347'][Math.floor(Math.random()*4)];try{return M[name](fem)}finally{CY=false}}
g.LP={hex,human,seated,make,MODELS:M,compile,build,drawEnt,bubble};
})(typeof window!=='undefined'?window:globalThis);

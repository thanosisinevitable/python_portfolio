(() => {
  'use strict';
  const C = window.PORTFOLIO;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const canvas = $('#world'), backgroundContext = canvas.getContext('2d');
  const actors = $('#actors'), foregroundContext = actors.getContext('2d');
  let ctx = backgroundContext;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GROUND = 610, CARD_BOTTOM = 520, PORTAL_X = 9440, WORLD_END = 9860;
  const stages = [
    { x: 520, title: 'A little friendly competition.', subtitle: 'The classroom quiz · 3rd place', sign: 'THE CLASSROOM QUIZ' },
    { x: 1460, title: 'Better, together.', subtitle: 'The aggregator website · A team effort', sign: 'THE AGGREGATOR' },
    { x: 3480, title: 'Finding my voice.', subtitle: 'Behind the scenes · The website walkthrough', sign: 'BEHIND THE MIC' },
    { x: 5000, title: 'From code to screen.', subtitle: 'The project demo · See it in action', sign: 'SHOW, DON’T TELL' },
    { x: 6200, title: 'Meet Auracards.', subtitle: 'One project · All the pieces', sign: 'THE AURACARDS PROJECT' },
    { x: 7420, title: 'Putting it into words.', subtitle: 'The Medium article · A story to share', sign: 'THE MEDIUM ARTICLE' },
    { x: 8500, title: 'A star worth the journey.', subtitle: 'Continuous assessment · Test no. 2', sign: 'A LITTLE RECOGNITION' }
  ];
  const objects = [
    { id:'quiz', stage:0, x:520, w:480, h:330, type:'photo', file:'quizPhoto', title:'THE CLASSROOM QUIZ', sub:'Our team. Third place.' },
    { id:'group', stage:1, x:1460, w:440, h:330, type:'photo', file:'groupPhoto', title:'THE PEOPLE', sub:'My group & me' },
    { id:'aggregator', stage:1, x:2000, w:500, h:330, type:'photo', file:'aggregatorScreenshot', title:'THE WEBSITE', sub:'Our aggregator, in action' },
    { id:'aggregatorLink', stage:1, x:2600, w:430, h:280, type:'link', title:'GO EXPLORE', sub:'The hosted aggregator website' },
    { id:'recording', stage:2, x:3480, w:480, h:330, type:'photo', file:'recordingPhoto', title:'BEHIND THE MIC', sub:'Recording the walkthrough' },
    { id:'voice', stage:2, x:4060, w:460, h:330, type:'audio', title:'IN MY OWN WORDS', sub:'My website walkthrough' },
    { id:'demo', stage:3, x:5000, w:560, h:376, type:'video', title:'THE PROJECT DEMO', sub:'A little show & tell' },
    { id:'auracards', stage:4, x:6200, w:560, h:392, type:'project', title:'THE AURACARDS PROJECT', sub:'From an idea to something real.' },
    { id:'medium', stage:5, x:7420, w:480, h:280, type:'link', title:'THE MEDIUM ARTICLE', sub:'A story to share' },
    { id:'assessment', stage:6, x:8500, w:500, h:330, type:'photo', file:'assessmentPhoto', title:'CONTINUOUS ASSESSMENT', sub:'Test no. 2 · A star for my answer', reward:true }
  ].map(o => ({...o,baseW:o.w,y:CARD_BOTTOM-o.h,bump:0,hit:false,element:null}));
  const obstacles = [
    {x:1160,y:578,w:45,h:32},{x:1205,y:546,w:45,h:64},{x:1250,y:578,w:45,h:32},
    {x:3190,y:574,w:54,h:36},{x:3265,y:550,w:54,h:60},
    {x:4680,y:576,w:48,h:34},{x:4728,y:542,w:48,h:68},{x:4776,y:576,w:48,h:34},
    {x:5810,y:568,w:64,h:42},{x:7040,y:576,w:48,h:34},{x:7088,y:548,w:48,h:62},
    {x:8080,y:576,w:48,h:34},{x:8128,y:548,w:48,h:62}
  ];
  const enemies = [
    {x:1110,base:1090,range:50,phase:0,alive:true}, {x:3130,base:3120,range:45,phase:2,alive:true},
    {x:4630,base:4620,range:50,phase:3,alive:true}, {x:6960,base:6940,range:55,phase:1,alive:true}
  ];
  const player = {x:220,y:GROUND-52,w:30,h:52,vx:0,vy:0,grounded:true,face:1,sad:0,hurt:0,level:1,jumps:0};
  let mode='start', scale=1, W=1280, H=720, camera=0, introLift=325, night=false, sound=true, paused=false;
  let last=0, clock=0, stageIndex=-1, stars=0, reward=null, particles=[], jumpQueued=false, jumpBuffer=0, nearest=null, toastTimer;
  let audioContext=null, audioBus=null, musicTimer=null, musicStep=0, musicNextTime=0, portalEntering=false, previousFocus=null;
  const musicVoices=new Set();
  const keys = {left:false,right:false};
  let touchGesture=null;
  const glyphs={
    A:['01110','11011','11011','11111','11011','11011','11011'],B:['11110','11011','11011','11110','11011','11011','11110'],C:['01111','11000','11000','11000','11000','11000','01111'],D:['11110','11011','11011','11011','11011','11011','11110'],E:['11111','11000','11000','11110','11000','11000','11111'],F:['11111','11000','11000','11110','11000','11000','11000'],G:['01111','11000','11000','11011','11011','11011','01110'],H:['11011','11011','11011','11111','11011','11011','11011'],I:['11111','00100','00100','00100','00100','00100','11111'],J:['00111','00011','00011','00011','11011','11011','01110'],K:['11011','11011','11110','11100','11110','11011','11011'],L:['11000','11000','11000','11000','11000','11000','11111'],M:['10001','11011','11111','10101','10101','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','11011','11011','11011','11011','11011','01110'],P:['11110','11011','11011','11110','11000','11000','11000'],Q:['01110','11011','11011','11011','11011','11110','01111'],R:['11110','11011','11011','11110','11100','11010','11011'],S:['01111','11000','11000','01110','00011','00011','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['11011','11011','11011','11011','11011','11011','01110'],V:['11011','11011','11011','11011','11011','01110','00100'],W:['11011','11011','11011','11011','11111','11111','11011'],X:['11011','11011','01110','00100','01110','11011','11011'],Y:['11011','11011','11011','01110','00100','00100','00100'],Z:['11111','00011','00110','00100','01100','11000','11111'],"'":['00100','00100','01000','00000','00000','00000','00000'],'[':['01110','01100','01100','01100','01100','01100','01110'],']':['01110','00110','00110','00110','00110','00110','01110'],' ':['00000','00000','00000','00000','00000','00000','00000'],'-':['00000','00000','00000','11111','00000','00000','00000']
  };
  function titleArt(){
    const t=$('#titleArt');t.width=800;t.height=382;
    const c=t.getContext('2d');c.imageSmoothingEnabled=false;
    // Original lettering on a riveted orange title board, inspired by 8-bit title screens.
    c.fillStyle='#181820';c.fillRect(13,18,780,360);
    c.fillStyle='#181820';c.fillRect(3,3,780,360);
    c.fillStyle='#c84c0c';c.fillRect(8,8,770,350);
    c.fillStyle='#fc9838';c.fillRect(12,12,762,5);c.fillRect(12,17,5,334);
    c.fillStyle='#903410';c.fillRect(17,349,757,5);c.fillRect(769,17,5,332);
    [[23,23],[754,23],[23,333],[754,333]].forEach(([x,y])=>{
      c.fillStyle='#181820';c.fillRect(x,y,8,8);c.fillStyle='#ffd8b4';c.fillRect(x,y,5,5);
    });
    const rows=[{text:C.name.toUpperCase()+"'S",u:9,y:35},{text:'PYTHON',u:12,y:128},{text:'PORTFOLIO',u:12,y:235}];
    for(const line of rows){
      const u=Math.min(line.u,690/(line.text.length*6)),uy=u*1.1;
      const layer=document.createElement('canvas');layer.width=800;layer.height=120;
      const l=layer.getContext('2d'),x=(788-(line.text.length*6-1)*u)/2;
      l.fillStyle='#ffdbbf';
      [...line.text].forEach((char,i)=>(glyphs[char]||glyphs[' ']).forEach((row,y)=>[...row].forEach((v,j)=>{
        if(v==='1')l.fillRect(Math.round(x+i*6*u+j*u),Math.round(y*uy),Math.ceil(u),Math.ceil(uy));
      })));
      const shadow=document.createElement('canvas');shadow.width=800;shadow.height=120;
      const sc=shadow.getContext('2d');sc.drawImage(layer,0,0);sc.globalCompositeOperation='source-in';
      sc.fillStyle='#181820';sc.fillRect(0,0,800,120);
      for(let i=1;i<=9;i++)c.drawImage(shadow,i*.65,line.y+i);
      c.drawImage(layer,0,line.y);
    }
    $('#titleText').textContent=`${C.name}'S PYTHON PORTFOLIO`;
    t.setAttribute('aria-label',`${C.name}'s Python Portfolio`);
    document.title=`${C.name}'s Python Portfolio — Pixel Quest`;
  }
  function resize(){
    const bounds=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    if(!bounds.width||!bounds.height)return;
    scale=bounds.height/720;W=bounds.width/scale;H=720;
    for(const [surface,context] of [[canvas,backgroundContext],[actors,foregroundContext]]){
      surface.width=Math.round(bounds.width*dpr);surface.height=Math.round(bounds.height*dpr);
      context.setTransform(dpr*scale,0,0,dpr*scale,0,0);context.imageSmoothingEnabled=false;
    }
    for(const o of objects){
      o.w=Math.min(o.baseW,Math.max(180,W-42));
      if(o.element){o.element.style.width=`${o.w}px`;o.element.style.height=`${o.h}px`;}
    }
  }
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
  function textAt(text,x,y,size=10,color='#181820',align='left'){
    ctx.fillStyle=color;ctx.font=`700 ${size}px QuestMono, monospace`;ctx.textAlign=align;ctx.fillText(text,Math.round(x),Math.round(y));ctx.textAlign='left';
  }
  function cloud(x,y,k=1){
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(k,k);
    const color=night?'#526ba6':'#fff8ed',shade=night?'#334a7f':'#bcd9fc';
    rect(0,16,112,24,shade);rect(9,8,94,28,color);rect(26,-4,32,38,color);rect(58,2,28,32,color);rect(0,17,114,15,color);rect(11,34,92,6,shade);rect(29,-4,26,4,night?'#678397':'#fffdf2');
    ctx.restore();
  }
  function hill(x,y,w,h,color,shade){
    const unit=14;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h*.1);
    for(let i=0;i<=w/unit;i++){const px=i*unit;const dy=-Math.sin(px/w*Math.PI)*h;ctx.lineTo(x+px,y+Math.round(dy/unit)*unit);ctx.lineTo(x+px+unit,y+Math.round(dy/unit)*unit);}ctx.lineTo(x+w,y+50);ctx.lineTo(x,y+50);ctx.fill();
    for(let i=1;i<9;i++){const px=x+w*(.15+i*.075),py=y-Math.sin((px-x)/w*Math.PI)*h*.65;rect(px,py,4,7,shade);}
  }
  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,night?'#101c48':'#5c94fc');sky.addColorStop(1,night?'#25376b':'#5c94fc');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    if(night){for(let i=0;i<54;i++){let x=((i*193+33-camera*.06)%(W+100)+W+100)%(W+100);let y=(i*67)%365+35;rect(x,y,2+(i%2),2+(i%2),i%3?'#d8d7be':'#a0b5bc');}}
    const sunX=W*.82-camera*.025;
    rect(sunX,100+introLift*.05,42,42,night?'#f9edbf':'#fff0b6');rect(sunX-7,108+introLift*.05,56,26,night?'#f9edbf':'#fff0b6');
    if(night){rect(sunX-8,94+introLift*.05,31,37,'#20394f');}else{rect(sunX+10,111+introLift*.05,4,6,'#c84c0c');rect(sunX+27,111+introLift*.05,4,6,'#c84c0c');rect(sunX+10,123+introLift*.05,4,5,'#c84c0c');rect(sunX+27,123+introLift*.05,4,5,'#c84c0c');rect(sunX+14,128+introLift*.05,13,4,'#c84c0c');}
    for(let i=-1;i<6;i++){let x=i*360+90-camera*.12+Math.sin(i*21)*55;const period=2160;while(x<-180)x+=period;while(x>W+250)x-=period;cloud(x,136+(i%3)*69+introLift*.1,(i%2?.83:1.13));}
    for(let i=-1;i<8;i++){
      const x=i*420-camera*.22;hill(x,587+introLift*.25,490,130+(i%3)*27,night?'#355f67':'#54b438',night?'#2f5660':'#259020');
    }
    for(let i=-1;i<11;i++){
      const x=i*300-camera*.4;hill(x,627+introLift*.3,350,105+(i%3)*31,night?'#376b64':'#00a800',night?'#2c5e58':'#008000');
    }
    // A quiet patterned haze gives the world a printed, 8-bit texture.
    ctx.globalAlpha=.07;for(let y=0;y<H;y+=6)rect(0,y,W,1,night?'#071928':'#fff8df');ctx.globalAlpha=1;
  }
  function drawGround(){
    const gy=GROUND+introLift;
    rect(0,gy,W,H-gy,'#c84c0c');rect(0,gy,W,12,night?'#008800':'#80d010');rect(0,gy+12,W,8,'#181820');rect(0,gy+20,W,8,'#fc9838');
    const tile=32,start=Math.floor(camera/tile)*tile;
    for(let x=start;x<camera+W+32;x+=tile){const sx=x-camera;rect(sx,gy+28,30,2,'#602008');rect(sx+30,gy+28,2,31,'#602008');rect(sx+15,gy+60,2,31,'#602008');rect(sx,gy+60,32,2,'#602008');rect(sx+4,gy+33,12,3,'#fc9838');rect(sx+22,gy+44,4,4,'#903410');rect(sx+5,gy+70,6,3,'#ffb46c');}
    for(let i=Math.floor(camera/95);i<(camera+W)/95+1;i++){const x=i*95-camera;rect(x,gy-5,3,6,'#53754b');rect(x+4,gy-9,3,9,'#6a8a50');rect(x+8,gy-4,3,5,'#53754b');}
  }
  function bush(x,y,flower=false){
    const green=night?'#486e51':'#00a800';rect(x,y-13,57,13,green);rect(x+7,y-25,43,14,green);rect(x+20,y-32,18,8,green);rect(x+13,y-20,6,6,night?'#628259':'#80d010');rect(x+35,y-11,5,5,night?'#628259':'#80d010');
    if(flower){rect(x+70,y-20,3,20,'#476f48');rect(x+65,y-27,13,11,'#f3c579');rect(x+69,y-23,5,4,'#d1864b');}
  }
  function icon(type,x,y,k=1,color='#a3b59a'){
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(k,k);
    const p=(a,b,w,h)=>rect(a,b,w,h,color);
    if(type==='star'){drawStar(0,0,28,color);}
    else if(type==='trophy'){p(5,0,20,5);p(7,5,16,12);p(0,3,5,9);p(25,3,5,9);p(4,12,5,4);p(21,12,5,4);p(12,17,6,6);p(6,24,18,4);}
    else if(type==='people'){p(3,2,8,8);p(19,2,8,8);p(0,13,14,12);p(17,13,14,12);p(12,7,7,8);p(10,18,12,10);}
    else if(type==='mic'){p(11,0,10,19);p(7,8,3,13);p(22,8,3,13);p(10,21,12,3);p(14,24,4,5);p(8,29,16,3);}
    else if(type==='audio'){for(let i=0;i<8;i++)p(i*4,14-Math.sin(i*1.8)*7,2,4+Math.abs(Math.sin(i*1.8))*12);}
    else if(type==='play'){p(7,2,5,26);p(12,6,5,18);p(17,10,5,10);p(22,13,5,4);}
    else if(type==='link'){p(12,2,18,3);p(27,5,3,15);for(let i=0;i<5;i++)p(23-i*4,6+i*4,5,5);p(0,8,3,22);p(3,27,21,3);p(21,22,3,5);}
    else {p(0,0,32,4);p(0,4,4,24);p(28,4,4,24);p(0,28,32,4);p(7,10,7,3);p(7,15,12,3);p(7,20,18,3);}
    ctx.restore();
  }
  function drawStar(x,y,size,color='#ffd05e'){
    ctx.save();ctx.translate(x,y);const u=size/24;
    ctx.fillStyle=color;const points=[[10,0,4,6],[7,6,10,3],[0,9,24,4],[4,13,16,4],[7,17,4,7],[14,17,4,7],[10,16,5,4]];for(const p of points)ctx.fillRect(p[0]*u,p[1]*u,p[2]*u,p[3]*u);
    rect(8*u,9*u,2*u,6*u,'#38473b');rect(15*u,9*u,2*u,6*u,'#38473b');ctx.restore();
  }
  function drawCard(o){
    if(!o.element)return;
    const sx=o.x-camera,sy=o.y+introLift-Math.sin(o.bump*Math.PI)*9;
    const visible=mode!=='start'&&sx<W+30&&sx+o.w>-30;
    o.element.hidden=!visible;
    if(!visible)return;
    o.element.style.transform=`translate3d(${Math.round(sx*scale)}px,${Math.round(sy*scale)}px,0) scale(${scale})`;
    o.element.classList.toggle('is-bumped',o.hit);
    if(o.reward&&!o.hit&&mode==='play'){
      textAt('↑ BUMP FOR A SURPRISE',sx+o.w/2,sy-18,10,night?'#fff0cf':'#181820','center');
    }
  }
  const sprite=[
    '.....HHHHHH.....',
    '...HHGGGGGGHH...',
    '..HHGLLGGLLGHH..',
    '..HHSSSSSSSHH...',
    '..HSSSSSKSSSS...',
    '..HCSSSSKSSSSS..',
    '...CCSSSSSSSS...',
    '...TTTTTTTTTT...',
    '..JJYYYYYYYRJJ..',
    '.SSJYYYYYYRJJSS.',
    '.SSYYYYYYRJJJSS.',
    '..JJYYRRRYYYYJ..',
    '...PPRRRRPPPP...',
    '...PPPP..PPPP...',
    '..BBBBB..BBBBB..',
    '.BBBBBB..BBBBBB.'
  ];
  function characterColors(upgraded){
    return {H:'#583725',K:'#263541',S:'#f5bc8e',C:'#d38e64',G:'#5b4034',L:'#7edddc',Y:upgraded?'#ffe089':'#eab841',J:'#ca8432',T:upgraded?'#5fbeb6':'#228782',P:'#394051',B:'#6a4028',R:'#8a5436'};
  }
  function drawPlayer(){
    if(player.hurt>0 && Math.floor(clock*15)%2===0)return;
    const sx=player.x-camera,sy=player.y+introLift;
    const moving=Math.abs(player.vx)>20&&player.grounded,step=moving?Math.sin(clock*16):0;
    ctx.save();ctx.translate(Math.round(sx+player.w/2),Math.round(sy+4));if(player.face<0)ctx.scale(-1,1);ctx.translate(-24,0);
    const colors=characterColors(player.level===2);
    sprite.forEach((row,y)=>[...row].forEach((v,x)=>{if(v!=='.'){let dy=y*3;if(y>=13)dy+=x<8?step*2:-step*2;rect(x*3,dy,3,3,colors[v]);}}));
    if(player.sad>0){
      rect(26,18,5,1,colors.H);rect(24,19,2,2,colors.H);rect(31,19,2,2,colors.H);
      rect(26,14,2,6,'#79b9f5');
    }else {rect(26,19,5,1,'#9d5940');}
    ctx.restore();
    if(player.level===2 && Math.sin(clock*5)>.4){rect(sx-12,sy+9,3,3,'#ffde7b');rect(sx+43,sy+26,3,3,'#ffde7b');}
  }
  function drawEnemy(e){
    const x=e.x-camera;if(x<-50||x>W+50||!e.alive)return;
    const y=GROUND-24+introLift+Math.sin(clock*8+e.phase)*2;
    rect(x+3,y+18,10,6,'#324e48');rect(x+22,y+18,10,6,'#324e48');rect(x,y+8,35,13,'#775784');rect(x+5,y,25,19,'#9a77a0');rect(x+10,y-4,15,5,'#b391ad');rect(x+6,y+4,4,3,'#d9b9c3');rect(x+10,y+10,5,6,'#fff0d2');rect(x+23,y+10,5,6,'#fff0d2');rect(x+12,y+12,2,3,'#2d4546');rect(x+23,y+12,2,3,'#2d4546');
  }
  function drawObstacle(b){
    const x=b.x-camera,y=b.y+introLift;if(x>W||x+b.w<0)return;
    rect(x,y,b.w,b.h,'#181820');rect(x+2,y+2,b.w-4,b.h-4,'#c84c0c');rect(x+4,y+4,b.w-8,4,'#fc9838');rect(x+b.w-7,y+8,3,b.h-13,'#903410');rect(x+7,y+10,3,3,'#ffd8b4');rect(x+7,y+b.h-9,3,3,'#602008');
    if(b.h>45){rect(x+4,y+32,b.w-8,2,'#602008');rect(x+b.w/2,y+33,2,b.h-35,'#602008');}
  }
  function drawSigns(){
    for(let i=0;i<stages.length;i++){
      const x=stages[i].x-camera-125,y=GROUND-88+introLift;
      if(x<-150||x>W+100)continue;
      // A tall checkpoint pennant, clearly different from a mailbox.
      rect(x,y,5,88,'#181820');rect(x+1,y+3,2,80,'#ffd8b4');
      rect(x-3,y-8,11,8,'#181820');rect(x,y-6,5,5,'#ffe15c');
      ctx.fillStyle=i===stageIndex?'#fc9838':'#c84c0c';
      ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x+65,y);ctx.lineTo(x+52,y+23);ctx.lineTo(x+65,y+46);ctx.lineTo(x+5,y+46);ctx.closePath();ctx.fill();
      rect(x+8,y+3,42,3,'#ffb66c');textAt(`0${i+1}`,x+28,y+29,15,'#fff0d8','center');
      rect(x-7,GROUND-5+introLift,19,5,'#7c360c');
    }
  }
  function drawPortal(){
    const x=PORTAL_X-camera,y=GROUND-116+introLift;if(x>W+150||x<-180)return;
    // A ring of light inside a terracotta-and-jade gateway, not a familiar pipe.
    rect(x+3,y-18,112,134,'#181820');rect(x+11,y-10,96,126,'#80d010');rect(x+20,y,78,116,'#00a800');rect(x+27,y+8,64,108,'#005800');
    for(let i=0;i<5;i++){const yy=y+14+i*19;rect(x+31,yy,56,3,stars?'#c0f020':'#496d67');}
    if(stars){ctx.globalAlpha=.25+.13*Math.sin(clock*3);rect(x+26,y+7,66,109,'#80ff20');ctx.globalAlpha=1;for(let i=0;i<5;i++){const yy=y+112-((clock*24+i*25)%111);rect(x+35+(i*17)%45,yy,3,3,'#dfedac');}}
    rect(x-3,y-23,125,12,'#80d010');rect(x+3,y-26,112,4,'#c0f020');rect(x+12,y+116,95,7,'#405a43');
    rect(x+135,y+48,52,28,'#e1c88d');rect(x+146,y+76,5,40,'#7e704d');textAt('→',x+160,y+67,21,'#4f6e48','center');
  }
  function drawReward(){
    if(!reward||stars)return;const x=reward.x-camera,y=reward.y+introLift;
    ctx.save();ctx.translate(x+17,y+17);ctx.rotate(Math.sin(clock*4)*.12);ctx.globalAlpha=.13;rect(-26,-25,52,52,'#ffde83');ctx.globalAlpha=1;drawStar(-18,-18,36);ctx.restore();
  }
  function render(){
    ctx=backgroundContext;
    ctx.clearRect(0,0,W,H);drawBackground();
    // Foreground details belong to world space; the landscape behind has parallax.
    for(let i=0;i<27;i++){const x=i*262+40-camera;if(x>-160&&x<W+160)bush(x,GROUND+introLift,i%3===0);}
    if(mode!=='start'){
      drawGround();drawSigns();obstacles.forEach(drawObstacle);drawPortal();enemies.forEach(drawEnemy);
    }
    ctx=foregroundContext;ctx.clearRect(0,0,W,H);
    if(mode!=='start'){objects.forEach(drawCard);drawReward();drawPlayer();}
    for(const p of particles){rect(p.x-camera,p.y+introLift,p.size,p.size,p.color);}
    if(mode==='start'){
      // Floating keepsakes frame the title without obscuring it.
      ctx.globalAlpha=.8;const ox=W*.13,oy=350;rect(ox,oy+Math.sin(clock)*5,27,27,'#d9b16b');rect(ox+3,oy+3+Math.sin(clock)*5,21,21,'#f2ce86');textAt('?',ox+14,oy+21+Math.sin(clock)*5,20,'#9d7947','center');
      drawStar(W*.87,422+Math.sin(clock*1.3)*7,25,'#ffda82');ctx.globalAlpha=1;
    }
  }
  function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function update(dt){
    if(mode==='transition'){
      introLift+=(0-introLift)*Math.min(1,dt*4.2);
      if(introLift<.5){introLift=0;mode='play';$('#startScreen').hidden=true;$('#startControls').hidden=true;$('#gameStatus').hidden=false;$('#gameCounter').hidden=false;$('#gameUI').hidden=false;$('#adventure').classList.add('playing');updateStage(true);startMusic();}
      return;
    }
    if(mode!=='play'||paused||$('#detailDialog').open||$('#celebration').open)return;
    if(portalEntering){player.vx=0;player.x+=(PORTAL_X+52-player.x)*dt*5;player.y+=dt*75;if(player.y>GROUND-5)showPortfolio(true);return;}
    player.sad=Math.max(0,player.sad-dt);player.hurt=Math.max(0,player.hurt-dt);
    objects.forEach(o=>o.bump=Math.max(0,o.bump-dt*3));
    const input=(keys.right?1:0)-(keys.left?1:0),target=input*255;
    player.vx+=(target-player.vx)*Math.min(1,dt*(input?16:21));
    if(input)player.face=input;
    if(jumpQueued){jumpBuffer=.14;jumpQueued=false;}
    jumpBuffer=Math.max(0,jumpBuffer-dt);
    if(jumpBuffer>0&&(player.grounded||player.jumps<2)){
      const airJump=!player.grounded;
      player.vy=airJump?-560:-665;player.grounded=false;player.jumps++;jumpBuffer=0;
      if(airJump)burst(player.x+15,player.y+player.h,6,'#fff0d8');
      sfx('jump');
    }
    const oldX=player.x,oldY=player.y;player.x=Math.max(35,Math.min(WORLD_END-player.w,player.x+player.vx*dt));
    for(const b of obstacles){if(aabb(player,b)){if(oldX+player.w<=b.x+3){player.x=b.x-player.w;player.vx=0;}else if(oldX>=b.x+b.w-3){player.x=b.x+b.w;player.vx=0;}}}
    player.vy+=1650*dt;player.y+=player.vy*dt;player.grounded=false;
    for(const b of [...obstacles,...objects]){
      if(!aabb(player,b))continue;
      if(player.vy>=0&&oldY+player.h<=b.y+8){player.y=b.y-player.h;player.vy=0;player.grounded=true;}
      else if(player.vy<0&&oldY>=b.y+b.h-10){player.y=b.y+b.h;player.vy=65;if(b.id)bump(b);}
    }
    if(player.y+player.h>=GROUND){player.y=GROUND-player.h;player.vy=0;player.grounded=true;}
    if(player.grounded)player.jumps=0;
    for(const e of enemies){
      if(!e.alive)continue;e.x=e.base+Math.sin(clock*.85+e.phase)*e.range;
      const eb={x:e.x,y:GROUND-26,w:35,h:26};
      if(aabb(player,eb)&&!player.hurt){
        if(oldY+player.h<eb.y+9&&player.vy>0){e.alive=false;player.vy=-340;player.jumps=1;burst(e.x+17,eb.y,10,'#b99bc0');sfx('stomp');}
        else{player.hurt=1.5;player.vx=-player.face*210;player.x-=player.face*36;player.vy=-190;sfx('empty');}
      }
    }
    if(reward&&!stars){
      reward.age+=dt;
      if(reward.age<.65){reward.y-=dt*170;}
      else {reward.vy+=dt*350;reward.y+=reward.vy*dt;reward.x+=reward.vx*dt;if(reward.y>GROUND-35){reward.y=GROUND-35;reward.vy=-115;}const card=objects.find(o=>o.reward);if(reward.x<card.x-110||reward.x>card.x+card.w+110)reward.vx*=-1;}
      if(reward.age>.5&&aabb(player,{x:reward.x-7,y:reward.y-7,w:48,h:48}))collectStar();
    }
    // Frame the entire exhibit while the player is underneath it, including on phones.
    const framed=objects.find(o=>player.x+15>=o.x-20&&player.x+15<=o.x+o.w+20);
    const desired=framed?framed.x+framed.w/2-W/2:player.x-W*.38;
    const targetCamera=Math.max(0,Math.min(WORLD_END-W,desired));camera+=(targetCamera-camera)*Math.min(1,dt*6);
    nearest=objects.filter(o=>Math.abs(o.x+o.w/2-(player.x+player.w/2))<o.w/2+100).sort((a,b)=>Math.abs(a.x+a.w/2-player.x)-Math.abs(b.x+b.w/2-player.x))[0]||null;
    updateStage();updatePortal();
    particles=particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*280;return p.life>0;});
  }
  function updateStage(force=false){
    let n=0;for(let i=0;i<stages.length;i++)if(player.x>stages[i].x-260)n=i;
    if(n===stageIndex&&!force)return;stageIndex=n;const s=stages[n];
    $('#chapterNumber').textContent=`CHECKPOINT 0${n+1} / 07`;$('#chapterTitle').textContent=s.title;$('#chapterSubtitle').textContent=s.subtitle;
  }
  function updatePortal(){
    const near=player.x>PORTAL_X-160;
    $('#gameStatus').classList.toggle('at-portal',near);
    $('#portalStatus').hidden=!near;
    if(near)$('#portalStatus').textContent=stars?'The green portal is open.':'Bump the assessment frame to unlock the portal.';
    $('#portalButton').hidden=!(near&&stars);
  }
  function bump(o){
    o.bump=1;sfx('bump');
    if(o.reward){
      if(!o.hit&&!stars){o.hit=true;reward={x:o.x+o.w/2-18,y:o.y-3,vy:0,vx:48,age:0};burst(o.x+o.w/2,o.y,12,'#ffdb78');sfx('appear');}
    }else{
      o.hit=true;player.sad=1.4;sfx('empty');
    }
  }
  function collectStar(){
    stopMusic();
    stars=1;player.level=2;$('#starCount').textContent='1';burst(player.x,player.y,48,'#ffda76');sfx('star');
    keys.left=keys.right=false;
    $('#celebration').showModal();
  }
  function burst(x,y,count,color){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-.5)*250,vy:-Math.random()*200-40,life:.5+Math.random(),size:2+Math.floor(Math.random()*4),color:i%3===0?'#fff0c0':color});}
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');$('#gameStatus').classList.add('show-message');toastTimer=setTimeout(()=>{$('#toast').classList.remove('visible');$('#gameStatus').classList.remove('show-message');},5000);}
  function ensureAudio(){
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return null;
      if(!audioContext){
        audioContext=new Audio();audioBus=audioContext.createGain();
        audioBus.gain.value=sound?1:0;audioBus.connect(audioContext.destination);
      }
      return audioContext;
    }catch(_){return null;}
  }
  // An original 64-step chiptune. Audio unlocks on Start/Enter, as browsers require.
  const musicMelody=[
    72,0,76,79,76,74,72,67,69,72,76,72,69,67,64,67,
    65,69,72,69,67,72,76,79,77,76,74,71,67,0,74,0,
    72,76,79,84,79,76,74,72,69,72,76,81,76,72,69,67,
    65,69,72,77,76,72,69,65,67,71,74,79,76,74,72,0
  ];
  function musicNote(midi,at,duration,volume,type){
    if(!midi)return;
    const o=audioContext.createOscillator(),g=audioContext.createGain();
    o.type=type;o.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),at);
    g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(volume,at+.008);
    g.gain.exponentialRampToValueAtTime(.0001,at+duration);
    o.connect(g);g.connect(audioBus);musicVoices.add(o);
    o.onended=()=>{musicVoices.delete(o);o.disconnect();g.disconnect();};
    o.start(at);o.stop(at+duration+.015);
  }
  function mediaPlaying(){return $$('audio,video').some(m=>!m.paused&&!m.ended);}
  function startMusic(){
    if(!sound||paused||document.hidden||!['transition','play'].includes(mode)||$('#celebration').open||mediaPlaying())return;
    const audio=ensureAudio();if(!audio||musicTimer!==null)return;
    if(audio.state==='suspended'){audio.resume().then(()=>startMusic()).catch(()=>{});return;}
    musicNextTime=audio.currentTime+.06;
    const schedule=()=>{
      if(musicNextTime<audio.currentTime-.25)musicNextTime=audio.currentTime+.03;
      while(musicNextTime<audio.currentTime+.3){
        const i=musicStep%musicMelody.length;
        musicNote(musicMelody[i],musicNextTime,.175,.016,'square');
        if(i%2===0)musicNote([48,45,41,43,48,45,41,43][Math.floor(i/8)],musicNextTime,.35,.014,'triangle');
        musicStep=(musicStep+1)%musicMelody.length;musicNextTime+=60/132/2;
      }
    };
    schedule();musicTimer=setInterval(schedule,120);
  }
  function stopMusic(){
    if(musicTimer!==null){clearInterval(musicTimer);musicTimer=null;}
    for(const o of musicVoices){try{o.stop();}catch(_){}}
    musicVoices.clear();
  }
  function sfx(type){
    if(!sound)return;
    try{
      const audio=ensureAudio();if(!audio)return;
      if(audio.state==='suspended')audio.resume().catch(()=>{});
      const notes={jump:[250,380],bump:[120],empty:[210,160],appear:[400,600,800],star:[523,659,784,1047,784,1047],stomp:[170,90],start:[330,440,660]}[type]||[400];
      notes.forEach((hz,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.09;o.type='square';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);o.connect(g);g.connect(audioBus);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.15);});
    }catch(_){}
  }
  function start(){
    if(mode!=='start')return;mode='transition';$('#startScreen').classList.add('leaving');$('#worldCards').hidden=false;sfx('start');startMusic();
    if(reducedMotion)introLift=0;
  }
  function pause(value=!paused){if(mode!=='play')return;paused=value;keys.left=keys.right=false;touchGesture=null;jumpQueued=false;jumpBuffer=0;$('#pauseOverlay').hidden=!paused;$('#pauseButton').textContent=paused?'▶':'Ⅱ';$('#pauseButton').setAttribute('aria-label',paused?'Resume game':'Pause game');$('#worldCards').inert=paused;if(paused)stopMusic();else startMusic();}
  function inspect(){
    if(mode!=='play'||paused)return;
    if(player.x>PORTAL_X-160){if(stars){portalEntering=true;nearest=null;$('#portalButton').hidden=true;sfx('appear');}return;}
    if(nearest)openDetail(nearest.id);
  }
  function safeURL(value){if(typeof value!=='string')return null;const v=value.trim();return /^(https?:\/\/|\.\/|assets\/)/i.test(v)?v:null;}
  function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function photo(file,label){
    const path=safeURL(C.files[file]);
    return path?`<img class="portfolio-image" src="${esc(path)}" alt="${esc(label)}" loading="lazy">`:`<div class="placeholder"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h38v32H5zM6 33l11-12 9 9 7-7 10 12"/><path d="M30 15h4v4h-4z"/></svg><span>${esc(label)}</span><small>PHOTO PLACEHOLDER</small></div>`;
  }
  function linkButton(label,value,kind,sub=''){
    const path=safeURL(value);
    return `<${path&&kind!=='pdf'?'a':'button'} class="resource-link" ${path&&kind!=='pdf'?`href="${esc(path)}" target="_blank" rel="noopener noreferrer"`:`data-action="${kind==='pdf'?'pdf':'missing'}" data-label="${esc(label)}"`}><span class="link-icon">${({web:'↗',repo:'&lt;/&gt;',pdf:'▤',video:'▷',ppt:'P'}[kind])||'↗'}</span><span class="resource-copy">${esc(label)}${sub?`<small>${esc(sub)}</small>`:''}</span><span>${path?'↗':'+'}</span></${path&&kind!=='pdf'?'a':'button'}>`;
  }
  function resources(){return `<div class="resource-links">${linkButton('Visit the website',C.links.auracardsWebsite,'web','The hosted Auracards experience')}${linkButton('Explore the source code',C.links.auracardsRepository,'repo','GitHub repository')}${linkButton('Read the project writeup',C.files.projectWriteup,'pdf','View the PDF right here')}${C.links.auracardsDemo?linkButton('Watch the demo',C.links.auracardsDemo,'video','A walkthrough of the project'):'<button class="resource-link" data-detail="demo"><span class="link-icon">▷</span><span class="resource-copy">Watch the demo<small>A walkthrough of the project</small></span><span>↗</span></button>'}${linkButton('View the presentation',C.files.presentation,'ppt','Project slides · PPTX')}</div>`;}
  // A short, generated placeholder tone provides a working audio control without impersonating the student.
  function placeholderAudio(){
    const sampleRate=8000,length=sampleRate*4,buf=new ArrayBuffer(44+length*2),v=new DataView(buf);
    const word=(offset,s)=>[...s].forEach((c,i)=>v.setUint8(offset+i,c.charCodeAt(0)));
    word(0,'RIFF');v.setUint32(4,36+length*2,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,length*2,true);
    for(let i=0;i<length;i++){const t=i/sampleRate,beat=t%1,env=beat<.22?Math.sin(beat/.22*Math.PI)*.07:0,frequency=[523,659,784,659][Math.floor(t)];v.setInt16(44+i*2,Math.sin(t*Math.PI*2*frequency)*env*32767,true);}
    return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
  }
  const audioPlaceholder=placeholderAudio();
  function audioMarkup(){return `<div class="media-shell"><h3>Website walkthrough · Voice note</h3><audio controls preload="metadata" src="${esc(safeURL(C.files.voiceNote)||audioPlaceholder)}"></audio><p class="media-caption">${C.files.voiceNote?'My explanation of the website and its features.':'Audio placeholder · A short four-note chime. My recorded walkthrough will go here.'}</p></div>`;}
  function videoMarkup(){
    const path=safeURL(C.files.projectDemo),poster=safeURL(C.files.demoPoster);
    return `<div class="video-shell"><video controls playsinline preload="metadata" src="${esc(path||'ui/demo-placeholder.mp4')}" ${poster?`poster="${esc(poster)}"`:''} aria-label="Project demonstration video"></video></div>${!path?'<p class="media-caption">Playable video placeholder · My project demo will replace this short clip.</p>':''}`;
  }
  function buildWorldCards(){
    const root=$('#worldCards');
    root.innerHTML=objects.map(o=>{
      let body='';
      if(o.type==='photo')body=`<button class="world-photo" data-detail="${o.id}" aria-label="Enlarge ${esc(o.title.toLowerCase())}">${photo(o.file,o.sub)}</button>`;
      else if(o.type==='audio')body=`<div class="waveform" aria-hidden="true">${[20,45,30,75,95,60,35,80,50,95,65,30,50,20].map(h=>`<i style="height:${h}%"></i>`).join('')}</div>${audioMarkup()}`;
      else if(o.type==='video')body=videoMarkup();
      else if(o.type==='project')body=resources();
      else if(o.id==='medium')body=`<div class="world-link-art"><b>M</b><span>READ · REFLECT · SHARE</span></div>${linkButton('Read my article on Medium',C.links.mediumArticle,'web','My Medium article')}`;
      else body=`<div class="world-link-art"><b>&lt;/&gt;</b><span>THE AGGREGATOR WEBSITE</span></div>${linkButton('Visit the aggregator website',C.links.aggregatorWebsite,'web','Open the hosted website')}`;
      return `<article id="exhibit-${o.id}" class="world-card ${o.reward?'reward-card':''} card-${o.type}" aria-label="${esc(o.title)}" hidden><header class="world-card-head"><span class="exhibit-number">0${o.stage+1}</span><div><h3>${esc(o.title)}</h3><p>${esc(o.sub)}</p></div></header><div class="world-card-body">${body}</div><span class="rivet rivet-tl"></span><span class="rivet rivet-tr"></span><span class="rivet rivet-bl"></span><span class="rivet rivet-br"></span></article>`;
    }).join('');
    objects.forEach(o=>{o.element=$(`#exhibit-${o.id}`);});
    bindContent(root);
    const stopMoving=()=>{keys.left=keys.right=false;player.vx=0;jumpQueued=false;jumpBuffer=0;};
    root.addEventListener('pointerdown',stopMoving);
    root.addEventListener('focusin',stopMoving);
    root.querySelectorAll('audio,video').forEach(m=>m.addEventListener('play',stopMoving));
  }
  const details={
    quiz:{stage:0,title:'The classroom quiz',description:'Our group took third place in a classroom quiz. A small shared win, and the first checkpoint in this Python journey.',body:()=>`${photo('quizPhoto','Our third-place classroom quiz')}<p class="media-caption">Classroom quiz · Team achievement · 3rd place</p>`},
    group:{stage:1,title:'The people behind the project',description:'A place for a photo of me and my group members — the team behind our aggregator website.',body:()=>photo('groupPhoto','My group members & me')},
    aggregator:{stage:1,title:'The aggregator website',description:'A place for a screenshot of the aggregator website we created together.',body:()=>`${photo('aggregatorScreenshot','Our aggregator website')}${linkButton('Open the aggregator website',C.links.aggregatorWebsite,'web','Hosted website')}`},
    aggregatorLink:{stage:1,title:'Explore the aggregator',description:'Take a look at our hosted aggregator website.',body:()=>`${photo('aggregatorScreenshot','The aggregator website')}${linkButton('Open the aggregator website',C.links.aggregatorWebsite,'web','Opens in a new tab when the link is added')}`},
    recording:{stage:2,title:'Behind the microphone',description:'A moment from recording my voice note, explaining the website and its features.',body:()=>`${photo('recordingPhoto','Recording my website walkthrough')}${audioMarkup()}`},
    voice:{stage:2,title:'In my own words',description:'My voice note describing the website and walking through its features.',body:()=>audioMarkup()},
    demo:{stage:3,title:'From code to screen',description:'A demo of the project — a chance to see the work in action.',body:()=>videoMarkup()},
    auracards:{stage:4,title:'The Auracards project',description:'All the pieces of the project, in one place. Explore the live website, source code, writeup, demonstration and presentation.',body:()=>`${C.files.auracardsScreenshot?photo('auracardsScreenshot','The Auracards project'):''}${resources()}`},
    medium:{stage:5,title:'Putting it into words',description:'My Medium article — another part of the learning journey, collected here to read and revisit.',body:()=>`${linkButton('Read my article on Medium',C.links.mediumArticle,'web','Opens in a new tab when the link is added')}<p class="media-caption">A story to share. This checkpoint does not award a star.</p>`},
    assessment:{stage:6,title:'A star for my answer',description:'The screenshot of the star I received for an answer in continuous assessment test no. 2. A little recognition to keep me going.',body:()=>`${photo('assessmentPhoto','My star · Continuous assessment test no. 2')}<p class="media-caption">The one special star in this adventure. In the game, jump and bump this frame to release it.</p>`}
  };
  function openDetail(id){
    const d=details[id];if(!d)return;
    previousFocus=document.activeElement;keys.left=keys.right=false;player.vx=0;
    $('#detailContent').innerHTML=`<div class="detail-head"><p class="eyebrow">CHECKPOINT 0${d.stage+1} / 07</p><h2>${esc(d.title)}</h2><p>${esc(d.description)}</p></div><div class="detail-body">${d.body()}</div>`;
    if(!$('#detailDialog').open)$('#detailDialog').showModal();
    $('#detailDialog').scrollTop=0;bindContent($('#detailContent'));
  }
  function openPDF(){
    previousFocus=document.activeElement;keys.left=keys.right=false;
    const path=safeURL(C.files.projectWriteup);
    $('#detailContent').innerHTML=`<div class="detail-head"><p class="eyebrow">THE AURACARDS PROJECT</p><h2>Project writeup</h2><p>The project documentation, without leaving the portfolio.</p></div><div class="detail-body">${path?`<object data="${esc(path)}" type="application/pdf" class="pdf-frame"><div class="pdf-fallback">Your browser cannot display this PDF inline.<br><a href="${esc(path)}" target="_blank" rel="noopener">Open the project writeup ↗</a></div></object><a class="subtle-button" href="${esc(path)}" target="_blank" rel="noopener">Open PDF in a new tab ↗</a>`:`<div class="pdf-fallback"><svg><use href="#star-icon"/></svg><br>The writeup is on its way.<br><small>This is where the project PDF will be displayed.</small></div>`}<br><button class="subtle-button" data-action="back-project">← Back to Auracards</button></div>`;
    if(!$('#detailDialog').open)$('#detailDialog').showModal();bindContent($('#detailContent'));
  }
  function bindContent(root){
    root.querySelectorAll('audio,video').forEach(m=>{
      m.addEventListener('play',stopMusic);
      m.addEventListener('pause',startMusic);
      m.addEventListener('ended',startMusic);
    });
    root.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.detail)));
    root.querySelectorAll('[data-action="missing"]').forEach(b=>b.addEventListener('click',()=>{
      const old=b.innerHTML;b.innerHTML='<span class="link-icon">…</span><span class="resource-copy">Coming soon<small>This link will be added by the portfolio owner.</small></span>';setTimeout(()=>{if(b.isConnected)b.innerHTML=old;},2400);
    }));
    root.querySelectorAll('[data-action="pdf"]').forEach(b=>b.addEventListener('click',openPDF));
    root.querySelectorAll('[data-action="back-project"]').forEach(b=>b.addEventListener('click',()=>openDetail('auracards')));
    root.querySelectorAll('img.portfolio-image').forEach(im=>im.addEventListener('error',()=>{const fallback=document.createElement('div');fallback.className='pdf-fallback';fallback.textContent='This image could not be loaded. Check the file path in content.js.';im.replaceWith(fallback);}));
  }
  function pinPhoto(id,file,label,angle=-2,caption=''){
    return `<figure class="pin-wrap" style="--tilt:${angle}deg"><span class="thumbtack" aria-hidden="true"></span><button class="pin-photo" data-detail="${id}" aria-label="Enlarge ${esc(label)}">${photo(file,label)}<span class="photo-zoom" aria-hidden="true">↗</span></button><figcaption><span>${esc(caption||label)}</span><span aria-hidden="true">✦</span></figcaption></figure>`;
  }
  function chapterLabel(n,label){return `<p class="chapter-kicker"><span>0${n}</span>${label}</p>`;}
  let portfolioObservers=[];
  function buildPortfolio(){
    portfolioObservers.forEach(o=>o.disconnect());portfolioObservers=[];
    const playLabel=stars?'Replay adventure':'Play adventure';
    $('#portfolio').innerHTML=`
      <nav class="journal-nav" aria-label="Portfolio navigation">
        <a class="journal-brand" href="#portfolioTop"><svg><use href="#star-icon"/></svg><span>${esc(C.name)}'s<small>PYTHON PORTFOLIO</small></span></a>
        <div class="journal-nav-links"><a href="#projects">The work</a><a href="#behind-scenes">The story</a><a href="#achievement">The star</a></div>
        <details class="chapter-menu"><summary>CHAPTERS <span>+</span></summary><div>${[['classroom','The classroom quiz'],['projects','The aggregator'],['behind-scenes','Behind the mic'],['demo','The demo'],['auracards','Auracards'],['medium','The Medium article'],['achievement','The special star']].map(([id,name],i)=>`<a href="#${id}"><span>0${i+1}</span>${name}<b>↗</b></a>`).join('')}</div></details>
        <button class="nav-play" data-replay><span>▶</span> ${stars?'REPLAY':'PLAY'}</button>
      </nav>
      <section class="journal-hero" id="portfolioTop">
        <div class="pixel-cloud cloud-a" aria-hidden="true"></div><div class="pixel-cloud cloud-b" aria-hidden="true"></div>
        <div class="hero-copy"><p class="hero-eyebrow"><span class="tiny-square"></span>Nandan P R, 23MIC0065</p>
          <h1>A little code.<br>A big <em>adventure.</em></h1>
          <p class="hero-about">${esc(C.about)}</p>
          <a class="work-link" href="#classroom">EXPLORE MY WORK <span>↓</span></a>
          <div class="game-nudge"><span class="nudge-arrow" aria-hidden="true">↳</span><p>Prefer the scenic route?<br><button data-replay>${playLabel} →</button></p></div>
        </div>
        <div class="hero-memento"><span class="poster-tape" aria-hidden="true"></span><button class="adventure-poster" data-replay aria-label="${playLabel}: open the game start screen"><span class="poster-heading"><span>WORLD 01</span><span>THE PLAYABLE PORTFOLIO</span></span><canvas id="heroArt" aria-label="A pixel adventurer in a bright landscape"></canvas><span class="poster-caption"><span>TAKE THE SCENIC ROUTE</span><b>PRESS PLAY ▶</b></span></button><span class="poster-sticker">SAME STORY.<br>A LITTLE MORE<br>ADVENTURE.</span><span class="hero-spark spark-one" aria-hidden="true">✦</span><span class="hero-spark spark-two" aria-hidden="true">+</span></div>
        <div class="hero-ground" aria-hidden="true"></div>
      </section>
      <div class="journey-ribbon"><span>LEARN A LITTLE</span><span>✦</span><span>BUILD SOMETHING</span><span>✦</span><span>KEEP GOING</span><span>✦</span><span>COLLECT THE LITTLE WINS</span></div>
      <div class="journal-wall">
        <section class="journal-section quiz-chapter" id="classroom" data-chapter="01 / THE CLASSROOM QUIZ">
          <div class="quiz-photo reveal">${pinPhoto('quiz','quizPhoto','Our third-place classroom quiz',-3,'THE CLASSROOM QUIZ / A SHARED WIN')}<span class="place-stamp">3<sup>rd</sup><small>PLACE!</small></span></div>
          <div class="chapter-copy reveal">${chapterLabel(1,'QUIZ')}<h2>Third place.<br>First little <span class="marker">win.</span></h2><p>A classroom quiz. A group effort. A small reminder that learning is a lot more fun when you do it together.</p><div class="margin-note">Our group won 3rd place.<span aria-hidden="true">↙</span></div></div>
        </section>
        <section class="journal-section team-chapter" id="projects" data-chapter="02 / THE AGGREGATOR">
          <div class="chapter-top reveal"><div>${chapterLabel(2,'THE AGGREGATOR WEBSITE')}<h2>A few minds.<br>One <span class="marker">project.</span></h2></div><p>The people I worked with, the thing we built, and a link to see it for yourself. Every project has a story behind the screen.</p></div>
          <div class="team-pinboard"><div class="reveal">${pinPhoto('group','groupPhoto','My group members & me',-2.5,'01 / THE PEOPLE BEHIND IT')}</div><div class="reveal">${pinPhoto('aggregator','aggregatorScreenshot','Our aggregator website',2.5,'02 / WHAT WE BUILT')}</div><span class="board-doodle" aria-hidden="true">{ together }</span></div>
          <div class="website-ticket reveal"><span class="ticket-icon" aria-hidden="true">&lt;/&gt;</span><div><small>FROM OUR SCREENS TO YOURS</small><p>The aggregator website</p></div>${linkButton('Take a look',C.links.aggregatorWebsite,'web','Open the hosted website')}</div>
        </section>
        <section class="journal-section voice-chapter" id="behind-scenes" data-chapter="03 / BEHIND THE MIC">
          <div class="voice-photo reveal">${pinPhoto('recording','recordingPhoto','Recording my website walkthrough',-3,'BEHIND THE SCENES / RECORDING DAY')}</div>
          <div class="chapter-copy reveal">${chapterLabel(3,'BEHIND THE MIC')}<h2>Built it.<br>Now, <span class="marker">tell it.</span></h2><p>Me recording a voice demo walking through my python project, explaining its features, and putting the project into my own words.</p><div class="cassette"><div class="cassette-top"><span class="record-light"></span><span>FIELD NOTES / TRACK 01</span><span>●</span></div><div class="cassette-window" aria-hidden="true"><span class="tape-reel"></span><div class="tape-wave">${[3,6,9,5,11,7,4,10,6,8,4,6].map(n=>`<i style="--wave:${n}"></i>`).join('')}</div><span class="tape-reel"></span></div>${audioMarkup()}</div></div>
        </section>
      </div>
      <section class="demo-theater" id="demo" data-chapter="04 / THE PROJECT DEMO"><div class="theater-inner"><div class="theater-heading reveal"><div>${chapterLabel(4,'THE PROJECT DEMO')}<h2>A little less talk.<br>A little more <em>demo.</em></h2></div><span class="screen-note">LIGHTS DOWN.<br>PROJECT ON. ↙</span></div><div class="theater-screen reveal"><div class="screen-top"><span class="screen-dots">■ ■ ■</span><span>PROJECT_DEMO.MP4</span><span>▶</span></div>${videoMarkup()}</div><p class="theater-footnote">A look at the project in action. Hit play and take your time.</p></div></section>
      <div class="journal-wall wall-two">
        <section class="journal-section auracards-chapter" id="auracards" data-chapter="05 / THE AURACARDS PROJECT"><div class="project-cover reveal">${chapterLabel(5,'THE FEATURED PROJECT')}<h2>AURA<br>CARDS<span>✦</span></h2><p>An idea, a build, and all the pieces that tell its story.</p>${C.files.auracardsScreenshot?pinPhoto('auracards','auracardsScreenshot','The Auracards project',-2,'THE PROJECT / AT A GLANCE'):'<div class="project-stack" aria-hidden="true"><span>SITE ↗</span><span>&lt;/&gt; CODE</span><span>▤ WRITEUP</span></div>'}<span class="cover-edition">BUILT. DOCUMENTED. PRESENTED.</span></div><div class="project-inventory reveal"><p class="inventory-label">OPEN THE PROJECT FILES <span>↙</span></p>${resources()}<p class="inventory-note">Everything in one place. The writeup opens right here in the portfolio.</p></div></section>
        <section class="journal-section writing-chapter" id="medium" data-chapter="06 / THE MEDIUM ARTICLE"><div class="article-sheet reveal"><span class="sheet-tape" aria-hidden="true"></span>${chapterLabel(6,'A PAGE FROM THE JOURNEY')}<span class="article-m" aria-hidden="true">M<span>·</span></span><h2>Some thoughts<br>deserve a <span class="marker">page.</span></h2><p>One more piece of the learning journey: my article on Medium. A place for the story beyond the project.</p>${linkButton('Read my article on Medium',C.links.mediumArticle,'web','Open the article')}<span class="sheet-footer">WORDS, IDEAS & THINGS I LEARNED.</span></div><div class="writing-aside reveal"><span aria-hidden="true">{ }</span><p>MAKE SOMETHING.<br>LEARN SOMETHING.<br>WRITE IT DOWN.</p><div class="tiny-star"><svg><use href="#star-icon"/></svg></div></div></section>
      </div>
      <section class="earned-star-chapter" id="achievement" data-chapter="07 / THE SPECIAL STAR"><div class="star-sky" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--x:${(i*73+11)%100}%;--y:${(i*47+13)%100}%;--delay:${i%4}s">${i%3?'✦':'+'}</i>`).join('')}</div><div class="earned-star-inner"><div class="star-moment reveal">${chapterLabel(7,'A LITTLE RECOGNITION')}<button class="earned-star-button" id="earnedStarButton" aria-label="Celebrate the star earned in continuous assessment test 2"><svg><use href="#star-icon"/></svg></button><p class="star-interaction">GIVE THE STAR A LITTLE TAP ↑</p><div class="earned-count"><strong>1</strong><span>STAR<br>EARNED.</span></div><p class="earned-context"></p><p class="collected-note"></p></div><div class="star-story reveal"><p>I received a star for an answer in my CAT2 answer paper. A little recognition, and a big reason to keep learning.</p>${pinPhoto('assessment','assessmentPhoto','My assessment star',3,'THE LITTLE WIN / TEST NO. 2')}<p class="star-signoff">Here’s to the next little breakthrough. ✦</p></div></div><div id="starAnnouncement" class="sr-only" role="status"></div></section>
      <footer class="journal-footer"><a href="#portfolioTop" class="footer-wordmark">${esc(C.name)}'s<br>PYTHON PORTFOLIO<span>↑ BACK TO TOP</span></a><div><p></p><button data-replay>${playLabel} <span>▶</span></button></div><small>thank god its over.</small></footer>`;
    bindContent($('#portfolio'));
    $$('#portfolio [data-replay]').forEach(b=>b.addEventListener('click',replay));
    $$('.chapter-menu a').forEach(a=>a.addEventListener('click',()=>$('.chapter-menu').removeAttribute('open')));
    $('.chapter-menu').addEventListener('keydown',e=>{if(e.key==='Escape')e.currentTarget.removeAttribute('open');});
    $$('#portfolio audio').forEach(m=>{
      m.addEventListener('play',()=>m.closest('.cassette')?.classList.add('is-playing'));
      for(const event of ['pause','ended'])m.addEventListener(event,()=>m.closest('.cassette')?.classList.remove('is-playing'));
    });
    $('#earnedStarButton').addEventListener('click',celebratePortfolioStar);
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('is-visible');});},{threshold:.12});
      $$('#portfolio .reveal').forEach(el=>observer.observe(el));portfolioObservers.push(observer);
      const chapters=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){$$('.chapter-menu a').forEach(a=>{const active=a.getAttribute('href')==='#'+e.target.id;a.classList.toggle('is-current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});},{rootMargin:'-15% 0px -55% 0px'});
      $$('#portfolio section[data-chapter]').forEach(el=>chapters.observe(el));portfolioObservers.push(chapters);
    }
  }
  function celebratePortfolioStar(){
    const button=$('#earnedStarButton'),section=$('#achievement');
    if(button.classList.contains('is-shining'))return;
    button.classList.add('is-shining');$('#starAnnouncement').textContent='One star earned in continuous assessment test 2. A little win worth celebrating!';
    for(let i=0;i<28;i++){
      const p=document.createElement('span');p.className='star-confetti';p.setAttribute('aria-hidden','true');
      p.style.setProperty('--dx',`${(Math.random()-.5)*560}px`);p.style.setProperty('--dy',`${-40-Math.random()*300}px`);p.style.setProperty('--spin',`${Math.random()*600}deg`);p.style.setProperty('--color',['#ffcf38','#fc9838','#8bcf75','#fff0d8'][i%4]);
      section.appendChild(p);setTimeout(()=>p.remove(),1300);
    }
    setTimeout(()=>button.classList.remove('is-shining'),1200);
  }
  function drawHeroArt(){
    const h=$('#heroArt');if(!h)return;h.width=480;h.height=360;const c=h.getContext('2d');c.imageSmoothingEnabled=false;
    const r=(x,y,w,hh,color)=>{c.fillStyle=color;c.fillRect(x,y,w,hh);};
    r(0,0,480,360,'#fff0d8');r(0,0,480,220,'#5c94fc');r(355,32,43,43,'#ffe15c');r(365,43,4,5,'#c84c0c');r(384,43,4,5,'#c84c0c');r(365,54,4,5,'#c84c0c');r(384,54,4,5,'#c84c0c');r(369,59,15,4,'#c84c0c');
    [[25,68],[195,35],[340,118]].forEach(([x,y])=>{r(x,y,90,19,'#faf4df');r(x+15,y-14,51,34,'#faf4df');r(x+32,y-23,25,14,'#faf4df');});
    for(let i=0;i<3;i++){c.fillStyle=i%2?'#00a800':'#54b438';c.beginPath();c.moveTo(i*200-70,300);c.lineTo(i*200+20,170-i*15);c.lineTo(i*200+70,170-i*15);c.lineTo(i*200+160,300);c.fill();}
    r(0,293,480,12,'#80d010');r(0,305,480,7,'#4c6c45');r(0,312,480,48,'#c84c0c');for(let x=0;x<480;x+=32){r(x,319,31,2,'#602008');r(x+30,320,2,30,'#602008');}
    const colors=characterColors(!!stars);
    sprite.forEach((row,y)=>[...row].forEach((v,x)=>{if(v!=='.')r(174+x*4,229+y*4,4,4,colors[v]);}));
    r(324,247,6,46,'#756d4e');r(310,238,58,23,'#e0c587');c.font='bold 23px monospace';c.fillStyle='#486346';c.fillText('→',328,257);
    r(270,171,40,40,'#b89050');r(273,174,34,34,'#e4bf75');c.fillStyle='#ffdf88';c.fillRect(342,173,8,23);c.fillRect(334,181,24,8);r(326,281,18,12,'#638955');r(315,286,42,7,'#638955');
  }
  function showPortfolio(throughPortal=false){
    stopMusic();
    mode='portfolio';paused=false;keys.left=keys.right=false;$$('#worldCards audio, #worldCards video').forEach(m=>m.pause());$('#adventure').hidden=true;$('#portfolio').hidden=false;document.body.classList.remove('night');
    $('#detailDialog').close();$('#celebration').close();buildPortfolio();drawHeroArt();window.scrollTo({top:0,behavior:'instant'});
    if(throughPortal){$('#portfolio').animate(reducedMotion?[]:[{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,fill:'both'});}
  }
  function replay(){
    portfolioObservers.forEach(o=>o.disconnect());portfolioObservers=[];
    stopMusic();musicStep=0;
    $$('#portfolio audio, #portfolio video').forEach(m=>m.pause());
    $('#detailDialog').close();$('#celebration').close();clearTimeout(toastTimer);$('#toast').classList.remove('visible');$('#toast').textContent='';
    mode='start';paused=false;portalEntering=false;stars=0;reward=null;particles=[];nearest=null;stageIndex=-1;camera=0;introLift=325;jumpBuffer=0;jumpQueued=false;keys.left=keys.right=false;touchGesture=null;
    Object.assign(player,{x:220,y:GROUND-52,vx:0,vy:0,grounded:true,face:1,sad:0,hurt:0,level:1,jumps:0});objects.forEach(o=>{o.hit=false;o.bump=0;o.element?.classList.remove('is-bumped');});enemies.forEach(e=>e.alive=true);
    $('#portfolio').hidden=true;$('#adventure').hidden=false;$('#gameUI').hidden=true;$('#worldCards').hidden=true;$('#worldCards').inert=false;$('#startControls').hidden=false;$('#portalButton').hidden=true;$('#startScreen').hidden=false;$('#startScreen').classList.remove('leaving');$('#adventure').classList.remove('playing');$('#starCount').textContent='0';$('#pauseOverlay').hidden=true;$('#pauseButton').textContent='Ⅱ';$('#pauseButton').setAttribute('aria-label','Pause game');
    $('#gameStatus').hidden=true;$('#gameCounter').hidden=true;$('#portalStatus').hidden=true;$('#gameStatus').classList.remove('show-message','at-portal');
    $$('#worldCards audio, #worldCards video').forEach(m=>{m.pause();m.currentTime=0;});
    document.body.classList.toggle('night',night);window.scrollTo({top:0,behavior:'instant'});resize();$('#startButton').focus({preventScroll:true});
  }
  function frame(t){const dt=Math.min((t-last)/1000||0,.033);last=t;if(mode!=='portfolio'){if(!paused&&!$('#detailDialog').open&&!$('#celebration').open)clock+=dt;update(dt);render();}requestAnimationFrame(frame);}
  $('#startButton').addEventListener('click',start);
  $$('.browse-button').forEach(b=>b.addEventListener('click',()=>showPortfolio()));
  $('#themeButton').addEventListener('click',()=>{night=!night;document.body.classList.toggle('night',night);$('#themeButton').textContent=night?'☾':'☼';$('#themeButton').setAttribute('aria-label',night?'Switch to day':'Switch to night');});
  $('#soundButton').addEventListener('click',()=>{
    sound=!sound;
    $('#soundButton').setAttribute('aria-label',sound?'Mute music and sound':'Enable music and sound');
    $('#soundButton').setAttribute('aria-pressed',String(sound));
    $('#soundButton').innerHTML=sound?'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8M20 5q7 7 0 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    if(audioBus)audioBus.gain.setTargetAtTime(sound?1:0,audioContext.currentTime,.02);
    if(sound){sfx('start');startMusic();}else stopMusic();
  });
  $('#pauseButton').addEventListener('click',()=>pause());$('#resumeButton').addEventListener('click',()=>pause(false));
  $('#portalButton').addEventListener('click',inspect);
  $('#celebrateContinue').addEventListener('click',()=>{$('#celebration').close();toast('The green portal is open →');});
  $('#celebration').addEventListener('close',startMusic);
  $('.dialog-close').addEventListener('click',()=>$('#detailDialog').close());
  $('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  $('#detailDialog').addEventListener('close',()=>{$$('#detailContent audio, #detailContent video').forEach(m=>m.pause());keys.left=keys.right=false;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
  document.addEventListener('keydown',e=>{
    if($('#detailDialog').open||$('#celebration').open)return;
    if(mode==='start'&&e.code==='Enter'&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='A'){e.preventDefault();start();return;}
    if(mode!=='play')return;
    // Native media controls and resource links retain their normal keyboard behavior.
    if(e.code!=='Escape'&&e.target.closest?.('audio,video,a,button,input,textarea,select,object,iframe,[contenteditable="true"]'))return;
    const handled=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyE','Escape'];
    if(handled.includes(e.code))e.preventDefault();
    if(e.code==='Escape'&&!e.repeat){pause();return;}if(paused)return;
    if(['ArrowLeft','KeyA'].includes(e.code))keys.left=true;
    if(['ArrowRight','KeyD'].includes(e.code))keys.right=true;
    if(['Space','ArrowUp','KeyW'].includes(e.code)&&!e.repeat)jumpQueued=true;
    if((e.code==='KeyE'||(e.code==='ArrowDown'&&player.x>PORTAL_X-160))&&!e.repeat)inspect();
  });
  document.addEventListener('keyup',e=>{if(['ArrowLeft','KeyA'].includes(e.code))keys.left=false;if(['ArrowRight','KeyD'].includes(e.code))keys.right=false;});
  window.addEventListener('blur',()=>{stopMusic();keys.left=keys.right=false;jumpQueued=false;if(mode==='play'&&!$('#detailDialog').open&&!$('#celebration').open)pause(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();keys.left=keys.right=false;if(mode==='play')pause(true);}else startMusic();});
  // Touch gestures keep the level playable without visible movement buttons.
  canvas.addEventListener('pointerdown',e=>{
    if(!['touch','pen'].includes(e.pointerType)||mode!=='play'||paused||$('#detailDialog').open||$('#celebration').open)return;
    e.preventDefault();
    if(touchGesture){jumpQueued=true;return;}
    touchGesture={id:e.pointerId,x:e.clientX,dragged:false};canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!touchGesture||touchGesture.id!==e.pointerId)return;
    const dx=e.clientX-touchGesture.x;
    if(Math.abs(dx)>18){touchGesture.dragged=true;keys.left=dx<0;keys.right=dx>0;}
  });
  canvas.addEventListener('pointerup',e=>{
    if(!touchGesture||touchGesture.id!==e.pointerId)return;
    if(!touchGesture.dragged&&!paused&&mode==='play'&&!$('#detailDialog').open&&!$('#celebration').open)jumpQueued=true;
    keys.left=keys.right=false;touchGesture=null;
  });
  const cancelTouch=e=>{if(touchGesture?.id===e.pointerId){keys.left=keys.right=false;touchGesture=null;}};
  canvas.addEventListener('pointercancel',cancelTouch);canvas.addEventListener('lostpointercapture',cancelTouch);
  canvas.addEventListener('click',e=>{
    if(mode!=='play'||paused)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/scale+camera,y=(e.clientY-r.top)/scale-introLift;
    if(x>PORTAL_X-10&&x<PORTAL_X+140&&y>440&&y<620&&player.x>PORTAL_X-160)inspect();
  });
  window.addEventListener('resize',resize);buildWorldCards();titleArt();showPortfolio();requestAnimationFrame(frame);
})();

/* ═══════════════════════════════════════
   BAHARI BLUETECH — SHARED JAVASCRIPT
═══════════════════════════════════════ */

/* ── Custom Cursor ── */
(function(){
  const c1=document.getElementById('c1'),c2=document.getElementById('c2');
  if(!c1||!c2)return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
  (function tick(){
    c1.style.left=mx+'px';c1.style.top=my+'px';
    rx+=(mx-rx)*.12;ry+=(my-ry)*.12;
    c2.style.left=rx+'px';c2.style.top=ry+'px';
    requestAnimationFrame(tick);
  })();
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('c-big'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('c-big'));
  });
})();

/* ── Nav scroll ── */
(function(){
  const nav=document.getElementById('nav');
  if(!nav)return;
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>60));
  // Highlight active page link
  const path=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.n-links a').forEach(a=>{
    const href=a.getAttribute('href');
    if(href===path||(path===''&&href==='index.html'))a.classList.add('active');
  });
})();

/* ── Scroll reveal ── */
(function(){
  const ro=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add('on');ro.unobserve(e.target);}
    });
  },{threshold:.07});
  document.querySelectorAll('.reveal,.reveal-d,.reveal-d2').forEach(el=>ro.observe(el));
})();

/* ── Counter animation ── */
(function(){
  const metNums=document.querySelectorAll('.met-n');
  if(!metNums.length)return;
  const metObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el=e.target;
        const target=el.textContent;
        if(/^\d/.test(target)){
          const num=parseInt(target);
          let start=0;const dur=1800;const step=dur/60;
          const timer=setInterval(()=>{
            start+=num/60;
            const suffix=target.includes('+')?'+':target.includes('B')?'B':target.slice(String(num).length);
            el.textContent=Math.floor(start)+(start<num?'':suffix);
            if(start>=num){el.textContent=target;clearInterval(timer);}
          },step);
        }
        metObs.unobserve(el);
      }
    });
  },{threshold:.5});
  metNums.forEach(n=>metObs.observe(n));
})();

/* ── Particle canvas (hero) ── */
function initParticleCanvas(id){
  const cv=document.getElementById(id);
  if(!cv)return;
  const ctx=cv.getContext('2d');
  let W,H,pts=[];
  function resize(){
    cv.width=W=cv.parentElement.offsetWidth||window.innerWidth;
    cv.height=H=cv.parentElement.offsetHeight||window.innerHeight;
    init();
  }
  function init(){
    pts=[];
    const n=Math.max(40,Math.floor(W*H/9000));
    for(let i=0;i<n;i++)pts.push({
      x:Math.random()*W,y:Math.random()*H,
      r:Math.random()*1.4+.2,
      vx:(Math.random()-.5)*.14,vy:(Math.random()-.5)*.09,
      a:Math.random()*.4+.05,
      c:Math.random()<.15?'rgba(8,196,168,':'rgba(160,212,232,'
    });
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.c+p.a+')';ctx.fill();
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;
      if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    });
    requestAnimationFrame(draw);
  }
  resize();window.addEventListener('resize',resize);draw();
}

/* ── Wave canvas (service bg) ── */
function initWaveCanvas(id){
  const cv=document.getElementById(id);
  if(!cv)return;
  const ctx=cv.getContext('2d');
  let W,H,t=0;
  function resize(){cv.width=W=cv.parentElement.offsetWidth;cv.height=H=cv.parentElement.offsetHeight}
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<3;i++){
      ctx.beginPath();ctx.moveTo(0,H/2);
      for(let x=0;x<=W;x+=4){
        const y=H/2+Math.sin((x/W)*Math.PI*4+t+i*1.2)*(15+i*8)*.3;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();
      ctx.fillStyle=`rgba(8,48,78,${.05-i*.01})`;ctx.fill();
    }
    t+=.008;requestAnimationFrame(draw);
  }
  resize();window.addEventListener('resize',resize);draw();
}

/* ── Contact form ── */
function handleSend(){
  const msg=document.getElementById('form-msg');
  if(msg){msg.style.display='block';setTimeout(()=>msg.style.display='none',6000);}
}

/* ── Resource filter ── */
(function(){
  const btns=document.querySelectorAll('.cat-btn');
  const cards=document.querySelectorAll('.res-card[data-cat]');
  if(!btns.length)return;
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const cat=btn.dataset.cat;
      cards.forEach(card=>{
        const show=cat==='all'||card.dataset.cat===cat;
        card.style.display=show?'flex':'none';
      });
    });
  });
})();

/* ── Mobile nav toggle ── */
(function(){
  const toggle=document.getElementById('mob-toggle');
  const drawer=document.getElementById('mob-drawer');
  if(!toggle||!drawer)return;
  toggle.addEventListener('click',()=>{
    const open=drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded',open);
  });
  drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>drawer.classList.remove('open')));
})();

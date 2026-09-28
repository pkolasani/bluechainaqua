const intro=document.getElementById('siteIntro');

/* =========================================================
   DEVICE MODE DETECTION
   Android Chrome's "Desktop site" can expose a desktop-sized CSS
   viewport even on a phone.  Use the physical screen width + touch
   capability so the mobile navigation/layout still works there.
   ========================================================= */
(function setupDeviceMode(){
  const root=document.documentElement;
  const touch=('ontouchstart' in window) || navigator.maxTouchPoints>0;
  const screenWidth=Math.min(
    Number(window.screen?.width || 9999),
    Number(window.screen?.height || 9999)
  );
  const phone=touch && screenWidth<=600;
  const tablet=touch && !phone && screenWidth<=1100;
  root.classList.toggle('bca-touch',touch);
  root.classList.toggle('bca-phone',phone);
  root.classList.toggle('bca-tablet',tablet);
  const refresh=()=>{
    const w=Math.min(Number(window.innerWidth||9999),Number(window.screen?.width||9999));
    const isPhone=touch && w<=600;
    const isTablet=touch && !isPhone && w<=1100;
    root.classList.toggle('bca-phone',isPhone);
    root.classList.toggle('bca-tablet',isTablet);
  };
  window.addEventListener('resize',refresh,{passive:true});
})();

/* =========================================================
   BLUE CHAIN AQUA — INTRO EXPERIENCE
   Keep the intro independent from the rest of the page so a
   map/API/AI error can never break Skip Intro or sound playback.
   ========================================================= */
const introVideo=document.getElementById('introVideo');
const introSkip=document.getElementById('introSkip');
const introProgress=intro?.querySelector('.site-intro-progress span');
const soundGate=document.getElementById('introSoundGate');
const soundBtn=document.getElementById('introSoundBtn');
const silentBtn=document.getElementById('introSilentBtn');
let introFinished=false;
let introStartTimer=null;

function finishIntro(){
  if(!intro || introFinished) return;
  introFinished=true;
  if(introStartTimer) clearTimeout(introStartTimer);
  intro.classList.add('is-done');
  intro.setAttribute('aria-hidden','true');
  document.body.classList.remove('intro-active');
  if(introVideo){
    try{introVideo.pause();}catch(e){}
  }
  // Keep the fade, but remove the overlay afterwards so it can never
  // intercept clicks or scrolling on the real page.
  setTimeout(()=>intro.remove(),950);
}
function hideSoundGate(){soundGate?.classList.add('hidden');}
function showSoundGate(){soundGate?.classList.remove('hidden');}

if(intro){
  // The intro is a self-contained layer. Do not let any page script prevent
  // its buttons from working.
  intro.addEventListener('click',e=>{
    if(e.target.closest('#introSkip')) finishIntro();
  },true);
}

if(introVideo){
  introVideo.muted=true;
  introVideo.defaultMuted=true;
  introVideo.playsInline=true;
  introVideo.setAttribute('muted','');
  introVideo.setAttribute('playsinline','');
  introVideo.setAttribute('webkit-playsinline','');
  introVideo.preload='auto';

  introVideo.addEventListener('timeupdate',()=>{
    if(introVideo.duration && Number.isFinite(introVideo.duration) && introProgress){
      introProgress.style.width=Math.min(100,(introVideo.currentTime/introVideo.duration)*100)+'%';
    }
  });
  introVideo.addEventListener('ended',finishIntro,{once:true});
  introVideo.addEventListener('error',()=>{
    // If the media file is unavailable, never leave the visitor trapped on
    // the intro. The page remains usable and Skip Intro still works.
    showSoundGate();
    introStartTimer=setTimeout(finishIntro,1200);
  },{once:true});

  function startMutedIntro(){
    if(introFinished) return Promise.resolve();
    introVideo.muted=true;
    try{
      const promise=introVideo.play();
      if(promise?.catch) promise.catch(()=>showSoundGate());
      return promise || Promise.resolve();
    }catch(e){
      showSoundGate();
      return Promise.reject(e);
    }
  }

  // Browser-safe autoplay path.
  startMutedIntro();

  // If autoplay is blocked, the first genuine interaction can start it.
  const resumeIntro=()=>{
    if(introFinished || !introVideo.paused) return;
    startMutedIntro();
  };
  window.addEventListener('pointerdown',resumeIntro,{once:true,passive:true});
  window.addEventListener('touchstart',resumeIntro,{once:true,passive:true});

  soundBtn?.addEventListener('click',async e=>{
    e.preventDefault();
    e.stopPropagation();
    if(introFinished) return;
    try{
      // Changing muted=false and calling play() directly inside the user's
      // click is the most reliable way to satisfy mobile autoplay policy.
      introVideo.muted=false;
      introVideo.defaultMuted=false;
      introVideo.volume=1;
      await introVideo.play();
      hideSoundGate();
    }catch(err){
      // Some mobile browsers still reject unmuted playback. Do not break the
      // intro: keep it playing silently and leave the explicit sound action.
      introVideo.muted=true;
      introVideo.defaultMuted=true;
      showSoundGate();
      try{await introVideo.play();}catch(e2){}
    }
  });

  silentBtn?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    if(introFinished) return;
    introVideo.muted=true;
    introVideo.defaultMuted=true;
    startMutedIntro();
    hideSoundGate();
  });
}

// Direct listener as well as the delegated capture listener above. This makes
// keyboard activation and normal button activation equally reliable.
introSkip?.addEventListener('click',e=>{
  e.preventDefault();
  e.stopPropagation();
  finishIntro();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && intro && !introFinished) finishIntro();
});

const steps=[
 {n:'01',k:'SITE • WATER • VIABILITY',t:'Water<br><em>Selection</em>',p:'Start with the right water, land and environmental conditions. We assess the site before capital is committed.',scene:'scene-water'},
 {n:'02',k:'LAND • DESIGN • INFRASTRUCTURE',t:'Pond<br><em>Preparation</em>',p:'Turn a site into a production-ready pond system with layout, depth, aeration and infrastructure planning.',scene:'scene-pond'},
 {n:'03',k:'SEED • BIOSECURITY • QUALITY',t:'<em>Hatchery</em>',p:'Build a reliable seed pathway through broodstock, spawning, hatchery care and quality seed supply.',scene:'scene-hatchery'},
 {n:'04',k:'FEED • WATER • GROWTH',t:'Grow-out<br><em>Farming</em>',p:'Operate the farm with disciplined feeding, water monitoring, disease control and growth tracking.',scene:'scene-farm'},
 {n:'05',k:'QUALITY • TIMING • VALUE',t:'<em>Harvesting</em>',p:'Plan the harvest around optimal size, market timing, quality handling and better returns.',scene:'scene-harvest'},
 {n:'06',k:'PROCESS • COLD • VALUE',t:'Processing<br><em>& Value Addition</em>',p:'Move beyond raw output with grading, processing, cold storage and value-added products.',scene:'scene-processing'},
 {n:'07',k:'MARKETS • EXPORT • LOGISTICS',t:'Market &<br><em>Supply Chain</em>',p:'Connect production to domestic and global markets through coordinated logistics and market access.',scene:'scene-market'},
 {n:'08',k:'FARMERS • COMMUNITIES • PLANET',t:'The <em>Blue Economy</em>',p:'A connected aquaculture value chain that strengthens farmers, communities, sustainable fisheries and the wider blue economy.',scene:'scene-blue'}
];
const sticky=document.querySelector('.sequence-sticky');
const sequence=document.querySelector('.sequence');
const title=document.getElementById('stepTitle'),text=document.getElementById('stepText'),kicker=document.getElementById('stepKicker'),num=document.getElementById('stepNumber');
const dots=[...document.querySelectorAll('.progress-dot')];
let current=-1;
const stageVideos=[...document.querySelectorAll('.stage-video')];
const stagePlay=document.getElementById('stagePlayControl');

function playStageVideo(v){
  if(!v) return;
  v.muted=true;
  try{
    const p=v.play();
    if(p?.catch) p.catch(()=>{});
  }catch(e){}
}
function syncStageButton(v){
  if(!stagePlay || !v) return;
  const playing=!v.paused && !v.ended;
  stagePlay.textContent=playing?'❚❚ Playing stage':' Play stage';
  stagePlay.classList.toggle('is-playing',playing);
  stagePlay.setAttribute('aria-label',playing?'Pause current stage video':'Play current stage video');
}
function renderStep(i,{play=false}={}){
  i=Math.max(0,Math.min(steps.length-1,Number(i)||0));
  current=i;
  const s=steps[i];
  if(title) title.innerHTML=s.t;
  if(text) text.textContent=s.p;
  if(kicker) kicker.textContent=s.k;
  if(num) num.textContent=s.n;
  document.querySelectorAll('.scene-object').forEach(x=>x.classList.remove('active'));
  document.querySelector('.'+s.scene)?.classList.add('active');

  stageVideos.forEach((v,j)=>{
    if(j===i){
      try{v.pause();v.currentTime=0;}catch(e){}
      if(play) playStageVideo(v);
    }else{
      try{v.pause();}catch(e){}
    }
  });
  dots.forEach((d,j)=>{
    d.classList.toggle('active',j===i);
    d.setAttribute('aria-current',j===i?'step':'false');
  });
  syncStageButton(stageVideos[i]);
}

// Stage controls: use the button's own data-step value instead of relying
// only on the closure index. This keeps touch/click selection deterministic
// on Android/iOS and prevents a tap from ever resolving to stage 08.
function selectStageFromControl(e){
  e.preventDefault();
  e.stopPropagation();
  const btn=e.currentTarget;
  const raw=btn?.getAttribute('data-step');
  const index=Number.parseInt(raw,10);
  if(!Number.isInteger(index) || index<0 || index>=steps.length) return;
  renderStep(index,{play:true});
}
dots.forEach(d=>{
  d.type='button';
  d.style.touchAction='manipulation';
  d.addEventListener('click',selectStageFromControl);
  d.addEventListener('pointerup',e=>{
    // On touch devices pointerup is the fastest reliable activation path.
    if(e.pointerType==='touch' || e.pointerType==='pen') selectStageFromControl(e);
  });
});

stageVideos.forEach((v,i)=>{
  v.preload='metadata';
  v.muted=true;
  v.playsInline=true;
  v.setAttribute('playsinline','');
  v.addEventListener('error',()=>v.classList.add('stage-video-error'),{passive:true});
  v.addEventListener('loadeddata',()=>v.classList.remove('stage-video-error'),{passive:true});
  v.addEventListener('play',()=>{if(current===i)syncStageButton(v)},{passive:true});
  v.addEventListener('pause',()=>{if(current===i)syncStageButton(v)},{passive:true});
  v.addEventListener('ended',()=>{if(current===i)syncStageButton(v)},{passive:true});
  v.addEventListener('click',e=>{
    e.preventDefault();
    if(current!==i){renderStep(i,{play:true});return;}
    if(v.paused) playStageVideo(v); else v.pause();
    syncStageButton(v);
  });
});

stagePlay?.addEventListener('click',e=>{
  e.preventDefault();
  e.stopPropagation();

  // Every tap moves to the next stage in sequence: 01 -> 02 -> ... -> 08 -> 01
  const nextStage = current >= steps.length - 1 ? 0 : current + 1;
  renderStep(nextStage,{play:true});
});

// Start with Stage 01 visible but frozen. Nothing changes when the page
// scrolls; users explicitly choose a stage.
renderStep(0,{play:false});

const menu=document.querySelector('.menu'),nav=document.querySelector('.header nav');
function toggleMobileMenu(event){
  if(event){event.preventDefault();event.stopPropagation();}
  if(!menu || !nav)return;
  const open=nav.classList.toggle('open');
  menu.setAttribute('aria-expanded',String(open));
  menu.setAttribute('aria-label',open?'Close menu':'Open menu');
}
menu?.addEventListener('click',toggleMobileMenu);
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  if (window.BCA_STOP_VOICE) window.BCA_STOP_VOICE();
  nav.classList.remove('open');
  menu?.setAttribute('aria-expanded','false');
}));
const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('.journey-intro,.section,.service-grid article,.planning-card,.planning-strip>div,.step,.ops-grid>*,.cta-box').forEach(x=>{x.classList.add('reveal');reveal.observe(x)});
document.querySelector('.sequence-bg-video')?.addEventListener('canplay',e=>e.target.play().catch(()=>{}));
document.getElementById('year').textContent=new Date().getFullYear();

/* Project portfolio + interactive India state map */
const projectData = {
  "Kerala": [
    {name:"Establishment of Ready-to-Eat Tuna Canned Processing Unit", scheme:"PMMSY"},
    {name:"Strengthening of Primary Fisheries Cooperatives", scheme:"PM-MKSSY"}
  ],
  "Odisha": [
    {name:"Establishment of FRP Boats, Tanks and Aquarium Manufacturing Unit", scheme:"PMMSY"},
    {name:"Establishment of State-of-the-Art 100 TPD Feed Plant", scheme:"MKUY"},
    {name:"Establishment of Shrimp Processing Facility", scheme:"PMMSY"},
    {name:"Establishment of Intensive Black Soldier Fly Unit – Waste to Wealth", scheme:"CSR Fund"},
    {name:"Establishment of Aquatourism Project", scheme:"PMMSY"},
    {name:"Establishment of Cluster Biofloc Tanks for Magur and Singi Farming", scheme:"—"}
  ],
 "West Bengal": [
  {
    name: "Establishment of Integrated Hatchery to Processing Unit with Retail Outlet Facility",
    scheme: "—"
  },
  {
    name: "West Bengal Aquaculture Development Project",
    scheme: "—"
  },
  {
    name: "West Bengal Fish Processing and Value Addition Project",
    scheme: "—"
  },
  {
    name: "West Bengal Sustainable Fisheries Development Project",
    scheme: "—"
  }
],
  "Telangana": [
    {name:"Establishment of Intensive Murrel Farming in HDPE-Lined Tanks with Retail Outlet", scheme:"PMMSY"},
    {name:"Strengthening of Primary Fisheries Cooperatives", scheme:"PM-MKSSY"},
    {name:"Establishment of RAS Farming Facility with Feed Mill and Retail Outlet", scheme:"PMMSY"},
    {name:"Establishment of Intensive Murrel Nursery Rearing and Grow-out Farming in HDPE-Lined Tanks with Retail Outlet", scheme:"PMMSY"},
    {name:"Establishment of Biofloc Unit at KVK Mamnoor, Warangal", scheme:"—"}
  ],
  "Andhra Pradesh": [
    {name:"Establishment of Vannamei Nursery Facility in Biofloc System", scheme:"PMMSY"},
    {name:"Establishment of Intensive Fish Farming with Retail Outlet", scheme:"PMMSY"},
    {name:"Establishment of Vannamei Processing Facility", scheme:"PMMSY"},
    {name:"Establishment of Marine Finfish Hatchery Facility", scheme:"PMMSY"},
    {name:"Establishment of Shrimp, Fish Processing and Value Addition Unit", scheme:"MoFPI"},
    {name:"Establishment of 100 TPD Shrimp Feed Production Plant", scheme:"PMMSY"}
  ]
};
const activeProjectStates = new Set(Object.keys(projectData));
const stateAliases = {
  "West Bengal": "West Bengal",
  "Odisha": "Odisha",
  "Orissa": "Odisha",
  "Telangana": "Telangana",
  "Andhra Pradesh": "Andhra Pradesh",
  "Kerala": "Kerala"
};

function projectStateName(props={}){
  const raw = props.name || props.NAME_1 || props.ST_NM || props.st_nm || props.shapeName || props.STATE || props.state || props.State || '';
  return stateAliases[raw] || raw;
}


function setupProjectTabs(){}

let projectMap=null;
let projectMapLayer=null;
let projectMapResizeObserver=null;

function renderStateProjects(state){
  const title = document.getElementById('selectedStateName');
  const count = document.getElementById('selectedStateCount');
  const list = document.getElementById('stateProjectList');
  if(!title || !count || !list) return;
  const projects = projectData[state] || [];
  const total = projects.reduce((sum,p)=>sum+(p.count||1),0);
  title.textContent = state || 'Select a state';
  count.textContent = `${total} project${total===1?'':'s'}`;
  if(!projects.length){
    list.innerHTML = '<div class="state-project"><h4>No project record listed</h4><p>The supplied project document does not list a sanctioned project for this state.</p></div>';
    return;
  }
  list.innerHTML = projects.map(p => `
    <article class="state-project">
      <h4>${p.name}${p.count ? ` <span aria-label="${p.count} projects">(${p.count} projects)</span>` : ''}</h4>
      <p>State-wise project listed in the supplied Blue Chain Aqua project document.</p>
      <span class="scheme">${p.scheme}</span>
    </article>
  `).join('');
}

/*
   Production-safe India map.
   The exact India artwork is bundled with the website, so the Projects
   section never depends on a third-party GeoJSON request. The highlighted
   states are real map regions in the bundled image; the five transparent
   controls below provide reliable state selection on desktop and touch.
*/
function renderProjectMapFallback(){
  const mapEl=document.getElementById('indiaProjectsMap');
  if(!mapEl) return;
  const states=[
    ['Kerala','38%','78%'],
    ['Andhra Pradesh','51%','70%'],
    ['Telangana','51%','60%'],
    ['Odisha','60%','49%'],
    ['West Bengal','63%','39%']
  ];
  mapEl.innerHTML=`
    <div class="india-fallback-real-map" role="group" aria-label="India map showing Blue Chain Aqua project states">
      <img src="assets/maps/india-projects-fallback.png" alt="India map with Kerala, Andhra Pradesh, Telangana, Odisha and West Bengal highlighted" loading="eager" decoding="async">
      <div class="fallback-state-layer" aria-label="Project states">
        ${states.map(([name,left,top])=>{
          const total=(projectData[name]||[]).reduce((sum,p)=>sum+(p.count||1),0);
          return `<button type="button" class="fallback-state-pin" data-state="${name}" style="left:${left};top:${top}" aria-label="View ${name} projects"><span>${name}</span><b>${total}</b></button>`;
        }).join('')}
      </div>
      <div class="fallback-map-note">Select a highlighted state to view its projects</div>
    </div>`;

  mapEl.querySelectorAll('.fallback-state-pin').forEach(btn=>btn.addEventListener('click',()=>{
    const state=btn.dataset.state;
    renderStateProjects(state);
    document.querySelectorAll('.fallback-state-pin').forEach(b=>b.classList.toggle('is-selected',b===btn));
    if(window.matchMedia('(max-width:780px)').matches){
      document.getElementById('selectedStateName')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }));
  renderStateProjects('Andhra Pradesh');
}

// Kept as a public helper for compatibility with earlier versions. It now
// simply re-renders the bundled production-safe map.
function setupProjectMap(){
  if(projectMap){try{projectMap.remove();}catch(e){} projectMap=null;}
  if(projectMapResizeObserver){try{projectMapResizeObserver.disconnect();}catch(e){} projectMapResizeObserver=null;}
  renderProjectMapFallback();
}

setupProjectTabs();
setupProjectMap();

// Keep the project metric linked to the single Projects section.
document.querySelectorAll('.ops-stats > div').forEach((card,index)=>{
  if(index!==1) return;
  card.setAttribute('role','button');
  card.setAttribute('tabindex','0');
  card.setAttribute('aria-label','View projects');
  const open=()=>document.getElementById('track')?.scrollIntoView({behavior:'smooth',block:'start'});
  card.addEventListener('click',open);
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
});

/* =========================================================
   Ultra-premium persistent card interaction
   Keeps the visual hover state active after a click.
   ========================================================= */
(function(){
  function initPremiumCardSelection(){
    var selectors = '.planning-card, .service-grid article';
    document.querySelectorAll(selectors).forEach(function(card){
      if(card.dataset.premiumSelectionBound) return;
      card.dataset.premiumSelectionBound='1';
      card.setAttribute('tabindex','0');
      card.setAttribute('role','button');
      card.addEventListener('click',function(e){
        if(e.target.closest('a,button,input,select,textarea')) return;
        document.querySelectorAll(selectors).forEach(function(other){
          if(other!==card) other.classList.remove('is-selected');
        });
        card.classList.toggle('is-selected');
      });
      card.addEventListener('keydown',function(e){
        if(e.key==='Enter' || e.key===' '){
          e.preventDefault();
          card.click();
        }
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initPremiumCardSelection);
  else initPremiumCardSelection();
})();

/* =========================================================
   Contact enquiry -> WhatsApp
   Uses the existing Blue Chain Aqua contact number.
   Supports normal browser autofill and copy/paste.
   ========================================================= */
(function(){
  const form = document.getElementById('whatsappEnquiryForm');
  if(!form) return;
  const status = document.getElementById('whatsappEnquiryStatus');
  const whatsappNumber = '917013490968';

  // Keep the form completely compatible with Chrome/Edge saved-address autofill.
  // Some browsers apply autofill without firing an input event, so we deliberately
  // do not normalize, replace, or clear any field while the user is filling it.
  // Values are read only when the WhatsApp button is submitted.
  const enquiryFields = ['enquiryName','enquiryMobile','enquiryEmail','enquiryQuestion']
    .map(id => document.getElementById(id)).filter(Boolean);
  enquiryFields.forEach(field => {
    field.addEventListener('change', () => { field.dataset.autofilled = 'true'; });
    field.addEventListener('input', () => { field.dataset.userEdited = 'true'; });
  });

  function getEnquiryMessage(){
    const name = document.getElementById('enquiryName').value.trim();
    const mobile = document.getElementById('enquiryMobile').value.trim();
    const email = document.getElementById('enquiryEmail').value.trim();
    const question = document.getElementById('enquiryQuestion').value.trim();
    if(!name || !mobile || !question){
      status.textContent = 'Please complete Name, Mobile Number and Question / Doubt.';
      return null;
    }
    return [
      'Hello Blue Chain Aqua,',
      '',
      'I have an aquaculture enquiry.',
      '',
      `Name: ${name}`,
      `Mobile: ${mobile}`,
      email ? `Email: ${email}` : 'Email: Not provided',
      '',
      `Question / Doubt: ${question}`
    ].join('\n');
  }


  form.addEventListener('submit', function(e){
    e.preventDefault();
    const message = getEnquiryMessage();
    if(!message) return;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    status.textContent = 'Opening WhatsApp with your enquiry…';
    window.open(url, '_blank', 'noopener,noreferrer');
  });

})();

/* Idle water ambience: after 30 seconds of no user movement while Project Readiness is visible. */
(function setupIdleWater(){
  const section = document.getElementById('planning');
  if(!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const scene = document.createElement('div');
  scene.className = 'idle-water-scene';
  scene.setAttribute('aria-hidden','true');
  for(let i=0;i<10;i++){
    const bubble=document.createElement('span');
    bubble.className='idle-water-bubble';
    scene.appendChild(bubble);
  }
  section.appendChild(scene);

  let idleTimer=null;
  let sectionVisible=false;
  let active=false;
  const IDLE_MS=30000;

  const visibilityObserver=new IntersectionObserver(entries=>{
    sectionVisible=entries[0]?.isIntersecting===true && entries[0].intersectionRatio>=0.28;
    if(!sectionVisible){
      clearTimeout(idleTimer);
      idleTimer=null;
      active=false;
      scene.classList.remove('is-active');
    }else{
      resetIdle();
    }
  },{threshold:[0,.28,.5]});
  visibilityObserver.observe(section);

  function activate(){
    if(!sectionVisible || active) return;
    active=true;
    scene.classList.add('is-active');
  }
  function resetIdle(){
    clearTimeout(idleTimer);
    active=false;
    scene.classList.remove('is-active');
    if(sectionVisible) idleTimer=setTimeout(activate,IDLE_MS);
  }

  ['pointermove','pointerdown','touchstart','keydown','wheel','scroll','click'].forEach(type=>{
    window.addEventListener(type,resetIdle,{passive:type!=='keydown'});
  });
})();


/* Project image lightbox — click/tap any readiness image to view it clearly. */
(function setupReadinessLightbox(){
  function init(){
    const items=[...document.querySelectorAll('.readiness-image')];
    if(!items.length || document.querySelector('.bca-image-lightbox')) return;
    const overlay=document.createElement('div');
    overlay.className='bca-image-lightbox';
    overlay.innerHTML=`<button class="bca-lightbox-close" type="button" aria-label="Close image">×</button><figure class="bca-lightbox-figure"><img alt=""><figcaption></figcaption></figure>`;
    document.body.appendChild(overlay);
    const img=overlay.querySelector('img'), caption=overlay.querySelector('figcaption'), close=overlay.querySelector('.bca-lightbox-close');
    let lastFocus=null;
    function open(item){
      const source=item.querySelector('img'); if(!source) return;
      lastFocus=document.activeElement;
      // Use the original high-resolution image in the lightbox; cards intentionally use small thumbnails.
      const fullSrc=source.dataset.fullSrc || source.getAttribute('data-full-src') || source.src;
      img.src=fullSrc;
      img.alt=source.alt||'';
      caption.textContent=source.alt||'';
      overlay.classList.add('is-open');
      document.body.classList.add('bca-lightbox-open');
      close.focus();
    }
    function hide(){
      overlay.classList.remove('is-open');
      document.body.classList.remove('bca-lightbox-open');
      img.src='';
      if(lastFocus && typeof lastFocus.focus==='function') lastFocus.focus();
    }
    items.forEach(item=>{
      item.addEventListener('click',e=>{ if(e.target.closest('.readiness-next')) return; open(item); });
      item.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();open(item);} });
    });
    document.querySelectorAll('.readiness-next').forEach((btn,i)=>btn.addEventListener('click',e=>{e.stopPropagation();open(items[i]);}));
    close.addEventListener('click',hide);
    overlay.addEventListener('click',e=>{if(e.target===overlay) hide();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open')) hide();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

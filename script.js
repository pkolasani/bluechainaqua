const intro=document.getElementById('siteIntro');
// Some Android browsers (especially when Desktop Site was previously enabled)
// report a desktop-sized viewport. Mark touch devices explicitly so the mobile
// layout still activates reliably.
if (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('bca-touch');
}

const introVideo=document.getElementById('introVideo');
const introSkip=document.getElementById('introSkip');
const introProgress=intro?.querySelector('.site-intro-progress span');
const soundGate=document.getElementById('introSoundGate');
const soundBtn=document.getElementById('introSoundBtn');
const silentBtn=document.getElementById('introSilentBtn');

function finishIntro(){if(!intro||intro.classList.contains('is-done'))return;intro.classList.add('is-done');document.body.classList.remove('intro-active');setTimeout(()=>intro.remove(),950)}
function hideSoundGate(){soundGate?.classList.add('hidden')}
function showSoundGate(){soundGate?.classList.remove('hidden')}

if(introVideo){
  introVideo.addEventListener('timeupdate',()=>{if(introVideo.duration&&introProgress)introProgress.style.width=Math.min(100,introVideo.currentTime/introVideo.duration*100)+'%'});
  introVideo.addEventListener('ended',finishIntro);
  introVideo.addEventListener('error',finishIntro);
  introVideo.muted=false;
  const p=introVideo.play();
  if(p?.catch)p.catch(()=>{introVideo.muted=true;introVideo.play().catch(()=>{});showSoundGate()});
}
soundBtn?.addEventListener('click',()=>{if(!introVideo)return;introVideo.muted=false;introVideo.volume=1;introVideo.play().catch(()=>{});hideSoundGate()});
silentBtn?.addEventListener('click',()=>{if(introVideo)introVideo.muted=true;hideSoundGate()});
introSkip?.addEventListener('click',finishIntro);

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
let current=-1, ticking=false;
function renderStep(i){
  if(i===current)return;
  current=i;const s=steps[i];
  title.innerHTML=s.t;text.textContent=s.p;kicker.textContent=s.k;num.textContent=s.n;
  document.querySelectorAll('.scene-object').forEach(x=>x.classList.remove('active'));
  document.querySelector('.'+s.scene)?.classList.add('active');
  document.querySelectorAll('.stage-video').forEach((v,j)=>{
    if(j===i){v.currentTime=0; v.play().catch(()=>{});}
    else {v.pause();}
  });
  dots.forEach((d,j)=>d.classList.toggle('active',j===i));
  document.querySelector('.sequence-copy')?.animate([{opacity:.25,transform:'translateY(-45%) translateX(16px)'},{opacity:1,transform:'translateY(-48%) translateX(0)'}],{duration:600,easing:'cubic-bezier(.2,.75,.2,1)'});
}
function updateSequence(){
  const rect=sequence.getBoundingClientRect();
  const total=sequence.offsetHeight-sticky.offsetHeight;
  const progress=Math.min(1,Math.max(0,-rect.top/Math.max(1,total)));
  const i=Math.min(steps.length-1,Math.floor(progress*steps.length));
  renderStep(i);ticking=false;
}
window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateSequence);ticking=true}},{passive:true});
dots.forEach((d,i)=>d.addEventListener('click',()=>{const y=sequence.offsetTop+(sequence.offsetHeight-sticky.offsetHeight)*(i/(steps.length-1));window.scrollTo({top:y,behavior:'smooth'})}));
renderStep(0);

const menu=document.querySelector('.menu'),nav=document.querySelector('.header nav');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu')});
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
    {name:"Establishment of Integrated Hatchery to Processing Unit with Retail Outlet Facility", scheme:"—", count:4}
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

function setupProjectTabs(){}

let projectMap=null;
function renderProjectMapFallback(){
  const mapEl=document.getElementById('indiaProjectsMap');
  if(!mapEl) return;
  const states=[
    ['Kerala','7%','74%'],
    ['Andhra Pradesh','48%','72%'],
    ['Telangana','45%','60%'],
    ['Odisha','66%','49%'],
    ['West Bengal','78%','43%']
  ];
  mapEl.innerHTML=`
    <div class="india-fallback-map" aria-label="Blue Chain Aqua India project coverage map">
      <div class="fallback-outline" aria-hidden="true"></div>
      <div class="fallback-title">INDIA • PROJECT COVERAGE</div>
      ${states.map(([name,left,top])=>`<button type="button" class="fallback-state" data-state="${name}" style="left:${left};top:${top}">${name}<b>${(projectData[name]||[]).reduce((sum,p)=>sum+(p.count||1),0)}</b></button>`).join('')}
      <div class="fallback-note">Click a highlighted state to view its projects</div>
    </div>`;
  mapEl.querySelectorAll('.fallback-state').forEach(btn=>btn.addEventListener('click',()=>renderStateProjects(btn.dataset.state)));
  renderStateProjects('Andhra Pradesh');
}

async function setupProjectMap(){
  const mapEl=document.getElementById('indiaProjectsMap');
  if(!mapEl) return;
  if(typeof L==='undefined'){ renderProjectMapFallback(); return; }
  projectMap=L.map(mapEl,{zoomControl:true,scrollWheelZoom:false,dragging:true,doubleClickZoom:true,touchZoom:true,boxZoom:false,keyboard:true,attributionControl:false,zoomSnap:.25,zoomDelta:.5,zoomControlPosition:'topleft'});
  L.control.attribution({prefix:false}).addAttribution('India map data: udit-001/india-maps-data');
  const geoUrls=[
    'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/india.geojson',
    'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@HEAD/geojson/india.geojson'
  ];
  try{
    let geo=null;
    for(const geoUrl of geoUrls){
      try{
        const res=await fetch(geoUrl,{cache:'no-store'});
        if(!res.ok) continue;
        geo=await res.json();
        if(geo && geo.features) break;
      }catch(e){}
    }
    if(!geo || !geo.features) throw new Error('Map data could not be loaded');
    const layer=L.geoJSON(geo,{style:feature=>{
      const state=projectStateName(feature.properties||{});
      const active=activeProjectStates.has(state);
      return {color:active?'#0b7789':'#b8ced2',weight:active?1.7:.65,fillColor:active?'#39c7c8':'#dfeceb',fillOpacity:active?.82:.55};
    },onEachFeature:(feature,layer)=>{
      const state=projectStateName(feature.properties||{});
      const active=activeProjectStates.has(state);
      layer.on({
        mouseover:e=>{e.target.setStyle({weight:active?2.8:1.2,fillOpacity:active?1:.75});e.target.bringToFront();},
        mouseout:e=>{layer.setStyle({color:active?'#0b7789':'#b8ced2',weight:active?1.7:.65,fillColor:active?'#39c7c8':'#dfeceb',fillOpacity:active?.82:.55});},
        click:()=>{renderStateProjects(active?state:state); if(active) document.getElementById('selectedStateName')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
      });
      if(active){ layer.bindTooltip(state,{permanent:false,direction:'top',className:'map-hover-label',opacity:.98,sticky:true}); }
    }}).addTo(projectMap);
    projectMap.fitBounds(layer.getBounds(),{padding:[15,15]});
    renderStateProjects('Andhra Pradesh');
  }catch(err){
    projectMap?.remove();
    projectMap=null;
    renderProjectMapFallback();
  }
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

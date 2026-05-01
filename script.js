/* ═══════════════════════════════════
   SHARED DATA KEY (same as admin)
═══════════════════════════════════ */
const DATA_KEY = 'artisancraft_products';

const CATEGORIES = [
  {key:'sarees',label:'Sarees'}, {key:'nails',label:'Nail Art'},
  {key:'shirts',label:'Shirts'}, {key:'wall',label:'Wall Hangings'},
  {key:'jewellery',label:'Jewellery'}, {key:'hoodies',label:'Hoodies'},
  {key:'suits',label:'Suits'}, {key:'accessories',label:'Accessories'},
  {key:'bags',label:'Tote Bags'}, {key:'gifting',label:'Gifting'}
];

const SEARCH_INDEX = [
  {name:'Handcrafted Saree',cat:'sarees'},{name:'Hand Painted Saree',cat:'sarees'},
  {name:'Wedding Saree',cat:'sarees'},{name:'Press-On Nails',cat:'nails'},
  {name:'Bridal Nail Set',cat:'nails'},{name:'Custom Nail Art',cat:'nails'},
  {name:'Party Glam Nails',cat:'nails'},{name:'Hand Painted Shirt',cat:'shirts'},
  {name:'Handcrafted Shirt',cat:'shirts'},{name:'Wall Hanging',cat:'wall'},
  {name:'Macramé Wall Art',cat:'wall'},{name:'Wedding Hoops',cat:'jewellery'},
  {name:'Engagement Ring Platter',cat:'gifting'},{name:'Hand Painted Hoodie',cat:'hoodies'},
  {name:'Handcrafted Suit',cat:'suits'},{name:'Hand Painted Suit',cat:'suits'},
  {name:'Tote Bag',cat:'bags'},{name:'Hair Accessories',cat:'accessories'},
  {name:'Pouch',cat:'accessories'},{name:'Bookmark',cat:'gifting'},
  {name:'Hand Painted Pouch',cat:'accessories'},{name:'Phone Cover',cat:'accessories'},
];

/* ═══════════════════════════════════
   HERO SLIDER
═══════════════════════════════════ */
let curSlide = 0;
const slidesWrap = document.getElementById('slidesWrap');
const dotsWrap   = document.getElementById('dots');
const totalSlides = document.querySelectorAll('.slide').length;
let autoTimer;

function buildDots() {
  for (let i = 0; i < totalSlides; i++) {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goSlide(i);
    dotsWrap.appendChild(d);
  }
}

function goSlide(n) {
  curSlide = (n + totalSlides) % totalSlides;
  slidesWrap.style.transform = `translateX(-${curSlide * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === curSlide));
}

function moveSlide(dir) {
  goSlide(curSlide + dir);
  resetAuto();
}

function resetAuto() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goSlide(curSlide + 1), 4000);
}

buildDots();
resetAuto();

/* ═══════════════════════════════════
   SEARCH
═══════════════════════════════════ */
const searchInput = document.getElementById('searchInput');
const suggBox     = document.getElementById('suggBox');
const searchClear = document.getElementById('searchClear');

function getAllSearchItems() {
  const products = getProducts();
  const fromAdmin = products.map(p => ({name: p.name, cat: p.category}));
  return [...SEARCH_INDEX, ...fromAdmin];
}

searchInput.addEventListener('input', function() {
  const val = this.value.trim().toLowerCase();
  searchClear.style.display = val ? 'block' : 'none';
  if (!val) { suggBox.style.display = 'none'; return; }
  const items = getAllSearchItems();
  const results = items.filter(i => i.name.toLowerCase().includes(val)).slice(0, 7);
  if (!results.length) { suggBox.style.display = 'none'; return; }
  suggBox.innerHTML = results.map(r =>
    `<div class="sugg-item" onclick="goSearch('${r.cat}','${r.name}')">
       <i class="fa-solid fa-magnifying-glass"></i>
       <span>${r.name}</span>
       <span class="sugg-cat">${CATEGORIES.find(c=>c.key===r.cat)?.label || r.cat}</span>
     </div>`
  ).join('');
  suggBox.style.display = 'block';
});

function goSearch(cat, name) {
  suggBox.style.display = 'none';
  searchInput.value = name;
  const section = document.getElementById('catSection');
  if (section) {
    section.scrollIntoView({behavior:'smooth', block:'start'});
    setTimeout(() => filterCat(cat), 400);
  }
}

function clearSearch() {
  searchInput.value = '';
  suggBox.style.display = 'none';
  searchClear.style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) suggBox.style.display = 'none';
});

/* ═══════════════════════════════════
   CATEGORY PILLS FILTER
═══════════════════════════════════ */
document.querySelectorAll('.pill').forEach(p => {
  p.addEventListener('click', function() {
    document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    filterCat(this.dataset.cat);
  });
});

function filterCat(cat) {
  document.querySelectorAll('.cat-card').forEach(card => {
    if (cat === 'all' || card.dataset.cat === cat) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === cat);
  });
}

/* ═══════════════════════════════════
   ADMIN DATA — PRODUCTS
═══════════════════════════════════ */
function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || '[]');
  } catch(e) { return []; }
}

function renderProducts() {
  const products = getProducts();
  const grid = document.getElementById('prodGrid');
  const noProd = document.getElementById('noProd');
  const featured = products.filter(p => p.featured !== false);

  if (!featured.length) {
    noProd.style.display = 'block';
    return;
  }
  noProd.style.display = 'none';

  // remove old cards
  grid.querySelectorAll('.prod-card').forEach(c => c.remove());

  featured.forEach(p => {
    const disc = p.originalPrice && p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : 0;
    const card = document.createElement('a');
    card.className = 'prod-card';
    card.href = p.link || '#';
    card.innerHTML = `
      <div class="prod-img">
        <img src="${p.image || 'https://placehold.co/260x320/e2d5c3/8b5e3c?text=Product&font=playfair'}" alt="${p.name}"/>
        ${disc > 0 ? `<span class="prod-disc">${disc}% OFF</span>` : ''}
      </div>
      <div class="prod-info">
        <h4>${p.name}</h4>
        <div class="prod-prices">
          ${p.originalPrice ? `<s>₹${p.originalPrice}</s>` : ''}
          <strong>₹${p.price}</strong>
        </div>
        <a href="https://wa.me/919999999999?text=Hi!+I+want+to+order+${encodeURIComponent(p.name)}" 
           target="_blank" class="prod-wa">
          <i class="fa-brands fa-whatsapp"></i> Order on WhatsApp
        </a>
      </div>`;
    grid.appendChild(card);
  });
}

/* ═══════════════════════════════════
   CATEGORY COUNTS FROM ADMIN DATA
═══════════════════════════════════ */
function updateCounts() {
  const products = getProducts();
  CATEGORIES.forEach(c => {
    const count = products.filter(p => p.category === c.key).length;
    document.querySelectorAll(`.ccount[data-key="${c.key}"]`).forEach(el => {
      el.textContent = count > 0 ? `${count} design${count > 1 ? 's' : ''}` : '';
    });
  });
}

/* ═══════════════════════════════════
   FLOATING CARE BUTTON
═══════════════════════════════════ */
function toggleCare() {
  const menu = document.getElementById('careMenu');
  const btn  = document.querySelector('.float-btn');
  const ico  = document.getElementById('floatIco');
  const open = menu.classList.toggle('open');
  btn.classList.toggle('open', open);
  ico.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-headset';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.float-wrap')) {
    document.getElementById('careMenu').classList.remove('open');
    document.querySelector('.float-btn').classList.remove('open');
    document.getElementById('floatIco').className = 'fa-solid fa-headset';
  }
});

/* ═══════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.cat-card, .why-card, .nail-card, .vc-box').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  revealObs.observe(el);
});

/* ═══════════════════════════════════
   INIT
═══════════════════════════════════ */
renderProducts();
updateCounts();

// Re-render if admin updates in another tab
window.addEventListener('storage', e => {
  if (e.key === DATA_KEY) { renderProducts(); updateCounts(); }
});
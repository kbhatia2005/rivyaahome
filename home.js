/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const DATA_KEY  = 'artisancraft_products';
const CART_KEY  = 'artisancraft_cart';
const CATS = [
  {key:'sarees',label:'Sarees'},{key:'nails',label:'Nail Art'},
  {key:'shirts',label:'Shirts'},{key:'wall',label:'Wall Hangings'},
  {key:'jewellery',label:'Jewellery'},{key:'hoodies',label:'Hoodies'},
  {key:'suits',label:'Suits'},{key:'accessories',label:'Accessories'},
  {key:'bags',label:'Tote Bags'},{key:'gifting',label:'Gifting'}
];
const STATIC_SEARCH = [
  {name:'Handcrafted Saree',cat:'sarees'},{name:'Hand Painted Saree',cat:'sarees'},
  {name:'Wedding Saree',cat:'sarees'},{name:'Press-On Nails',cat:'nails'},
  {name:'Bridal Nail Set',cat:'nails'},{name:'Custom Nail Art',cat:'nails'},
  {name:'Party Glam Nails',cat:'nails'},{name:'Hand Painted Shirt',cat:'shirts'},
  {name:'Handcrafted Shirt',cat:'shirts'},{name:'Wall Hanging',cat:'wall'},
  {name:'Macramé Wall Art',cat:'wall'},{name:'Wedding Hoops',cat:'jewellery'},
  {name:'Engagement Ring Platter',cat:'gifting'},{name:'Hand Painted Hoodie',cat:'hoodies'},
  {name:'Handcrafted Suit',cat:'suits'},{name:'Hand Painted Suit',cat:'suits'},
  {name:'Tote Bag',cat:'bags'},{name:'Hair Accessories',cat:'accessories'},
  {name:'Hand Painted Pouch',cat:'accessories'},{name:'Bookmark',cat:'gifting'},
];

/* ═══════════════════════════════════════════
   STORAGE HELPERS
═══════════════════════════════════════════ */
function getProducts() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY) || '[]'); }
  catch { return []; }
}
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ═══════════════════════════════════════════
   CART LOGIC
═══════════════════════════════════════════ */
function addToCart(id, name, price, category, image, link) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: Number(price), category, image, link, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  renderCartItems();
  showToast(`"${name}" added to cart!`);
  // animate badge
  const badge = document.getElementById('cartBadge');
  badge.style.transform = 'scale(1.5)';
  setTimeout(() => badge.style.transform = '', 300);
}

// For static nail cards (no admin id)
function addToCartQuick(name, price, category, image, link) {
  const id = 'static_' + name.replace(/\s+/g, '_').toLowerCase();
  addToCart(id, name, price, category, image, link);
}

function removeFromCart(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartBadge();
  renderCartItems();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart(cart);
  updateCartBadge();
  renderCartItems();
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = total;
}

function renderCartItems() {
  const cart     = getCart();
  const container = document.getElementById('cartItems');
  const foot      = document.getElementById('cartFoot');
  const waBtn     = document.getElementById('cartWaBtn');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Your cart is empty</p>
      </div>`;
    if (foot) foot.style.display = 'none';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    const catLabel = CATS.find(c => c.key === item.category)?.label || item.category;
    return `
      <div class="cart-item">
        <div class="cart-item-img" onclick="${item.link ? `window.open('${item.link}','_blank')` : ''}">
          <img src="${item.image || 'https://placehold.co/60x60/e2d5c3/8b5e3c?text=P'}" alt="${item.name}"/>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name" onclick="${item.link ? `window.open('${item.link}','_blank')` : ''}">${item.name}</div>
          <div class="cart-item-cat">${catLabel}</div>
          <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
          <div class="cart-item-qty">
            <button onclick="changeQty('${item.id}',-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${item.id}',1)">+</button>
          </div>
        </div>
        <button class="cart-item-del" onclick="removeFromCart('${item.id}')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
  }).join('');

  if (foot) foot.style.display = 'block';
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');

  // Build WhatsApp order message
  if (waBtn) {
    const msg = cart.map(i => `${i.name} x${i.qty} — ₹${i.price}`).join('\n')
      + `\n\nTotal: ₹${total.toLocaleString('en-IN')}`;
    const wa  = localStorage.getItem('artisancraft_wa') || '919999999999';
    waBtn.href = `https://wa.me/${wa}?text=${encodeURIComponent('Hi! I want to place an order:\n\n' + msg)}`;
  }
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  renderCartItems();
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

/* ═══════════════════════════════════════════
   HERO SLIDER
═══════════════════════════════════════════ */
let curSlide = 0;
const slidesWrap  = document.getElementById('slidesWrap');
const dotsWrap    = document.getElementById('dots');
const totalSlides = slidesWrap ? slidesWrap.querySelectorAll('.slide').length : 0;
let autoTimer;

(function buildDots() {
  if (!dotsWrap) return;
  for (let i = 0; i < totalSlides; i++) {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.onclick = () => { goSlide(i); resetAuto(); };
    dotsWrap.appendChild(d);
  }
})();

function goSlide(n) {
  curSlide = ((n % totalSlides) + totalSlides) % totalSlides;
  if (slidesWrap) slidesWrap.style.transform = `translateX(-${curSlide * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === curSlide));
}
function moveSlide(dir) { goSlide(curSlide + dir); resetAuto(); }
function resetAuto() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goSlide(curSlide + 1), 4500);
}
resetAuto();

// Touch swipe on hero
(function() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let startX = 0;
  hero.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  hero.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { moveSlide(diff > 0 ? 1 : -1); }
  }, {passive:true});
})();

/* ═══════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════ */
const searchInput = document.getElementById('searchInput');
const suggBox     = document.getElementById('suggBox');
const searchClear = document.getElementById('searchClear');

function getAllSearchItems() {
  const prods = getProducts().map(p => ({ name: p.name, cat: p.category }));
  return [...STATIC_SEARCH, ...prods];
}

if (searchInput) {
  searchInput.addEventListener('input', function () {
    const val = this.value.trim().toLowerCase();
    if (searchClear) searchClear.style.display = val ? 'block' : 'none';
    if (!val) { suggBox.style.display = 'none'; return; }
    const results = getAllSearchItems().filter(i => i.name.toLowerCase().includes(val)).slice(0, 7);
    if (!results.length) { suggBox.style.display = 'none'; return; }
    suggBox.innerHTML = results.map(r => {
      const label = CATS.find(c => c.key === r.cat)?.label || r.cat;
      return `<div class="sugg-item" onclick="goSearch('${r.cat}','${r.name}')">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>${r.name}</span>
        <span class="sugg-cat">${label}</span>
      </div>`;
    }).join('');
    suggBox.style.display = 'block';
  });
}

function goSearch(cat, name) {
  if (suggBox) suggBox.style.display = 'none';
  if (searchInput) searchInput.value = name;
  const section = document.getElementById('catSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => filterCat(cat), 400);
  }
}

function clearSearch() {
  if (searchInput) searchInput.value = '';
  if (suggBox) suggBox.style.display = 'none';
  if (searchClear) searchClear.style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap') && suggBox) suggBox.style.display = 'none';
});

/* ═══════════════════════════════════════════
   CATEGORY PILLS
═══════════════════════════════════════════ */
document.querySelectorAll('.pill').forEach(p => {
  p.addEventListener('click', function () {
    document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    filterCat(this.dataset.cat);
  });
});

function filterCat(cat) {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
  document.querySelectorAll('.pill').forEach(p =>
    p.classList.toggle('active', p.dataset.cat === cat));
}

/* ═══════════════════════════════════════════
   RENDER FEATURED PRODUCTS (from admin)
═══════════════════════════════════════════ */
function renderProducts() {
  const products = getProducts().filter(p => p.featured !== false);
  const grid   = document.getElementById('prodGrid');
  const noProd = document.getElementById('noProd');
  if (!grid) return;

  grid.querySelectorAll('.prod-card').forEach(c => c.remove());

  if (!products.length) {
    if (noProd) noProd.style.display = 'block';
    return;
  }
  if (noProd) noProd.style.display = 'none';

  products.forEach(p => {
    const disc = p.originalPrice && p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const catLabel = CATS.find(c => c.key === p.category)?.label || p.category;
    const wa = localStorage.getItem('artisancraft_wa') || '919999999999';
    const card = document.createElement('div');
    card.className = 'prod-card';
    card.innerHTML = `
      <div class="prod-img-wrap" onclick="${p.link ? `window.open('${p.link}','_blank')` : ''}">
        <img src="${p.image || 'https://placehold.co/260x320/e2d5c3/8b5e3c?text=Product&font=playfair'}"
             alt="${p.name}" loading="lazy"/>
        ${disc > 0 ? `<span class="prod-disc">${disc}% OFF</span>` : ''}
      </div>
      <div class="prod-body">
        <div class="prod-name" onclick="${p.link ? `window.open('${p.link}','_blank')` : ''}">${p.name}</div>
        <div class="prod-prices">
          ${p.originalPrice ? `<s>₹${Number(p.originalPrice).toLocaleString('en-IN')}</s>` : ''}
          <strong>₹${Number(p.price).toLocaleString('en-IN')}</strong>
        </div>
        <div class="prod-btns">
          <button class="prod-atc" id="atc_${p.id}"
            onclick="handleProdATC('${p.id}','${p.name}','${p.price}','${p.category}','${p.image || ''}','${p.link || ''}',this)">
            <i class="fa-solid fa-basket-shopping"></i> Add to Cart
          </button>
          <a href="https://wa.me/${wa}?text=Hi!+I+want+to+order+${encodeURIComponent(p.name)}"
             target="_blank" class="prod-wa-sm" title="Order on WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function handleProdATC(id, name, price, category, image, link, btn) {
  addToCart(id, name, price, category, image, link);
  btn.classList.add('added');
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = '<i class="fa-solid fa-basket-shopping"></i> Add to Cart';
  }, 2000);
}

/* ═══════════════════════════════════════════
   CATEGORY COUNTS
═══════════════════════════════════════════ */
function updateCounts() {
  const products = getProducts();
  CATS.forEach(c => {
    const n = products.filter(p => p.category === c.key).length;
    document.querySelectorAll(`.ccount[data-key="${c.key}"]`).forEach(el => {
      el.textContent = n > 0 ? `${n} design${n > 1 ? 's' : ''}` : '';
    });
  });
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ═══════════════════════════════════════════
   FLOATING CARE
═══════════════════════════════════════════ */
function toggleCare() {
  const menu = document.getElementById('careMenu');
  const btn  = document.querySelector('.float-btn');
  const ico  = document.getElementById('floatIco');
  const open = menu.classList.toggle('open');
  btn.classList.toggle('open', open);
  if (ico) ico.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-headset';
}
document.addEventListener('click', e => {
  if (!e.target.closest('.float-wrap')) {
    const menu = document.getElementById('careMenu');
    const btn  = document.querySelector('.float-btn');
    const ico  = document.getElementById('floatIco');
    if (menu) { menu.classList.remove('open'); }
    if (btn)  { btn.classList.remove('open'); }
    if (ico)  { ico.className = 'fa-solid fa-headset'; }
  }
});

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      revObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.cat-card,.why-card,.nail-card,.vc-box,.prod-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(22px)';
  el.style.transition = 'opacity .45s ease, transform .45s ease';
  revObs.observe(el);
});

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
updateCartBadge();
renderProducts();
updateCounts();

// Live sync from admin panel in another tab
window.addEventListener('storage', e => {
  if (e.key === DATA_KEY) { renderProducts(); updateCounts(); }
  if (e.key === CART_KEY) { updateCartBadge(); renderCartItems(); }
});
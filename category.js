/* ═══════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════ */
const API_URL  = 'https://script.google.com/macros/s/AKfycbzKE_ISsqnLyQKrY9iIKEZpv5ikAorBh-FriIq23F99-HeU0FD3v6sVcM_yBChda661/exec';
const CART_KEY = 'artisancraft_cart';
const WA_NUM   = localStorage.getItem('artisancraft_wa') || '919999999999';

const CAT_META = {
  sarees:      { label:'Sarees',       desc:'Handcrafted & hand painted sarees — woven with love.',         color:'linear-gradient(135deg,#5a2a10,#8b3a1a)' },
  nails:       { label:'Nail Art',     desc:'Custom press-on nails for every occasion.',                    color:'linear-gradient(135deg,#3a1020,#8b3060)' },
  shirts:      { label:'Shirts',       desc:'Hand painted & handcrafted shirts — wear your art.',           color:'linear-gradient(135deg,#0d2818,#1a6b3a)' },
  wall:        { label:'Wall Hangings',desc:'Boho & macramé wall art — transform your space.',              color:'linear-gradient(135deg,#1a0d2a,#5a2a8a)' },
  jewellery:   { label:'Jewellery',    desc:'Wedding hoops, rings & handcrafted jewellery.',                color:'linear-gradient(135deg,#3a3010,#8b6a1a)' },
  hoodies:     { label:'Hoodies',      desc:'Hand painted hoodies — cozy and one-of-a-kind.',               color:'linear-gradient(135deg,#102030,#2a5a8a)' },
  suits:       { label:'Suits',        desc:'Hand painted & handcrafted suits for every occasion.',         color:'linear-gradient(135deg,#2a1a0a,#6b4a20)' },
  accessories: { label:'Accessories',  desc:'Hair accessories, pouches, phone covers & more.',              color:'linear-gradient(135deg,#0a2a20,#2a6a50)' },
  bags:        { label:'Tote Bags',    desc:'Handpainted canvas tote bags — functional & beautiful.',       color:'linear-gradient(135deg,#2a1a0a,#5a3a18)' },
  gifting:     { label:'Gifting',      desc:'Platters, bookmarks & custom gifts for every celebration.',   color:'linear-gradient(135deg,#2a0a0a,#6a2020)' },
};

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let currentCat  = '';
let allProducts = [];
let filtered    = [];

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentCat   = params.get('cat') || 'sarees';
  setupHero();
  updateCartBadge();
  fetchAndRender();
});

function setupHero() {
  const meta  = CAT_META[currentCat] || { label: currentCat, desc: 'Handcrafted with love.', color: 'linear-gradient(135deg,var(--brown-d),var(--brown))' };
  document.getElementById('catTitle').textContent   = meta.label;
  document.getElementById('catDesc').textContent    = meta.desc;
  document.getElementById('catTag').textContent     = 'Collection';
  document.getElementById('breadCat').textContent   = meta.label;
  document.title = meta.label + ' – ArtisanCraft';
  document.getElementById('catHero').style.background = meta.color;
}

/* ═══════════════════════════════════════════
   FETCH FROM GOOGLE SHEETS
═══════════════════════════════════════════ */
async function fetchAndRender() {
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    if (data.success) {
      allProducts = data.products
        .filter(p => p.category === currentCat)
        .map(p => ({
          ...p,
          price:         Number(p.price) || 0,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          featured:      p.featured === 'TRUE' || p.featured === true
        }));
      filtered = [...allProducts];
      renderProducts();
    }
  } catch(e) {
    document.getElementById('loadingState').innerHTML =
      '<i class="fa-solid fa-wifi" style="font-size:36px;opacity:.3;display:block;margin-bottom:10px"></i><p>Could not load products. Check your connection.</p>';
  }
}

/* ═══════════════════════════════════════════
   SORT
═══════════════════════════════════════════ */
function sortProducts() {
  const val = document.getElementById('sortSelect').value;
  filtered = [...allProducts];
  if (val === 'price-low')  filtered.sort((a,b) => a.price - b.price);
  if (val === 'price-high') filtered.sort((a,b) => b.price - a.price);
  if (val === 'discount')   filtered.sort((a,b) => {
    const dA = a.originalPrice ? (1 - a.price/a.originalPrice) : 0;
    const dB = b.originalPrice ? (1 - b.price/b.originalPrice) : 0;
    return dB - dA;
  });
  renderProducts();
}

/* ═══════════════════════════════════════════
   RENDER PRODUCTS
═══════════════════════════════════════════ */
function renderProducts() {
  const list    = document.getElementById('prodList');
  const loading = document.getElementById('loadingState');
  const empty   = document.getElementById('emptyState');
  const count   = document.getElementById('prodCount');

  if (loading) loading.style.display = 'none';

  // remove old cards
  list.querySelectorAll('.prod-card').forEach(c => c.remove());

  if (!filtered.length) {
    if (empty) empty.style.display = 'block';
    if (count) count.textContent = '0 products';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (count) count.textContent = filtered.length + ' product' + (filtered.length > 1 ? 's' : '');

  filtered.forEach((p, idx) => {
    const disc = p.originalPrice && p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    const catLabel = CAT_META[p.category]?.label || p.category;
    const safeName = (p.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeImg  = (p.image || '').replace(/'/g, "\\'");
    const safeLink = (p.link || '').replace(/'/g, "\\'");

    const card = document.createElement('div');
    card.className = 'prod-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = `opacity .4s ease ${idx * 0.08}s, transform .4s ease ${idx * 0.08}s`;

    card.innerHTML = `
      <div class="prod-img-section" onclick="openImgModal('${safeImg}','${safeName}')">
        <img src="${p.image || 'https://placehold.co/400x300/e2d5c3/8b5e3c?text=Product&font=playfair'}"
             alt="${p.name}"
             onerror="this.src='https://placehold.co/400x300/e2d5c3/8b5e3c?text=Product'"/>
        ${disc > 0 ? `<span class="disc-badge">${disc}% OFF</span>` : ''}
        <div class="prod-img-overlay">
          <button class="view-more-btn" onclick="event.stopPropagation();openImgModal('${safeImg}','${safeName}')">
            <i class="fa-solid fa-expand"></i> View Image
          </button>
          <span class="cod-tag">COD Available</span>
        </div>
      </div>
      <div class="prod-body">
        <div class="prod-cat-tag">${catLabel}</div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-price-row">
          <span class="prod-price-sale">₹${Number(p.price).toLocaleString('en-IN')}</span>
          ${p.originalPrice ? `<span class="prod-price-mrp">₹${Number(p.originalPrice).toLocaleString('en-IN')}</span>` : ''}
          ${disc > 0 ? `<span class="prod-price-disc">${disc}% OFF</span>` : ''}
        </div>
        <div class="prod-btns">
          <button class="btn-atc" id="atc_${p.id}"
            onclick="handleATC('${p.id}','${safeName}','${p.price}','${p.category}','${safeImg}','${safeLink}',this)">
            <i class="fa-solid fa-basket-shopping"></i> Add to Cart
          </button>
          <div class="btn-row">
            <button class="btn-buy" onclick="buyNow('${safeName}','${p.price}','${safeImg}')">
              <i class="fa-solid fa-bolt"></i> Buy Now
            </button>
            <a href="https://wa.me/${WA_NUM}?text=Hi!+I+want+to+customise+${encodeURIComponent(p.name)}"
               target="_blank" class="btn-wa">
              <i class="fa-brands fa-whatsapp"></i> Customise
            </a>
          </div>
        </div>
      </div>`;

    list.appendChild(card);

    // Animate in
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 50 + idx * 80);
    });
  });
}

/* ═══════════════════════════════════════════
   ADD TO CART
═══════════════════════════════════════════ */
function handleATC(id, name, price, category, image, link, btn) {
  addToCart(id, name, price, category, image, link);
  btn.classList.add('added');
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart!';

  // After 2 seconds — change to Buy Now
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Buy Now';
    btn.classList.remove('btn-atc');
    btn.classList.add('btn-buy-full');
    btn.style.background = 'var(--cream)';
    btn.style.color = 'var(--brown-d)';
    btn.style.border = '2px solid var(--brown-d)';
    btn.onclick = () => buyNow(name, price, image);
  }, 2000);
}

function addToCart(id, name, price, category, image, link) {
  const cart = getCart();
  const ex   = cart.find(i => i.id === id);
  if (ex) { ex.qty += 1; }
  else { cart.push({ id, name, price: Number(price), category, image, link, qty: 1 }); }
  saveCart(cart);
  updateCartBadge();
  renderCartItems();
  showToast(`"${name}" added to cart!`);
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.style.transform = 'scale(1.6)'; setTimeout(() => badge.style.transform = '', 300); }
}

function getCart()      { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
  updateCartBadge(); renderCartItems();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart(cart); updateCartBadge(); renderCartItems();
}

function updateCartBadge() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = total;
}

/* ═══════════════════════════════════════════
   CART DRAWER
═══════════════════════════════════════════ */
function renderCartItems() {
  const cart      = getCart();
  const container = document.getElementById('cartItems');
  const foot      = document.getElementById('cartFoot');
  const waBtn     = document.getElementById('cartWaBtn');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `<div class="cart-empty"><i class="fa-solid fa-basket-shopping"></i><p>Your cart is empty</p></div>`;
    if (foot) foot.style.display = 'none';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    const clickFn = item.link ? `window.open('${item.link}','_blank')` : '';
    return `
      <div class="cart-item">
        <div class="cart-item-img" ${clickFn ? `onclick="${clickFn}" style="cursor:pointer"` : ''}>
          <img src="${item.image || 'https://placehold.co/56x56/e2d5c3/8b5e3c?text=P'}" alt="${item.name}"/>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
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

  if (foot) foot.style.display = 'flex';
  foot.style.flexDirection = 'column';
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');

  if (waBtn) {
    const msg = 'Hi! I want to place an order:\n\n'
      + cart.map(i => `• ${i.name} x${i.qty} — ₹${i.price}`).join('\n')
      + `\n\nTotal: ₹${total.toLocaleString('en-IN')}`;
    waBtn.href = `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
  }
}

function openCart()  {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  renderCartItems();
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

/* ═══════════════════════════════════════════
   BUY NOW
═══════════════════════════════════════════ */
function buyNow(name, price, image) {
  const msg = `Hi! I want to buy:\n\n• ${name} — ₹${Number(price).toLocaleString('en-IN')}\n\nPlease confirm availability.`;
  window.open(`https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
}

function buyNowAll() {
  const cart = getCart();
  if (!cart.length) return;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const msg = 'Hi! I want to buy:\n\n'
    + cart.map(i => `• ${i.name} x${i.qty} — ₹${i.price}`).join('\n')
    + `\n\nTotal: ₹${total.toLocaleString('en-IN')}`;
  window.open(`https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ═══════════════════════════════════════════
   IMAGE MODAL
═══════════════════════════════════════════ */
function openImgModal(img, name) {
  const modal = document.getElementById('imgModal');
  document.getElementById('imgModalImg').src  = img || 'https://placehold.co/480x480/e2d5c3/8b5e3c?text=Product';
  document.getElementById('imgModalName').textContent = name;
  modal.classList.add('open');
}
function closeImgModal(e) {
  if (e && e.target !== document.getElementById('imgModal') && !e.target.closest('.img-modal-close')) return;
  document.getElementById('imgModal').classList.remove('open');
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
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
    if (menu) menu.classList.remove('open');
    if (btn)  btn.classList.remove('open');
    if (ico)  ico.className = 'fa-solid fa-headset';
  }
});
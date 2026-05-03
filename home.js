const API_URL  = 'https://script.google.com/macros/s/AKfycbzKE_ISsqnLyQKrY9iIKEZpv5ikAorBh-FriIq23F99-HeU0FD3v6sVcM_yBChda661/exec';
const CART_KEY = 'artisancraft_cart';

const CATS = [
  {key:'sarees',      label:'Wall Hanging'},
  {key:'nails',       label:'Nail Art'},
  {key:'shirts',      label:'Mobile Cover'},
  {key:'wall',        label:'Hair Clips / Pookie Bags'},
  {key:'jewellery',   label:'Jewellery'},
  {key:'hoodies',     label:'Women Styling'},
  {key:'suits',       label:'Men Styling'},
  {key:'accessories', label:'Hair Accessories'},
  {key:'bags',        label:'Bookmarks'},
  {key:'gifting',     label:'Gifting'}
];

/* ─────────────────────────────────────────────────────────
   CATEGORY LINKS — Yahan apne links daalo
   Naye tab mein kholna: window.open(link, '_blank')
   Same tab mein kholna: window.location.href = link
   Agar kisi ka link nahi dena, us line ko hata do.
───────────────────────────────────────────────────────── */
const CAT_LINKS = {
  sarees:      'https://AAPKA-WALL-HANGING-LINK.com',
  nails:       'https://AAPKA-NAILS-LINK.com',
  shirts:      'https://AAPKA-MOBILE-COVER-LINK.com',
  wall:        'https://AAPKA-POOKIE-BAGS-LINK.com',
  jewellery:   'https://AAPKA-JEWELLERY-LINK.com',
  hoodies:     'https://AAPKA-WOMEN-STYLING-LINK.com',
  suits:       'https://AAPKA-MEN-STYLING-LINK.com',
  accessories: 'https://AAPKA-HAIR-ACCESSORIES-LINK.com',
  bags:        'https://AAPKA-BOOKMARKS-LINK.com',
  gifting:     'https://AAPKA-GIFTING-LINK.com',
};

/* ─── JSONP FETCH ─── */
let allProducts = [];

function fetchProductsJSONP() {
  showLoading(true);
  const cbName = 'gsCallback_' + Date.now();
  const script = document.createElement('script');
  const timeout = setTimeout(() => {
    showLoading(false);
    showFetchError();
    if (window[cbName]) delete window[cbName];
    if (script.parentNode) script.parentNode.removeChild(script);
  }, 10000);

  window[cbName] = function(data) {
    clearTimeout(timeout);
    showLoading(false);
    if (script.parentNode) script.parentNode.removeChild(script);
    delete window[cbName];
    if (data && data.success) {
      allProducts = (data.products || []).map(p => ({
        ...p,
        price:         Number(p.price) || 0,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        featured:      p.featured === 'TRUE' || p.featured === true
      }));
      renderProducts();
      updateCounts();
    } else {
      showFetchError();
    }
  };

  script.src = API_URL + '?callback=' + cbName;
  script.onerror = () => { clearTimeout(timeout); showLoading(false); showFetchError(); };
  document.head.appendChild(script);
}

function showLoading(show) {
  const grid = document.getElementById('prodGrid');
  if (!grid) return;
  const el = document.getElementById('prodLoading');
  if (show) {
    document.getElementById('noProd').style.display = 'none';
    if (!el) grid.insertAdjacentHTML('beforeend',
      `<div id="prodLoading" style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-l)">
        <div style="width:34px;height:34px;border:3px solid var(--border);border-top-color:var(--brown);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px"></div>
        <p style="font-size:13.5px">Loading products…</p>
      </div>`);
  } else {
    if (el) el.remove();
  }
}

function showFetchError() {
  const noProd = document.getElementById('noProd');
  if (noProd) {
    noProd.style.display = 'block';
    noProd.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation" style="font-size:36px;opacity:.4;display:block;margin-bottom:10px"></i>
      <p>Could not load products.<br/>Check your internet connection.</p>`;
  }
}

/* ─── CART ─── */
function getCart()      { try { return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); } catch { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(id, name, price, category, image, link) {
  const cart = getCart();
  const ex   = cart.find(i => i.id === id);
  if (ex) { ex.qty += 1; }
  else { cart.push({id, name, price:Number(price), category, image, link, qty:1}); }
  saveCart(cart);
  updateCartBadge();
  renderCartItems();
  showToast(`"${name}" added to cart!`);
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.style.transform='scale(1.6)'; setTimeout(()=>badge.style.transform='',300); }
}

function addToCartQuick(name, price, category, image, link) {
  addToCart('static_'+name.replace(/\s+/g,'_').toLowerCase(), name, price, category, image, link);
}

function removeFromCart(id) {
  saveCart(getCart().filter(i=>i.id!==id));
  updateCartBadge(); renderCartItems();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart(cart); updateCartBadge(); renderCartItems();
}

function updateCartBadge() {
  const total = getCart().reduce((s,i)=>s+i.qty,0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = total;
}

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
    const label   = CATS.find(c=>c.key===item.category)?.label || item.category;
    const clickFn = item.link ? `window.open('${item.link}','_blank')` : '';
    return `
      <div class="cart-item">
        <div class="cart-item-img" ${clickFn?`onclick="${clickFn}" style="cursor:pointer"`:''}>
          <img src="${item.image||'https://placehold.co/60x60/e2d5c3/8b5e3c?text=P'}" alt="${item.name}"/>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-cat">${label}</div>
          <div class="cart-item-price">₹${(item.price*item.qty).toLocaleString('en-IN')}</div>
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
  if (totalEl) totalEl.textContent = '₹'+total.toLocaleString('en-IN');

  if (waBtn) {
    const waNum = localStorage.getItem('artisancraft_wa') || '919999999999';
    const msg   = 'Hi! I want to place an order:\n\n'
      + cart.map(i=>`• ${i.name} x${i.qty} — ₹${i.price}`).join('\n')
      + `\n\nTotal: ₹${total.toLocaleString('en-IN')}`;
    waBtn.href = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
  }
}

function openCart()  { document.getElementById('cartDrawer').classList.add('open');  document.getElementById('cartOverlay').classList.add('open');  renderCartItems(); }
function closeCart() { document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); }

/* ─── HERO SLIDER ─── */
let curSlide  = 0;
const slidesWrap  = document.getElementById('slidesWrap');
const dotsWrap    = document.getElementById('dots');
const totalSlides = slidesWrap ? slidesWrap.querySelectorAll('.slide').length : 0;
let autoTimer;

(function buildDots(){
  if(!dotsWrap) return;
  for(let i=0;i<totalSlides;i++){
    const d = document.createElement('button');
    d.className = 'dot'+(i===0?' active':'');
    d.onclick = ()=>{ goSlide(i); resetAuto(); };
    dotsWrap.appendChild(d);
  }
})();

function goSlide(n){
  curSlide = ((n%totalSlides)+totalSlides)%totalSlides;
  if(slidesWrap) slidesWrap.style.transform = `translateX(-${curSlide*100}%)`;
  document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===curSlide));
}
function moveSlide(dir){ goSlide(curSlide+dir); resetAuto(); }
function resetAuto(){ clearInterval(autoTimer); autoTimer=setInterval(()=>goSlide(curSlide+1),4500); }
resetAuto();

(function(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  let sx = 0;
  hero.addEventListener('touchstart', e=>sx=e.touches[0].clientX, {passive:true});
  hero.addEventListener('touchend',   e=>{ if(Math.abs(sx-e.changedTouches[0].clientX)>40) moveSlide(sx>e.changedTouches[0].clientX?1:-1); }, {passive:true});
})();

/* ─── SEARCH ─── */
const searchInput = document.getElementById('searchInput');
const suggBox     = document.getElementById('suggBox');
const searchClear = document.getElementById('searchClear');

if(searchInput){
  searchInput.addEventListener('input', function(){
    const val = this.value.trim().toLowerCase();
    if(searchClear) searchClear.style.display = val ? 'block' : 'none';
    if(!val){ if(suggBox) suggBox.style.display = 'none'; return; }

    // Category cards se seedha search — h3 naam + p description dono match karta hai
    const cardResults = [];
    document.querySelectorAll('.cat-card').forEach(card => {
      const cat      = card.dataset.cat;
      const h3       = card.querySelector('h3')?.textContent || '';
      const desc     = card.querySelector('p')?.textContent  || '';
      const combined = (h3 + ' ' + desc).toLowerCase();
      if(combined.includes(val)){
        cardResults.push({ name: h3, sub: desc, cat: cat });
      }
    });

    // Google Sheets ke dynamic products bhi search karo
    const dynamic = allProducts
      .filter(p => p.name.toLowerCase().includes(val))
      .map(p => ({ name: p.name, sub: '', cat: p.category }));

    const results = [...cardResults, ...dynamic].slice(0, 7);

    if(!results.length){ suggBox.style.display = 'none'; return; }

    suggBox.innerHTML = results.map(r => {
      const label = CATS.find(c=>c.key===r.cat)?.label || r.cat;
      return `<div class="sugg-item" onclick="goSearch('${r.cat}','${r.name}')">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>${r.name}</span>
        <span class="sugg-cat">${label}</span>
      </div>`;
    }).join('');
    suggBox.style.display = 'block';
  });
}

/* ─── SEARCH → SCROLL TO CATEGORY CARD ─── */
function goSearch(cat, name){
  // Search band karo
  if(searchInput) searchInput.value = '';
  if(suggBox)     suggBox.style.display = 'none';
  if(searchClear) searchClear.style.display = 'none';

  // Us category ka card dhundo aur smooth scroll karo
  const card = document.querySelector(`.cat-card[data-cat="${cat}"]`);
  if(card){
    const hh = document.querySelector('.header')?.offsetHeight || 0;
    window.scrollTo({
      top: card.getBoundingClientRect().top + window.scrollY - hh - 16,
      behavior: 'smooth'
    });
    // Card highlight karo 1.5 sec ke liye
    card.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
    card.style.boxShadow  = '0 0 0 3px var(--brown, #8b5e3c)';
    card.style.transform  = 'scale(1.03)';
    setTimeout(()=>{
      card.style.boxShadow = '';
      card.style.transform = '';
    }, 1500);
  }
}

function clearSearch(){
  if(searchInput) searchInput.value = '';
  if(suggBox)     suggBox.style.display = 'none';
  if(searchClear) searchClear.style.display = 'none';
}
document.addEventListener('click', e=>{ if(!e.target.closest('.search-wrap')&&suggBox) suggBox.style.display='none'; });

/* ─── PILLS ─── */
document.querySelectorAll('.pill').forEach(p=>{
  p.addEventListener('click', function(){
    const cat = this.dataset.cat;
    if(cat==='all'){
      document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.cat-card').forEach(c=>c.style.display='');
      const sec = document.getElementById('catSection');
      if(sec){
        const hh = document.querySelector('.header')?.offsetHeight || 0;
        window.scrollTo({top: sec.getBoundingClientRect().top+window.scrollY-hh-8, behavior:'smooth'});
      }
    } else {
      const link = CAT_LINKS[cat];
      if(link){
        window.open(link, '_blank');
        // Same tab chahiye to yeh uncomment karo:
        // window.location.href = link;
      } else {
        window.location.href = 'category.html?cat='+cat;
      }
    }
  });
});

function filterCat(cat){
  if(cat==='all'){
    document.querySelectorAll('.cat-card').forEach(c=>c.style.display='');
  } else {
    const link = CAT_LINKS[cat];
    if(link){
      window.open(link, '_blank');
    } else {
      window.location.href = 'category.html?cat='+cat;
    }
  }
}

/* ─── RENDER PRODUCTS ─── */
function renderProducts(){
  const featured = allProducts.filter(p=>p.featured===true||p.featured==='TRUE');
  const grid     = document.getElementById('prodGrid');
  const noProd   = document.getElementById('noProd');
  if(!grid) return;
  grid.querySelectorAll('.prod-card').forEach(c=>c.remove());
  if(!featured.length){
    if(noProd){ noProd.style.display='block'; noProd.innerHTML='<i class="fa-solid fa-box-open"></i><p>Products will appear here once added from the admin panel.</p>'; }
    return;
  }
  if(noProd) noProd.style.display='none';
  featured.forEach(p=>{
    const disc     = p.originalPrice&&p.price ? Math.round((1-p.price/p.originalPrice)*100) : 0;
    const safeName = (p.name||'').replace(/'/g,"\\'");
    const safeImg  = (p.image||'').replace(/'/g,"\\'");
    const safeLink = (p.link||'').replace(/'/g,"\\'");
    const waNum    = localStorage.getItem('artisancraft_wa') || '919999999999';
    const card     = document.createElement('div');
    card.className = 'prod-card';
    card.innerHTML = `
      <div class="prod-img-wrap" ${p.link?`onclick="window.open('${safeLink}','_blank')" style="cursor:pointer"`:''}>
        <img src="${p.image||'https://placehold.co/260x320/e2d5c3/8b5e3c?text=Product&font=playfair'}"
             alt="${p.name}" loading="lazy"
             onerror="this.src='https://placehold.co/260x320/e2d5c3/8b5e3c?text=Product'"/>
        ${disc>0?`<span class="prod-disc">${disc}% OFF</span>`:''}
      </div>
      <div class="prod-body">
        <div class="prod-name">${p.name}</div>
        <div class="prod-prices">
          ${p.originalPrice?`<s>₹${Number(p.originalPrice).toLocaleString('en-IN')}</s>`:''}
          <strong>₹${Number(p.price).toLocaleString('en-IN')}</strong>
        </div>
        <div class="prod-btns">
          <button class="prod-atc" onclick="handleProdATC('${p.id}','${safeName}','${p.price}','${p.category}','${safeImg}','${safeLink}',this)">
            <i class="fa-solid fa-basket-shopping"></i> Add to Cart
          </button>
          <a href="https://wa.me/${waNum}?text=Hi!+I+want+to+order+${encodeURIComponent(p.name)}"
             target="_blank" class="prod-wa-sm"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>`;
    grid.appendChild(card);
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(22px)';
    card.style.transition = 'opacity .45s ease, transform .45s ease';
    revObs.observe(card);
  });
}

function handleProdATC(id,name,price,category,image,link,btn){
  addToCart(id,name,price,category,image,link);
  btn.classList.add('added');
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  setTimeout(()=>{ btn.classList.remove('added'); btn.innerHTML='<i class="fa-solid fa-basket-shopping"></i> Add to Cart'; }, 2000);
}

/* ─── COUNTS ─── */
function updateCounts(){
  CATS.forEach(c=>{
    const n = allProducts.filter(p=>p.category===c.key).length;
    document.querySelectorAll(`.ccount[data-key="${c.key}"]`).forEach(el=>{
      el.textContent = n>0 ? `${n} design${n>1?'s':''}` : '';
    });
  });
}

/* ─── TOAST ─── */
function showToast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ─── FLOATING CARE ─── */
function toggleCare(){
  const menu = document.getElementById('careMenu');
  const btn  = document.querySelector('.float-btn');
  const ico  = document.getElementById('floatIco');
  const open = menu.classList.toggle('open');
  btn.classList.toggle('open', open);
  if(ico) ico.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-headset';
}
document.addEventListener('click', e=>{
  if(!e.target.closest('.float-wrap')){
    const menu = document.getElementById('careMenu');
    const btn  = document.querySelector('.float-btn');
    const ico  = document.getElementById('floatIco');
    if(menu) menu.classList.remove('open');
    if(btn)  btn.classList.remove('open');
    if(ico)  ico.className = 'fa-solid fa-headset';
  }
});

/* ─── SCROLL REVEAL ─── */
const revObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.style.opacity   = '1';
      e.target.style.transform = 'translateY(0)';
      revObs.unobserve(e.target);
    }
  });
}, {threshold:0.08});

document.querySelectorAll('.cat-card,.why-card,.nail-card,.vc-box').forEach(el=>{
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(22px)';
  el.style.transition = 'opacity .45s ease, transform .45s ease';
  revObs.observe(el);
});

/* ─── CSS INJECT ─── */
const s = document.createElement('style');
s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(s);

/* ─── INIT ─── */
updateCartBadge();
fetchProductsJSONP();
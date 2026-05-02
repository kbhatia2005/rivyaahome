/* ═══════════════════════════════════════════
   GOOGLE SHEETS API
═══════════════════════════════════════════ */
const API_URL  = 'https://script.google.com/macros/s/AKfycbzKE_ISsqnLyQKrY9iIKEZpv5ikAorBh-FriIq23F99-HeU0FD3v6sVcM_yBChda661/exec';
const CART_KEY = 'artisancraft_cart';

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
  {name:'Hand Painted Shirt',cat:'shirts'},{name:'Handcrafted Shirt',cat:'shirts'},
  {name:'Wall Hanging',cat:'wall'},{name:'Macramé Wall Art',cat:'wall'},
  {name:'Wedding Hoops',cat:'jewellery'},{name:'Engagement Ring Platter',cat:'gifting'},
  {name:'Hand Painted Hoodie',cat:'hoodies'},{name:'Handcrafted Suit',cat:'suits'},
  {name:'Tote Bag',cat:'bags'},{name:'Hair Accessories',cat:'accessories'},
  {name:'Hand Painted Pouch',cat:'accessories'},{name:'Bookmark',cat:'gifting'},
];

/* ═══════════════════════════════════════════
   FETCH PRODUCTS FROM GOOGLE SHEETS
═══════════════════════════════════════════ */
let allProducts = [];

async function fetchProducts() {
  showLoading(true);
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    if (data.success) {
      allProducts = data.products.map(p => ({
        ...p,
        price:         Number(p.price) || 0,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        featured:      p.featured === 'TRUE' || p.featured === true
      }));
      renderProducts();
      updateCounts();
    }
  } catch (err) {
    console.error('Fetch error:', err);
    const noProd = document.getElementById('noProd');
    if (noProd) {
      noProd.style.display = 'block';
      noProd.innerHTML = '<i class="fa-solid fa-wifi" style="opacity:.3;font-size:36px;display:block;margin-bottom:10px"></i><p>Could not load products. Check your connection.</p>';
    }
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const grid = document.getElementById('prodGrid');
  if (!grid) return;
  const existing = document.getElementById('prodLoading');
  if (show) {
    if (existing) return;
    document.getElementById('noProd').style.display = 'none';
    grid.insertAdjacentHTML('beforeend',
      `<div id="prodLoading" style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-l)">
        <div style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--brown);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px"></div>
        <p style="font-size:13.5px">Loading products…</p>
      </div>`);
  } else {
    if (existing) existing.remove();
  }
}

/* ═══════════════════════════════════════════
   CART
═══════════════════════════════════════════ */
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
          <div class="cart-item-name" ${clickFn?`onclick="${clickFn}" style="cursor:pointer"`:''}">${item.name}</div>
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
    const msg = 'Hi! I want to place an order:\n\n'
      + cart.map(i=>`• ${i.name} x${i.qty} — ₹${i.price}`).join('\n')
      + `\n\nTotal: ₹${total.toLocaleString('en-IN')}`;
    waBtn.href = `https://wa.me/916239446372?text=${encodeURIComponent(msg)}`;
  }
}

function openCart()  { document.getElementById('cartDrawer').classList.add('open');  document.getElementById('cartOverlay').classList.add('open');  renderCartItems(); }
function closeCart() { document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); }

/* ═══════════════════════════════════════════
   HERO SLIDER
═══════════════════════════════════════════ */
let curSlide   = 0;
const slidesWrap  = document.getElementById('slidesWrap');
const dotsWrap    = document.getElementById('dots');
const totalSlides = slidesWrap ? slidesWrap.querySelectorAll('.slide').length : 0;
let autoTimer;

(function buildDots() {
  if (!dotsWrap) return;
  for (let i=0;i<totalSlides;i++) {
    const d=document.createElement('button');
    d.className='dot'+(i===0?' active':'');
    d.onclick=()=>{goSlide(i);resetAuto();};
    dotsWrap.appendChild(d);
  }
})();

function goSlide(n) {
  curSlide=((n%totalSlides)+totalSlides)%totalSlides;
  if (slidesWrap) slidesWrap.style.transform=`translateX(-${curSlide*100}%)`;
  document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active',i===curSlide));
}
function moveSlide(dir) { goSlide(curSlide+dir); resetAuto(); }
function resetAuto() { clearInterval(autoTimer); autoTimer=setInterval(()=>goSlide(curSlide+1),4500); }
resetAuto();

(function(){
  const hero=document.querySelector('.hero');
  if(!hero) return;
  let sx=0;
  hero.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
  hero.addEventListener('touchend',e=>{if(Math.abs(sx-e.changedTouches[0].clientX)>40)moveSlide(sx>e.changedTouches[0].clientX?1:-1);},{passive:true});
})();

/* ═══════════════════════════════════════════
   SEARCH
═══════════════════════════════════════════ */
const searchInput = document.getElementById('searchInput');
const suggBox     = document.getElementById('suggBox');
const searchClear = document.getElementById('searchClear');

if (searchInput) {
  searchInput.addEventListener('input', function() {
    const val = this.value.trim().toLowerCase();
    if (searchClear) searchClear.style.display = val?'block':'none';
    if (!val) { if(suggBox) suggBox.style.display='none'; return; }
    const dynamic  = allProducts.map(p=>({name:p.name,cat:p.category}));
    const results  = [...STATIC_SEARCH,...dynamic].filter(i=>i.name.toLowerCase().includes(val)).slice(0,7);
    if (!results.length) { suggBox.style.display='none'; return; }
    suggBox.innerHTML = results.map(r=>{
      const label=CATS.find(c=>c.key===r.cat)?.label||r.cat;
      return `<div class="sugg-item" onclick="goSearch('${r.cat}','${r.name}')">
        <i class="fa-solid fa-magnifying-glass"></i><span>${r.name}</span>
        <span class="sugg-cat">${label}</span></div>`;
    }).join('');
    suggBox.style.display='block';
  });
}

function goSearch(cat,name) {
  if(suggBox) suggBox.style.display='none';
  if(searchInput) searchInput.value=name;
  const sec=document.getElementById('catSection');
  if(sec){sec.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>filterCat(cat),400);}
}
function clearSearch() {
  if(searchInput) searchInput.value='';
  if(suggBox) suggBox.style.display='none';
  if(searchClear) searchClear.style.display='none';
}
document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap')&&suggBox)suggBox.style.display='none';});

/* ═══════════════════════════════════════════
   PILLS & FILTER
═══════════════════════════════════════════ */
document.querySelectorAll('.pill').forEach(p=>{
  p.addEventListener('click',function(){
    document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
    this.classList.add('active');
    filterCat(this.dataset.cat);
  });
});
function filterCat(cat) {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === cat));

  // Scroll to category section
  const section = document.getElementById('catSection');
  if (section) {
    const headerH = document.querySelector('.header')?.offsetHeight || 0;
    const top = section.getBoundingClientRect().top + window.scrollY - headerH - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}
/* ═══════════════════════════════════════════
   RENDER PRODUCTS
═══════════════════════════════════════════ */
function renderProducts() {
  const featured = allProducts.filter(p=>p.featured===true||p.featured==='TRUE');
  const grid     = document.getElementById('prodGrid');
  const noProd   = document.getElementById('noProd');
  if (!grid) return;

  grid.querySelectorAll('.prod-card').forEach(c=>c.remove());

  if (!featured.length) {
    if (noProd) {
      noProd.style.display='block';
      noProd.innerHTML='<i class="fa-solid fa-box-open"></i><p>Products will appear here once added from the admin panel.</p>';
    }
    return;
  }
  if (noProd) noProd.style.display='none';

  featured.forEach(p=>{
    const disc = p.originalPrice&&p.price ? Math.round((1-p.price/p.originalPrice)*100) : 0;
    const safeName = p.name.replace(/'/g,"\\'");
    const card = document.createElement('div');
    card.className='prod-card';
    card.innerHTML=`
      <div class="prod-img-wrap" ${p.link?`onclick="window.open('${p.link}','_blank')" style="cursor:pointer"`:''}>
        <img src="${p.image||'https://placehold.co/260x320/e2d5c3/8b5e3c?text=Product&font=playfair'}"
             alt="${p.name}" loading="lazy"
             onerror="this.src='https://placehold.co/260x320/e2d5c3/8b5e3c?text=Product'"/>
        ${disc>0?`<span class="prod-disc">${disc}% OFF</span>`:''}
      </div>
      <div class="prod-body">
        <div class="prod-name" ${p.link?`onclick="window.open('${p.link}','_blank')" style="cursor:pointer"`:''}">${p.name}</div>
        <div class="prod-prices">
          ${p.originalPrice?`<s>₹${Number(p.originalPrice).toLocaleString('en-IN')}</s>`:''}
          <strong>₹${Number(p.price).toLocaleString('en-IN')}</strong>
        </div>
        <div class="prod-btns">
          <button class="prod-atc"
            onclick="handleProdATC('${p.id}','${safeName}','${p.price}','${p.category}','${p.image||''}','${p.link||''}',this)">
            <i class="fa-solid fa-basket-shopping"></i> Add to Cart
          </button>
          <a href="https://wa.me/916239446372?text=Hi!+I+want+to+order+${encodeURIComponent(p.name)}"
             target="_blank" class="prod-wa-sm"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>`;
    grid.appendChild(card);
    card.style.opacity='0'; card.style.transform='translateY(22px)';
    card.style.transition='opacity .45s ease, transform .45s ease';
    revObs.observe(card);
  });
}

function handleProdATC(id,name,price,category,image,link,btn) {
  addToCart(id,name,price,category,image,link);
  btn.classList.add('added');
  btn.innerHTML='<i class="fa-solid fa-check"></i> Added!';
  setTimeout(()=>{btn.classList.remove('added');btn.innerHTML='<i class="fa-solid fa-basket-shopping"></i> Add to Cart';},2000);
}

/* ═══════════════════════════════════════════
   CATEGORY COUNTS
═══════════════════════════════════════════ */
function updateCounts() {
  CATS.forEach(c=>{
    const n=allProducts.filter(p=>p.category===c.key).length;
    document.querySelectorAll(`.ccount[data-key="${c.key}"]`).forEach(el=>{
      el.textContent=n>0?`${n} design${n>1?'s':''}`:'';
    });
  });
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(msg) {
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2200);
}

/* ═══════════════════════════════════════════
   FLOATING CARE
═══════════════════════════════════════════ */
function toggleCare() {
  const menu=document.getElementById('careMenu');
  const btn=document.querySelector('.float-btn');
  const ico=document.getElementById('floatIco');
  const open=menu.classList.toggle('open');
  btn.classList.toggle('open',open);
  if(ico) ico.className=open?'fa-solid fa-xmark':'fa-solid fa-headset';
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.float-wrap')){
    const menu=document.getElementById('careMenu');
    const btn=document.querySelector('.float-btn');
    const ico=document.getElementById('floatIco');
    if(menu)menu.classList.remove('open');
    if(btn)btn.classList.remove('open');
    if(ico)ico.className='fa-solid fa-headset';
  }
});

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
const revObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.style.opacity='1';
      e.target.style.transform='translateY(0)';
      revObs.unobserve(e.target);
    }
  });
},{threshold:0.08});

document.querySelectorAll('.cat-card,.why-card,.nail-card,.vc-box').forEach(el=>{
  el.style.opacity='0'; el.style.transform='translateY(22px)';
  el.style.transition='opacity .45s ease, transform .45s ease';
  revObs.observe(el);
});

/* CSS spin animation inject */
const style=document.createElement('style');
style.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(style);

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
updateCartBadge();
fetchProducts();
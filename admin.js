/* ═══════════════════════════════════════════
   CONSTANTS & STORAGE
═══════════════════════════════════════════ */
const DATA_KEY  = 'artisancraft_products';
const AUTH_KEY  = 'artisancraft_auth';
const SETT_KEY  = 'artisancraft_settings';

const CATS = [
  {key:'sarees',label:'Sarees',icon:'🥻'},
  {key:'nails',label:'Nail Art',icon:'💅'},
  {key:'shirts',label:'Shirts',icon:'👕'},
  {key:'wall',label:'Wall Hangings',icon:'🖼️'},
  {key:'jewellery',label:'Jewellery',icon:'💍'},
  {key:'hoodies',label:'Hoodies',icon:'🧥'},
  {key:'suits',label:'Suits',icon:'👔'},
  {key:'accessories',label:'Accessories',icon:'🎀'},
  {key:'bags',label:'Tote Bags',icon:'👜'},
  {key:'gifting',label:'Gifting',icon:'🎁'},
];

function getProducts()  { try { return JSON.parse(localStorage.getItem(DATA_KEY)||'[]'); } catch{ return []; } }
function saveProducts(p){ localStorage.setItem(DATA_KEY, JSON.stringify(p)); }
function getSettings()  { try { return JSON.parse(localStorage.getItem(SETT_KEY)||'{}'); } catch{ return {}; } }
function saveSettings_s(s){ localStorage.setItem(SETT_KEY, JSON.stringify(s)); }

/* ═══════════════════════════════════════════
   LOGIN / LOGOUT
═══════════════════════════════════════════ */
function doLogin() {
  const u    = document.getElementById('loginUser').value.trim();
  const p    = document.getElementById('loginPass').value;
  const sett = getSettings();
  const user = sett.username || 'admin';
  const pass = sett.password || 'admin123';
  if (u === user && p === pass) {
    sessionStorage.setItem(AUTH_KEY, '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display   = 'flex';
    initDashboard();
  } else {
    document.getElementById('loginErr').textContent = 'Incorrect username or password.';
    document.getElementById('loginPass').style.borderColor = '#c0392b';
    setTimeout(() => {
      document.getElementById('loginErr').textContent = '';
      document.getElementById('loginPass').style.borderColor = '';
    }, 2500);
  }
}

function doLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  document.getElementById('dashboard').style.display   = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

function togglePwd() {
  const inp = document.getElementById('loginPass');
  const ico = document.getElementById('eyeIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    ico.className = 'fa-solid fa-eye-slash';
  } else {
    inp.type = 'password';
    ico.className = 'fa-solid fa-eye';
  }
}

// Auto-login if already authenticated
window.addEventListener('load', () => {
  if (sessionStorage.getItem(AUTH_KEY)) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display   = 'flex';
    initDashboard();
  }
});

/* ═══════════════════════════════════════════
   INIT DASHBOARD
═══════════════════════════════════════════ */
function initDashboard() {
  renderStats();
  renderTable();
  renderCatOverview();
  loadSettings();
}

/* ═══════════════════════════════════════════
   SIDEBAR (mobile)
═══════════════════════════════════════════ */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sbOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('open');
}

/* ═══════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════ */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const titles = {products:'Products',categories:'Categories',orders:'Orders',settings:'Settings'};
  document.getElementById('pageTitle').textContent = titles[tab] || tab;
  closeSidebar();
  if (tab === 'categories') renderCatOverview();
}

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
function renderStats() {
  const products = getProducts();
  const featured = products.filter(p => p.featured !== false).length;
  const cats     = [...new Set(products.map(p => p.category))].length;
  const row      = document.getElementById('statsRow');
  if (!row) return;
  row.innerHTML = `
    <div class="stat-card">
      <div class="stat-num">${products.length}</div>
      <div class="stat-label">Total Products</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${featured}</div>
      <div class="stat-label">Featured</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${cats}</div>
      <div class="stat-label">Categories Used</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${CATS.length}</div>
      <div class="stat-label">Total Categories</div>
    </div>`;
}

/* ═══════════════════════════════════════════
   PRODUCTS TABLE
═══════════════════════════════════════════ */
function renderTable() {
  const q    = (document.getElementById('filterInput')?.value || '').toLowerCase();
  const cat  = document.getElementById('filterCat')?.value || 'all';
  let prods  = getProducts();
  if (q)          prods = prods.filter(p => p.name.toLowerCase().includes(q));
  if (cat !== 'all') prods = prods.filter(p => p.category === cat);

  const tbody  = document.getElementById('prodTbody');
  const empty  = document.getElementById('emptyState');
  if (!tbody) return;

  if (!prods.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = prods.map(p => {
    const catLabel = CATS.find(c => c.key === p.category)?.label || p.category;
    const disc = p.originalPrice && p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    return `
      <tr>
        <td>
          <div class="tbl-img">
            <img src="${p.image || 'https://placehold.co/48x48/e2d5c3/8b5e3c?text=P'}"
                 alt="${p.name}" onerror="this.src='https://placehold.co/48x48/e2d5c3/8b5e3c?text=P'"/>
          </div>
        </td>
        <td>
          <div class="tbl-name" title="${p.name}">${p.name}</div>
          ${disc > 0 ? `<small style="color:#c84a0a;font-size:11px">${disc}% off</small>` : ''}
        </td>
        <td><span class="cat-badge">${catLabel}</span></td>
        <td><strong style="color:var(--brown-d)">₹${Number(p.price).toLocaleString('en-IN')}</strong></td>
        <td>${p.originalPrice ? `<s style="color:var(--text-l);font-size:12px">₹${Number(p.originalPrice).toLocaleString('en-IN')}</s>` : '—'}</td>
        <td>
          <button class="feat-toggle ${p.featured !== false ? 'on' : 'off'}"
            onclick="toggleFeatured('${p.id}')" title="${p.featured !== false ? 'Featured ON' : 'Featured OFF'}">
          </button>
        </td>
        <td>
          <div class="action-btns">
            <button class="edit-btn" onclick="openModal('${p.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="del-btn" onclick="confirmDelete('${p.id}','${p.name.replace(/'/g,'\\\'') }')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function toggleFeatured(id) {
  const prods = getProducts();
  const p = prods.find(x => x.id === id);
  if (!p) return;
  p.featured = p.featured === false ? true : false;
  saveProducts(prods);
  renderTable();
  renderStats();
  showToast(p.featured ? 'Marked as Featured' : 'Removed from Featured');
}

/* ═══════════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════════ */
function openModal(editId) {
  const backdrop = document.getElementById('modalBackdrop');
  const title    = document.getElementById('modalTitle');
  const saveTxt  = document.getElementById('saveBtnTxt');
  resetForm();

  if (editId) {
    const p = getProducts().find(x => x.id === editId);
    if (!p) return;
    title.innerHTML   = '<i class="fa-solid fa-pen"></i> Edit Product';
    saveTxt.textContent = 'Update Product';
    document.getElementById('editId').value       = p.id;
    document.getElementById('fName').value        = p.name;
    document.getElementById('fCat').value         = p.category;
    document.getElementById('fPrice').value       = p.price;
    document.getElementById('fOriginal').value    = p.originalPrice || '';
    document.getElementById('fImage').value       = p.image || '';
    document.getElementById('fLink').value        = p.link || '';
    document.getElementById('fFeatured').checked  = p.featured !== false;
    if (p.image) previewImg(p.image);
  } else {
    title.innerHTML   = '<i class="fa-solid fa-plus"></i> Add Product';
    saveTxt.textContent = 'Save Product';
  }

  backdrop.classList.add('open');
  setTimeout(() => document.getElementById('fName').focus(), 300);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalBackdrop')) return;
  document.getElementById('modalBackdrop').classList.remove('open');
  resetForm();
}

function resetForm() {
  ['editId','fName','fPrice','fOriginal','fImage','fLink'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('fCat');
  if (cat) cat.value = '';
  const feat = document.getElementById('fFeatured');
  if (feat) feat.checked = true;
  const err = document.getElementById('formErr');
  if (err) err.textContent = '';
  clearImg();
}

function previewImg(url) {
  const wrap = document.getElementById('imgPreviewWrap');
  const img  = document.getElementById('imgPreview');
  if (!url || !url.trim()) { if (wrap) wrap.style.display = 'none'; return; }
  if (img)  img.src = url;
  if (wrap) wrap.style.display = 'block';
}

function clearImg() {
  const wrap = document.getElementById('imgPreviewWrap');
  const img  = document.getElementById('imgPreview');
  const inp  = document.getElementById('fImage');
  if (wrap) wrap.style.display = 'none';
  if (img)  img.src = '';
  if (inp)  inp.value = '';
}

function saveProduct() {
  const name     = document.getElementById('fName').value.trim();
  const category = document.getElementById('fCat').value;
  const price    = document.getElementById('fPrice').value.trim();
  const original = document.getElementById('fOriginal').value.trim();
  const image    = document.getElementById('fImage').value.trim();
  const link     = document.getElementById('fLink').value.trim();
  const featured = document.getElementById('fFeatured').checked;
  const editId   = document.getElementById('editId').value;
  const errEl    = document.getElementById('formErr');

  if (!name)     { errEl.textContent = 'Product name is required.'; return; }
  if (!category) { errEl.textContent = 'Please select a category.'; return; }
  if (!price || isNaN(price) || Number(price) <= 0) { errEl.textContent = 'Enter a valid sale price.'; return; }
  errEl.textContent = '';

  const prods = getProducts();
  const btn   = document.querySelector('.save-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…'; }

  setTimeout(() => {
    if (editId) {
      const idx = prods.findIndex(p => p.id === editId);
      if (idx > -1) {
        prods[idx] = { ...prods[idx], name, category, price: Number(price),
          originalPrice: original ? Number(original) : null, image, link, featured };
      }
      showToast('Product updated!');
    } else {
      prods.push({
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
        name, category, price: Number(price),
        originalPrice: original ? Number(original) : null,
        image, link, featured, createdAt: Date.now()
      });
      showToast('Product added!');
    }
    saveProducts(prods);
    renderTable();
    renderStats();
    renderCatOverview();
    document.getElementById('modalBackdrop').classList.remove('open');
    resetForm();
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span id="saveBtnTxt">Save Product</span>'; }
  }, 300);
}

/* ═══════════════════════════════════════════
   DELETE
═══════════════════════════════════════════ */
function confirmDelete(id, name) {
  const backdrop = document.getElementById('confirmBackdrop');
  const msg      = document.getElementById('confirmMsg');
  const okBtn    = document.getElementById('confirmOkBtn');
  msg.textContent = `Delete "${name}"? This cannot be undone.`;
  backdrop.classList.add('open');
  okBtn.onclick = () => {
    const prods = getProducts().filter(p => p.id !== id);
    saveProducts(prods);
    renderTable();
    renderStats();
    renderCatOverview();
    showToast('Product deleted');
    closeConfirm();
  };
}

function closeConfirm() {
  document.getElementById('confirmBackdrop').classList.remove('open');
}

function deleteAll() {
  confirmDelete = null;
  const backdrop = document.getElementById('confirmBackdrop');
  const msg      = document.getElementById('confirmMsg');
  const okBtn    = document.getElementById('confirmOkBtn');
  msg.textContent = 'Delete ALL products? This cannot be undone.';
  backdrop.classList.add('open');
  okBtn.onclick = () => {
    saveProducts([]);
    renderTable();
    renderStats();
    renderCatOverview();
    showToast('All products deleted');
    closeConfirm();
  };
}

/* ═══════════════════════════════════════════
   CATEGORIES OVERVIEW
═══════════════════════════════════════════ */
function renderCatOverview() {
  const products = getProducts();
  const wrap     = document.getElementById('catOverview');
  if (!wrap) return;
  wrap.innerHTML = CATS.map(c => {
    const n = products.filter(p => p.category === c.key).length;
    return `
      <div class="cat-stat-card">
        <div class="cat-icon">${c.icon}</div>
        <div class="cat-stat-info">
          <h4>${c.label}</h4>
          <div class="cnt">${n}</div>
          <p>${n === 0 ? 'No products yet' : n + ' product' + (n > 1 ? 's' : '')}</p>
        </div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════ */
function loadSettings() {
  const s = getSettings();
  const wu = document.getElementById('setUser');
  const wp = document.getElementById('setPass');
  const ww = document.getElementById('setWa');
  const wn = document.getElementById('setStoreName');
  if (wu) wu.value = s.username || '';
  if (ww) ww.value = s.waNumber || '916239446372';
  if (wn) wn.value = s.storeName || 'ArtisanCraft';
}

function saveSettings() {
  const s     = getSettings();
  const u     = document.getElementById('setUser').value.trim();
  const p     = document.getElementById('setPass').value;
  const wa    = document.getElementById('setWa').value.trim();
  const name  = document.getElementById('setStoreName').value.trim();
  const msg   = document.getElementById('saveMsg');

  if (u) s.username  = u;
  if (p) s.password  = p;
  if (wa) { s.waNumber = wa; localStorage.setItem('artisancraft_wa', wa); }
  if (name) s.storeName = name;

  saveSettings_s(s);
  if (msg) {
    msg.textContent = '✓ Settings saved successfully!';
    setTimeout(() => msg.textContent = '', 3000);
  }
  showToast('Settings saved!');
  document.getElementById('setPass').value = '';
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('adminToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}
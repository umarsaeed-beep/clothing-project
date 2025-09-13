/* Professional frontend that works standalone or with backend.
   - It will try to fetch /api/products; if that fails, it uses localProducts.
   - Cart persisted in localStorage.
*/

const localProducts = [
  { id:1, title:"Casual Shirt", tagline:"Everyday comfort", price:3299, compareAt:0,
    image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=60", sizes:["S","M","L"], colors:["White","Black"], category:"t-shirts", newest:true },
  { id:2, title:"Blue Jeans", tagline:"Classic blue denim", price:4599, compareAt:5999,
    image:"https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=60", sizes:["M","L","XL"], colors:["Blue"], category:"jeans" },
  { id:3, title:"Sport Shoes", tagline:"Run. Jump. Chill.", price:6999, compareAt:0,
    image:"https://images.unsplash.com/photo-1528701800489-20be0e92f37e?auto=format&fit=crop&w=1000&q=60", sizes:["8","9","10"], colors:["Black"], category:"shoes" },
  { id:4, title:"Cozy Hoodie", tagline:"Hood up, world off", price:5799, compareAt:6999,
    image:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=60", sizes:["M","L","XL"], colors:["Grey","Black"], category:"hoodies", newest:true },
  { id:5, title:"Denim Jacket", tagline:"Rough & ready", price:8999, compareAt:0,
    image:"https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1000&q=60", sizes:["M","L"], colors:["Blue"], category:"jackets" },
  { id:6, title:"Snapback Cap", tagline:"Finish the look", price:1299, compareAt:0,
    image:"https://images.unsplash.com/photo-1519741491664-9e6b69d0b20a?auto=format&fit=crop&w=1000&q=60", sizes:["One Size"], colors:["Black","White"], category:"accessories" }
];

let state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('shop_cart')||'[]'),
  sort: 'recommend',
  q: ''
};

const els = {
  grid: document.getElementById('productGrid'),
  cartCount: document.getElementById('cartCount'),
  cartList: document.getElementById('cartList'),
  subtotal: document.getElementById('subtotal'),
  cartDrawer: document.getElementById('cartDrawer'),
  openCart: document.getElementById('openCart'),
  closeCart: document.getElementById('closeCart'),
  search: document.getElementById('search'),
  sort: document.getElementById('sort'),
  modal: document.getElementById('modal'),
  modalImg: document.getElementById('modalImg'),
  modalTitle: document.getElementById('modalTitle'),
  modalTag: document.getElementById('modalTag'),
  modalPrice: document.getElementById('modalPrice'),
  modalCompare: document.getElementById('modalCompare'),
  sizeWrap: document.getElementById('sizeWrap'),
  colorWrap: document.getElementById('colorWrap'),
  modalAdd: document.getElementById('modalAdd'),
  closeModal: document.getElementById('closeModal'),
  contactForm: document.getElementById('contactForm'),
  contactStatus: document.getElementById('contactStatus')
};

// Utility
const fmt = n => `Rs\u00A0${n.toLocaleString('en-PK')}`;
const saveCart = ()=> localStorage.setItem('shop_cart', JSON.stringify(state.cart));
const cartCount = ()=> state.cart.reduce((s,i)=> s + i.qty, 0);
const subtotalVal = ()=> state.cart.reduce((s,i)=> s + (i.price * i.qty), 0);

// Try to fetch products from backend, otherwise fallback to localProducts
async function loadProducts(){
  try{
    const resp = await fetch('/api/products');
    if(!resp.ok) throw new Error('no api');
    const data = await resp.json();
    state.products = data;
  }catch(e){
    state.products = localProducts;
  }
  renderProducts();
}

// Render grid
function renderProducts(){
  const q = state.q.trim().toLowerCase();
  let list = state.products.slice();
  if(q) list = list.filter(p => (p.title + ' ' + (p.tagline||'')).toLowerCase().includes(q));
  switch(state.sort){
    case 'priceLow': list.sort((a,b)=> a.price - b.price); break;
    case 'priceHigh': list.sort((a,b)=> b.price - a.price); break;
    case 'nameAZ': list.sort((a,b)=> a.title.localeCompare(b.title)); break;
    case 'nameZA': list.sort((a,b)=> b.title.localeCompare(a.title)); break;
    default: break;
  }
  els.grid.innerHTML = list.map(p => productCard(p)).join('');
  updateCartUI();
}

function productCard(p){
  const onSale = p.compareAt && p.compareAt > p.price;
  const save = onSale ? Math.round((1 - p.price/p.compareAt)*100) : 0;
  return `
    <article class="card" data-id="${p.id}">
      <div class="thumb"><img src="${p.image}" alt="${p.title}"></div>
      <div class="meta">
        <h3>${p.title}</h3>
        <p class="muted">${p.tagline||''}</p>
        <div class="price-row">
          <div class="price">${fmt(p.price)}</div>
          <div class="muted">${onSale? `<span style="text-decoration:line-through">${fmt(p.compareAt)}</span> <span style="color:#22c55e; font-weight:700">Save ${save}%</span>` : ''}</div>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn primary" onclick="viewProduct(${p.id})">View</button>
        <button class="btn ghost" onclick="quickAdd(${p.id})">Add</button>
      </div>
    </article>
  `;
}

// product modal & quick add
let currentProduct = null;
function viewProduct(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  currentProduct = p;
  els.modalImg.src = p.image;
  els.modalTitle.textContent = p.title;
  els.modalTag.textContent = p.tagline||'';
  els.modalPrice.textContent = fmt(p.price);
  els.modalCompare.textContent = p.compareAt? fmt(p.compareAt) : '';
  // sizes & colors
  els.sizeWrap.innerHTML = (p.sizes||[]).map(s=> `<button class="pill" data-val="${s}">${s}</button>`).join('');
  els.colorWrap.innerHTML = (p.colors||[]).map(c=> `<button class="pill" data-val="${c}">${c}</button>`).join('');
  // default selection
  const firstSize = (p.sizes && p.sizes[0]) || null;
  const firstColor = (p.colors && p.colors[0]) || null;
  [...els.sizeWrap.querySelectorAll('.pill')].forEach(btn=> btn.onclick = ()=> { [...els.sizeWrap.querySelectorAll('.pill')].forEach(b=>b.classList.remove('active')); btn.classList.add('active'); });
  [...els.colorWrap.querySelectorAll('.pill')].forEach(btn=> btn.onclick = ()=> { [...els.colorWrap.querySelectorAll('.pill')].forEach(b=>b.classList.remove('active')); btn.classList.add('active'); });
  // open modal
  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');
}

// quickAdd (adds default selection)
function quickAdd(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  const item = { id:p.id, title:p.title, price:p.price, qty:1 };
  const found = state.cart.find(i=> i.id===p.id);
  if(found) found.qty++;
  else state.cart.push(item);
  saveCart();
  renderProducts();
  flash(`${p.title} added to bag`);
}

// modal Add button
els.modalAdd.onclick = function(){
  if(!currentProduct) return;
  quickAdd(currentProduct.id);
  closeModal();
};

// close modal
function closeModal(){
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden','true');
}
els.closeModal.onclick = closeModal;
document.getElementById('modal').addEventListener('click', e => { if(e.target === document.getElementById('modal')) closeModal(); });

// Cart drawer open/close
els.openCart.onclick = ()=> { els.cartDrawer.classList.add('open'); els.cartDrawer.setAttribute('aria-hidden','false'); }
document.getElementById('closeCart').onclick = ()=> { els.cartDrawer.classList.remove('open'); els.cartDrawer.setAttribute('aria-hidden','true'); }

// cart UI
function updateCartUI(){
  els.cartCount.textContent = cartCount();
  els.cartList.innerHTML = state.cart.map(it => `
    <div class="cart-item">
      <img src="${(state.products.find(p=>p.id===it.id)||it).image}" alt="${it.title}">
      <div class="meta">
        <div style="font-weight:700">${it.title}</div>
        <div class="muted">${fmt(it.price)} × ${it.qty}</div>
      </div>
      <div class="qty">
        <button class="qty-btn" onclick="changeQty(${it.id}, -1)">–</button>
        <div style="width:28px; text-align:center">${it.qty}</div>
        <button class="qty-btn" onclick="changeQty(${it.id}, 1)">+</button>
        <button class="qty-btn" style="margin-left:8px; background:#ef4444; color:#fff" onclick="removeFromCart(${it.id})">✕</button>
      </div>
    </div>
  `).join('');
  els.subtotal.textContent = fmt(subtotalVal());
}

function changeQty(id, delta){
  const it = state.cart.find(i=> i.id===id);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0) removeFromCart(id);
  else { saveCart(); updateCartUI(); }
}
function removeFromCart(id){
  state.cart = state.cart.filter(i=> i.id !== id);
  saveCart(); updateCartUI();
}

// checkout demo
document.getElementById('checkout').onclick = async function(){
  // this demo tries to POST to /api/cart if available, otherwise just clears cart locally.
  try{
    const resp = await fetch('/api/cart', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cart: state.cart })});
    if(resp.ok){
      const data = await resp.json();
      flash('Order submitted (demo). Saved to server.');
      state.cart = [];
      saveCart();
      updateCartUI();
      els.cartDrawer.classList.remove('open');
      return;
    }
  }catch(e){}
  // fallback
  flash('Checkout demo — cart cleared locally.');
  state.cart = []; saveCart(); updateCartUI(); els.cartDrawer.classList.remove('open');
};

// Contact form
els.contactForm.addEventListener('submit', async function(e){
  e.preventDefault();
  const name = document.getElementById('cname').value.trim();
  const email = document.getElementById('cemail').value.trim();
  const message = document.getElementById('cmessage').value.trim();
  if(!name || !email || !message){ els.contactStatus.textContent = 'Please fill all fields.'; return; }
  els.contactStatus.textContent = 'Sending…';
  try{
    const res = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, message })});
    if(res.ok){ els.contactStatus.textContent = 'Message sent. Thank you!'; document.getElementById('cname').value=''; document.getElementById('cemail').value=''; document.getElementById('cmessage').value=''; return; }
  }catch(e){}
  // fallback: save to localStorage
  const drafts = JSON.parse(localStorage.getItem('contact_drafts')||'[]');
  drafts.push({ name, email, message, date: new Date().toISOString()});
  localStorage.setItem('contact_drafts', JSON.stringify(drafts));
  els.contactStatus.textContent = 'Saved locally (no backend).';
});

// helper flash
function flash(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position='fixed'; el.style.right='20px'; el.style.bottom='20px'; el.style.background='rgba(2,6,23,0.9)'; el.style.color='#fff'; el.style.padding='10px 14px'; el.style.borderRadius='8px'; el.style.zIndex=9999;
  document.body.appendChild(el);
  setTimeout(()=> el.style.opacity='0', 1500);
  setTimeout(()=> el.remove(), 2200);
}

// search & sort bindings
els.search.addEventListener('input', e=> { state.q = e.target.value; renderProducts(); });
els.sort.addEventListener('change', e=> { state.sort = e.target.value; renderProducts(); });

// header nav smooth scroll & single-page like behaviour
document.querySelectorAll('.main-nav a').forEach(a=>{
  a.addEventListener('click', (ev)=>{
    ev.preventDefault();
    const target = a.getAttribute('data-target');
    if(target){
      const sec = document.getElementById(target);
      if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});
document.getElementById('heroShop').onclick = ()=> { document.getElementById('store').scrollIntoView({behavior:'smooth'}); }

// init
state.products = localProducts;
renderProducts();

updateCartUI();

/* main.js - full client-side functionality (no server)
   - Cart (localStorage)
   - Product view, filter, search
   - Carousel (pure JS)
   - Login / Signup demo (localStorage)
   - Payment (demo clears cart)
*/
(function(){'use strict';
  const CART_KEY = 'cartItems';
  const USERS_KEY = 'users';
  const SELECTED_PRODUCT = 'selectedProduct';

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    setYear();
    bindHeader();
    updateCartCount();
    initCarousel();

    document.querySelectorAll('.add-to-cart').forEach(b=>b.addEventListener('click', onAddToCart));
    document.querySelectorAll('.view-product').forEach(b=>b.addEventListener('click', onViewProduct));
    const grid = document.getElementById('product-grid');
    if(grid) grid.addEventListener('click', onProductGridClick);

    const filter = document.getElementById('filter-select'); 
    if(filter) filter.addEventListener('change', onFilterChange);
    const searchBtn = document.getElementById('search-btn'); 
    if(searchBtn) searchBtn.addEventListener('click', onSearch);
    const searchInput = document.getElementById('search-input'); 
    if(searchInput) searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter') onSearch(); });

    if(location.pathname.endsWith('/pages/cart.html') || document.body.classList.contains('cart-page')) renderCartPage();
    if(location.pathname.endsWith('/pages/product.html') || document.body.classList.contains('product-page')) renderProductPage();
    if(location.pathname.endsWith('/pages/login.html') || document.body.classList.contains('login-page')) setupLogin();
    if(location.pathname.endsWith('/pages/signup.html') || document.body.classList.contains('signup-page')) setupSignup();
    if(location.pathname.endsWith('/pages/payment.html') || document.body.classList.contains('payment-page')) setupPayment();
  }

  function setYear(){ 
    const el=document.getElementById('year');
     if(el) el.textContent=new Date().getFullYear(); 
    }

  function bindHeader(){
    const cartLink = document.querySelector('.cart-link'); 
    if(cartLink) cartLink.addEventListener('click', e=>{ e.preventDefault(); window.location.href='pages/cart.html'; 
    });
  }

  /* CART helpers */
  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){return [];} }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
  function updateCartCount(){ const el=document.getElementById('cart-count'); if(!el) return; const cart=getCart(); const total=cart.reduce((s,i)=>s+(i.quantity||1),0); el.textContent=total; }

  function addToCart(product, qty=1){ const cart=getCart(); const found=cart.find(i=>i.id===product.id); if(found){ found.quantity=(found.quantity||1)+qty; } else { cart.push(Object.assign({},product,{quantity:qty})); } saveCart(cart); }

  /* Product handlers */
  function onAddToCart(e){ 
  e.stopPropagation();
  const card = e.target.closest('.product-card'); 
  if(!card) return; const p=fromCard(card); 
  addToCart(p,1); 
  window.location.href='pages/cart.html'; 
}
  function onViewProduct(e){
     e.stopPropagation(); const card = e.target.closest('.product-card'); if(!card) return; 
     saveSelectedProduct(fromCard(card)); 
     window.location.href='pages/product.html'; 
    }
  function onProductGridClick(e){ 
    const card = e.target.closest('.product-card'); 
    if(!card) return; const btn = e.target.closest('button'); 
    if(btn) return; saveSelectedProduct(fromCard(card)); 
    window.location.href='pages/product.html';
   }
  function fromCard(card){ return { 
    id: card.getAttribute('data-id'), name: card.getAttribute('data-name'), desc: card.getAttribute('data-desc'), price: parseFloat(card.getAttribute('data-price')||'0'), img: card.getAttribute('data-img'), category: card.getAttribute('data-category')||'all' }; 
  }
  function saveSelectedProduct(p){
     localStorage.setItem(SELECTED_PRODUCT, JSON.stringify(p)); 
  }

  /* Filters / Search */
  function onFilterChange(e){ 
    const val=e.target.value; 
    document.querySelectorAll('.product-card').forEach(c=>{ const cat=c.getAttribute('data-category'); c.style.display = (val==='all'||cat===val)?'':'none'; });
  }
  function onSearch(){ 
    const q=(document.getElementById('search-input')?.value||'').toLowerCase().trim(); 
    document.querySelectorAll('.product-card').forEach(c=>{ const name=(c.getAttribute('data-name')||'').toLowerCase(); 
    const desc=(c.getAttribute('data-desc')||'').toLowerCase(); 
    c.style.display=(name.includes(q)||desc.includes(q))?'':''; }); 
  }

  /* Render cart page */
  function renderCartPage(){ 
    const container=document.getElementById('cart-items'); 
    const totalEl=document.getElementById('total-amount'); 
    const checkoutBtn=document.getElementById('checkout-btn'); 
    if(!container) return; const cart=getCart(); container.innerHTML=''; 
    if(!cart.length){ container.innerHTML='<p class="muted">Your cart is empty.</p>'; 
    if(totalEl) totalEl.textContent='0.00'; 
    if(checkoutBtn) checkoutBtn.disabled=true; 
    updateCartCount(); return; 
  } 
  cart.forEach(item=>{ 
    const div=document.createElement('div'); 
    div.className='cart-item'; 
    div.innerHTML = `<img src="${fixPath(item.img)}" alt="${escapeHtml(item.name)}"><div style="flex:1"><h4>${escapeHtml(item.name)}</h4><p class="muted small">${escapeHtml(item.desc)}</p><p>Price: $${item.price.toFixed(2)}</p><div class="qty-controls"><button class="qty-btn decrease" data-id="${item.id}">−</button><span class="qty-value" data-id="${item.id}">${item.quantity}</span><button class="qty-btn increase" data-id="${item.id}">+</button><button class="link remove" data-id="${item.id}" style="margin-left:12px;">Remove</button></div></div>`; 
    container.appendChild(div); }); 
    const total = cart.reduce((s,i)=>s+(i.price*(i.quantity||1)),0); if(totalEl) totalEl.textContent = total.toFixed(2); 
    if(checkoutBtn) checkoutBtn.disabled=false; 
    container.querySelectorAll('.qty-btn.increase').forEach(b=>b.addEventListener('click',e=>{ updateQty(e.currentTarget.dataset.id,1);})); 
    container.querySelectorAll('.qty-btn.decrease').forEach(b=>b.addEventListener('click',e=>{ updateQty(e.currentTarget.dataset.id,-1);})); 
    container.querySelectorAll('.remove').forEach(b=>b.addEventListener('click',e=>{ removeItem(e.currentTarget.dataset.id); })); 
    updateCartCount(); }

  function updateQty(id,delta){ const cart=getCart(); 
  const idx=cart.findIndex(i=>i.id===id); 
  if(idx===-1) return; 
  cart[idx].quantity = Math.max(0,(cart[idx].quantity||1)+delta); 
  if(cart[idx].quantity===0) cart.splice(idx,1); 
  saveCart(cart); renderCartPage(); 
}
  function removeItem(id){
     const cart=getCart().filter(i=>i.id!==id); 
     saveCart(cart); renderCartPage(); 
    }

  /* Product page */
  function renderProductPage(){ 
    const raw=localStorage.getItem(SELECTED_PRODUCT); 
    const container=document.getElementById('product-details'); 
    if(!container) return; 
    if(!raw){ container.innerHTML='<p>Product not found.</p>'; 
    return; 
  } 
  const p=JSON.parse(raw); 
  container.innerHTML = `<div class="product-page"><div class="media"><img src="${fixPath(p.img)}" alt="${escapeHtml(p.name)}" style="width:100%;border-radius:8px"></div><div class="info"><h2>${escapeHtml(p.name)}</h2><p class="muted">${escapeHtml(p.desc)}</p><p style="margin:12px 0;"><strong>$${p.price.toFixed(2)}</strong></p><div class="form-actions"><button id="buy-now" class="btn primary">Add to cart & Checkout</button><button id="add-only" class="btn">Add to cart</button></div></div></div>`; document.getElementById('buy-now').addEventListener('click',()=>{ addToCart(p,1); window.location.href='cart.html'; }); 
  document.getElementById('add-only').addEventListener('click',()=>{ addToCart(p,1); alert('Added to cart'); updateCartCount(); }); 
}

  /* Login/signup/payment (demo) */
  function setupLogin(){ 
    const form=document.getElementById('login-form'); 
    if(!form) return; 
    form.addEventListener('submit',e=>{ e.preventDefault(); 
    const email=(form.email.value||'').toLowerCase().trim(); 
    const pass=(form.password.value||'').trim(); 
    if(!email||!pass){ alert('Enter details'); 
    return; 
  } 
  const users = JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); 
  const found=users.find(u=>u.email===email&&u.password===pass); 
  if(found){ localStorage.setItem('loggedInUser',email); 
    alert('Login successful'); 
    window.location.href='../index.html'; 
  } 
  else { 
    alert('Invalid credentials. Please sign up.'); } }); 
    const link=document.getElementById('switch-to-signup'); 
    if(link) link.addEventListener('click',e=>{ e.preventDefault(); 
      window.location.href='signup.html'; }); 
    }
  function setupSignup(){ 
    const form=document.getElementById('signup-form'); 
    if(!form) return; form.addEventListener('submit',e=>{ e.preventDefault(); 
      const email=(form.email.value||'').toLowerCase().trim(); 
      const pass=(form.password.value||'').trim(); 
      const cp=(form.confirmPassword.value||'').trim(); 
      if(!email||!pass||!cp){ alert('Fill all fields'); 
        return; 
      } 
      if(pass!==cp){ alert('Passwords do not match'); 
        return; 
      } 
      const users = JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); if(users.find(u=>u.email===email)){ alert('Email exists. Login.');
         return; 
        } 
        users.push({email,password:pass});
         localStorage.setItem(USERS_KEY,JSON.stringify(users)); 
         alert('Signup successful. Please login.'); 
         window.location.href='login.html'; }); 
         const link=document.getElementById('switch-to-login'); 
         if(link) link.addEventListener('click',e=>{ e.preventDefault(); 
          window.location.href='login.html'; }); 
        }
  function setupPayment(){ 
    const form=document.getElementById('payment-form'); 
    if(!form) return; 
    form.addEventListener('submit',e=>{ e.preventDefault(); 
      if(!form.cardName.value||!form.cardNumber.value||!form.expiry.value||!form.cvv.value){ alert('Fill payment details'); return; } alert('Payment success (demo). Thank you!'); 
      localStorage.removeItem(CART_KEY); updateCartCount(); window.location.href='../index.html'; }); 
    }

  /* Carousel */
  function initCarousel(){ 
    const carousel = document.getElementById('hero-carousel'); if(!carousel) return; 
    const track = carousel.querySelector('.carousel-track'); 
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide')); 
    const prev = carousel.querySelector('.carousel-prev'); 
    const next = carousel.querySelector('.carousel-next'); 
    const dotsWrap = carousel.querySelector('.carousel-dots'); 
    let index=0; function go(i){ index=(i+slides.length)%slides.length; 
      track.style.transform = 'translateX(' + (-index*100) + '%)'; 
      updateDots(); } function prevFn(){ go(index-1); } function nextFn(){ go(index+1); } function updateDots(){ dotsWrap.innerHTML=''; 
        slides.forEach((s,i)=>{ const btn=document.createElement('button'); 
          btn.className = (i===index)?'active':''; btn.addEventListener('click',()=>go(i)); 
          dotsWrap.appendChild(btn); }); } prev.addEventListener('click', prevFn); 
          next.addEventListener('click', nextFn); updateDots(); let autoplay = setInterval(()=>{ nextFn(); }, 3500); 
          carousel.addEventListener('mouseenter', ()=>clearInterval(autoplay)); 
          carousel.addEventListener('mouseleave', ()=>autoplay=setInterval(()=>nextFn(),3500)); 
        }

  /* Utilities */
  function fixPath(path){
     if(!path) return path; if(location.pathname.includes('/pages/') && !path.startsWith('../') && !path.startsWith('http')) return '../'+path;
      return path;
     }
  function escapeHtml(s){ 
    if(!s) return ''; 
    return String(s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); 
  }

})();
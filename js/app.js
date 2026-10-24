// ==========================================================================
// RUDRALIFE - OFFICIAL APPLICATION LOGIC & STORE CONTROLLER
// ==========================================================================

(function() {
  'use strict';

  // Global State
  const state = {
    currency: localStorage.getItem('rudra_currency') || 'INR',
    currencySymbols: {
      INR: '₹',
      USD: '$',
      GBP: '£'
    },
    currencyRates: {
      INR: 1,
      USD: 1 / 83,
      GBP: 1 / 105
    },
    cart: JSON.parse(localStorage.getItem('rudra_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('rudra_wishlist') || '[]'),
    currentFilter: 'all',
    currentSort: 'featured',
    displayedProductsCount: 16,
    activeSlide: 0,
    searchQuery: '',
    allProducts: window.RUDRALIFE_DATA ? window.RUDRALIFE_DATA.products : []
  };

  // DOM Elements Cache
  const DOM = {
    currencySelect: document.getElementById('currencySelect'),
    currencyNotice: document.getElementById('currencyNotice'),
    cartBtn: document.getElementById('cartBtn'),
    cartDrawer: document.getElementById('cartDrawer'),
    cartOverlay: document.getElementById('cartOverlay'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartBadge: document.getElementById('cartBadge'),
    cartBody: document.getElementById('cartBody'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    
    wishlistBadge: document.getElementById('wishlistBadge'),
    
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    searchForm: document.getElementById('searchForm'),
    
    heroSlides: document.querySelectorAll('.hero-slide'),
    heroDots: document.getElementById('heroDots'),
    prevSlideBtn: document.getElementById('prevSlide'),
    nextSlideBtn: document.getElementById('nextSlide'),
    
    productsGrid: document.getElementById('productsGrid'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    sortSelect: document.getElementById('sortSelect'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    mobileNavToggle: document.getElementById('mobileNavToggle'),
    mobileDrawer: document.getElementById('mobileDrawer'),
    mobileDrawerOverlay: document.getElementById('mobileDrawerOverlay'),
    closeMobileNavBtn: document.getElementById('closeMobileNavBtn'),
    
    quickViewModal: document.getElementById('quickViewModal'),
    closeQuickViewBtn: document.getElementById('closeQuickViewBtn'),
    qvImage: document.getElementById('qvImage'),
    qvTitle: document.getElementById('qvTitle'),
    qvPrice: document.getElementById('qvPrice'),
    qvDesc: document.getElementById('qvDesc'),
    qvBenefits: document.getElementById('qvBenefits'),
    qvRules: document.getElementById('qvRules'),
    qvAddToCartBtn: document.getElementById('qvAddToCartBtn'),
    
    consultModal: document.getElementById('consultModal'),
    openConsultBtns: document.querySelectorAll('.open-consult-modal'),
    closeConsultBtn: document.getElementById('closeConsultBtn'),
    consultForm: document.getElementById('consultForm'),
    
    recForm: document.getElementById('recForm'),
    recResultCard: document.getElementById('recResultCard'),
    recResultImg: document.getElementById('recResultImg'),
    recResultTitle: document.getElementById('recResultTitle'),
    recResultText: document.getElementById('recResultText'),
    recResultBtn: document.getElementById('recResultBtn'),
    
    toastNotice: document.getElementById('toastNotice'),
    toastText: document.getElementById('toastText'),
    
    faqItems: document.querySelectorAll('.faq-item')
  };

  // Helper: Format Price
  function formatPrice(prices) {
    if (!prices) return `${state.currencySymbols[state.currency]}0`;
    let amount = prices[state.currency];
    if (amount === undefined || amount === null) {
      amount = Math.round(prices.INR * (state.currencyRates[state.currency] || 1));
    }
    return `${state.currencySymbols[state.currency]}${Number(amount).toLocaleString('en-IN')}`;
  }

  // Toast System
  function showToast(message, icon = 'fa-check') {
    if (!DOM.toastNotice) return;
    DOM.toastText.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    DOM.toastNotice.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      DOM.toastNotice.classList.remove('show');
    }, 3200);
  }

  // ==========================================================================
  // CURRENCY HANDLER
  // ==========================================================================
  function initCurrency() {
    if (!DOM.currencySelect) return;
    DOM.currencySelect.value = state.currency;
    DOM.currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      localStorage.setItem('rudra_currency', state.currency);
      updateAllPrices();
      renderCart();
      showToast(`Currency changed to ${state.currency} (${state.currencySymbols[state.currency]})`, 'fa-coins');
    });
  }

  function updateAllPrices() {
    renderProducts();
    if (DOM.currencyNotice) {
      DOM.currencyNotice.textContent = state.currency === 'USD' 
        ? 'All prices mentioned in dollars are in US dollar (USD)'
        : state.currency === 'GBP'
        ? 'All prices mentioned in pounds are in British Pound (GBP)'
        : 'All prices mentioned in rupees are in Indian Rupee (INR)';
    }
  }

  // ==========================================================================
  // HERO SLIDER
  // ==========================================================================
  function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;

    // Build Dots
    if (DOM.heroDots) {
      DOM.heroDots.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(idx));
        DOM.heroDots.appendChild(dot);
      });
    }

    function goToSlide(index) {
      slides[state.activeSlide].classList.remove('active');
      const dots = DOM.heroDots ? DOM.heroDots.querySelectorAll('.dot') : [];
      if (dots[state.activeSlide]) dots[state.activeSlide].classList.remove('active');

      state.activeSlide = (index + slides.length) % slides.length;

      slides[state.activeSlide].classList.add('active');
      if (dots[state.activeSlide]) dots[state.activeSlide].classList.add('active');
    }

    if (DOM.prevSlideBtn) {
      DOM.prevSlideBtn.addEventListener('click', () => goToSlide(state.activeSlide - 1));
    }
    if (DOM.nextSlideBtn) {
      DOM.nextSlideBtn.addEventListener('click', () => goToSlide(state.activeSlide + 1));
    }

    // Auto Play every 5.5s
    setInterval(() => {
      goToSlide(state.activeSlide + 1);
    }, 5500);
  }

  // ==========================================================================
  // DYNAMIC AUTO-SLIDING MID PROMO CAROUSEL
  // ==========================================================================
  function initMidPromoSlider() {
    const sliderContainer = document.getElementById('midPromoSlider');
    if (!sliderContainer) return;

    const slides = sliderContainer.querySelectorAll('.promo-slide');
    const dotsContainer = document.getElementById('promoSliderDots');
    const prevBtn = document.getElementById('prevPromoSlide');
    const nextBtn = document.getElementById('nextPromoSlide');

    if (!slides.length) return;

    let currentPromoSlide = 0;
    let promoTimer = null;
    const SLIDE_DURATION = 3800; // 3.8s auto sliding

    // Render Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `promo-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to promo slide ${idx + 1}`);
        dot.addEventListener('click', () => {
          goToPromoSlide(idx);
          resetTimer();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function goToPromoSlide(index) {
      slides[currentPromoSlide].classList.remove('active');
      const dots = dotsContainer ? dotsContainer.querySelectorAll('.promo-dot') : [];
      if (dots[currentPromoSlide]) dots[currentPromoSlide].classList.remove('active');

      currentPromoSlide = (index + slides.length) % slides.length;

      slides[currentPromoSlide].classList.add('active');
      if (dots[currentPromoSlide]) dots[currentPromoSlide].classList.add('active');
    }

    function nextSlide() {
      goToPromoSlide(currentPromoSlide + 1);
    }

    function prevSlide() {
      goToPromoSlide(currentPromoSlide - 1);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetTimer();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetTimer();
      });
    }

    function startTimer() {
      if (promoTimer) clearInterval(promoTimer);
      promoTimer = setInterval(nextSlide, SLIDE_DURATION);
    }

    function stopTimer() {
      if (promoTimer) clearInterval(promoTimer);
    }

    function resetTimer() {
      stopTimer();
      startTimer();
    }

    // Pause on hover
    sliderContainer.addEventListener('mouseenter', stopTimer);
    sliderContainer.addEventListener('mouseleave', startTimer);

    // Initial start
    startTimer();
  }

  // ==========================================================================
  // SEARCH AUTOCOMPLETE
  // ==========================================================================
  function initSearch() {
    if (!DOM.searchInput || !DOM.searchResults || !DOM.searchForm) return;

    DOM.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      state.searchQuery = q;
      if (!q) {
        DOM.searchResults.classList.remove('active');
        DOM.searchResults.innerHTML = '';
        return;
      }

      const matches = state.allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.categories.some(c => c.toLowerCase().includes(q))
      ).slice(0, 7);

      if (matches.length === 0) {
        DOM.searchResults.innerHTML = `
          <div style="padding: 18px; text-align: center; color: #888; font-size: 13px;">
            No products found matching "<strong>${escapeHtml(q)}</strong>"
          </div>`;
      } else {
        DOM.searchResults.innerHTML = matches.map(p => `
          <div class="search-item" data-id="${p.id}">
            <img src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.src='https://rudralife.com/favicon.png'">
            <div class="search-item-info">
              <div class="search-item-title">${escapeHtml(p.name)}</div>
              <div class="search-item-price">${formatPrice(p.prices)}</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="font-size: 11px; color: #bbb;"></i>
          </div>
        `).join('');

        DOM.searchResults.querySelectorAll('.search-item').forEach(el => {
          el.addEventListener('click', () => {
            const id = el.dataset.id;
            const prod = state.allProducts.find(p => p.id === id);
            if (prod) openQuickView(prod);
            DOM.searchResults.classList.remove('active');
          });
        });
      }
      DOM.searchResults.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!DOM.searchForm.contains(e.target)) {
        DOM.searchResults.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // PRODUCTS FILTERING & RENDERING
  // ==========================================================================
  function initFilters() {
    DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.filter;
        state.displayedProductsCount = 16;
        renderProducts();
      });
    });

    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        renderProducts();
      });
    }

    if (DOM.loadMoreBtn) {
      DOM.loadMoreBtn.addEventListener('click', () => {
        state.displayedProductsCount += 16;
        renderProducts();
      });
    }
  }

  function getFilteredProducts() {
    let prods = [...state.allProducts];

    // Filter
    if (state.currentFilter !== 'all') {
      const f = state.currentFilter.toLowerCase();
      if (f === 'combinations') {
        prods = prods.filter(p => p.type === 'combinations' || p.categories.some(c => c.toLowerCase().includes('combination') || c.toLowerCase().includes('kit')));
      } else if (f === 'kits') {
        prods = prods.filter(p => p.categories.some(c => c.toLowerCase().includes('kit')));
      } else if (f === 'rosaries') {
        prods = prods.filter(p => p.type === 'accessories' || p.categories.some(c => c.toLowerCase().includes('rosar') || c.toLowerCase().includes('mala')));
      } else if (f === 'bracelets') {
        prods = prods.filter(p => p.categories.some(c => c.toLowerCase().includes('bracelet') || p.name.toLowerCase().includes('bracelet')));
      } else if (f === 'collector') {
        prods = prods.filter(p => p.name.toLowerCase().includes('collector') || p.prices.INR > 15000);
      }
    }

    // Sort
    if (state.currentSort === 'price-low') {
      prods.sort((a, b) => (a.prices.INR || 0) - (b.prices.INR || 0));
    } else if (state.currentSort === 'price-high') {
      prods.sort((a, b) => (b.prices.INR || 0) - (a.prices.INR || 0));
    } else if (state.currentSort === 'rating') {
      prods.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }

    return prods;
  }

  function renderProducts() {
    if (!DOM.productsGrid) return;
    const filtered = getFilteredProducts();
    const visible = filtered.slice(0, state.displayedProductsCount);

    if (DOM.productsCountLabel) {
      DOM.productsCountLabel.textContent = `Showing 1–${visible.length} of ${filtered.length} sacred items`;
    }

    if (DOM.loadMoreBtn) {
      DOM.loadMoreBtn.style.display = visible.length >= filtered.length ? 'none' : 'inline-flex';
    }

    DOM.productsGrid.innerHTML = visible.map(p => {
      const isWishlisted = state.wishlist.includes(p.id);
      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-badge-wrap">
            <span class="prod-badge-luxury"><i class="fa-solid fa-certificate"></i> Certified Authentic</span>
          </div>

          <button class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}" title="Wishlist">
            <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
          </button>

          <div class="product-image-box" onclick="window.rudraApp.openQuickViewById('${p.id}')">
            <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='images/cat-malas.png'">
          </div>


          <h3 class="product-title" onclick="window.rudraApp.openQuickViewById('${p.id}')">${escapeHtml(p.name)}</h3>

          <div class="product-footer-row inquiry-row">
            <button class="btn-quick-view-text" onclick="window.rudraApp.openQuickViewById('${p.id}')" title="View Bead Details">
              <i class="fa-regular fa-eye"></i> Details
            </button>
            <a href="https://wa.me/917208819922?text=${encodeURIComponent('Namaste Gyan Mala Rudraksh, I am interested in ' + p.name + '. Please share price, certificate and details.')}" target="_blank" class="btn-inquire-whatsapp" title="Inquire on WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> Inquire
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Attach Wishlist events
    DOM.productsGrid.querySelectorAll('.product-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlist(btn.dataset.id);
      });
    });
  }

  function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fa-solid fa-star"></i>`;
    }
    return stars;
  }

  // ==========================================================================
  // SHOPPING CART SYSTEM
  // ==========================================================================
  function initCart() {
    if (DOM.cartBtn) DOM.cartBtn.addEventListener('click', openCart);
    if (DOM.closeCartBtn) DOM.closeCartBtn.addEventListener('click', closeCart);
    if (DOM.cartOverlay) DOM.cartOverlay.addEventListener('click', closeCart);
    if (DOM.checkoutBtn) {
      DOM.checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
          showToast('Your cart is empty! Please add items first.', 'fa-triangle-exclamation');
          return;
        }
        showToast('Initiating 100% Secure Checkout...', 'fa-lock');
        setTimeout(() => {
          alert(`Thank you for shopping at Rudralife!\n\nOrder total: ${calculateSubtotalFormatted()}\nItems: ${state.cart.length}\n\nOur Vedic team will prepare and energize your sacred items.`);
          state.cart = [];
          saveCart();
          renderCart();
          closeCart();
        }, 1000);
      });
    }
    renderCart();
  }

  function openCart() {
    if (DOM.cartDrawer) DOM.cartDrawer.classList.add('active');
    if (DOM.cartOverlay) DOM.cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('active');
    if (DOM.cartOverlay) DOM.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function addToCart(productId, qty = 1) {
    const prod = state.allProducts.find(p => p.id === productId);
    if (!prod) return;

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      state.cart.push({
        id: prod.id,
        name: prod.name,
        image: prod.image,
        prices: prod.prices,
        quantity: qty
      });
    }

    saveCart();
    renderCart();
    openCart();
    showToast(`Added "${prod.name}" to your cart!`, 'fa-cart-shopping');
  }

  function updateCartQty(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== productId);
    }
    saveCart();
    renderCart();
  }

  function removeCartItem(productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    saveCart();
    renderCart();
    showToast('Item removed from cart', 'fa-trash');
  }

  function saveCart() {
    localStorage.setItem('rudra_cart', JSON.stringify(state.cart));
  }

  function calculateSubtotal() {
    return state.cart.reduce((sum, item) => {
      let p = item.prices[state.currency];
      if (p === undefined) p = Math.round(item.prices.INR * (state.currencyRates[state.currency] || 1));
      return sum + (p * item.quantity);
    }, 0);
  }

  function calculateSubtotalFormatted() {
    return `${state.currencySymbols[state.currency]}${calculateSubtotal().toLocaleString('en-IN')}`;
  }

  function renderCart() {
    const totalCount = state.cart.reduce((c, i) => c + i.quantity, 0);
    if (DOM.cartBadge) DOM.cartBadge.textContent = totalCount;

    if (!DOM.cartBody) return;

    if (state.cart.length === 0) {
      DOM.cartBody.innerHTML = `
        <div class="cart-empty-state">
          <i class="fa-solid fa-basket-shopping"></i>
          <h4>Your Cart is Empty</h4>
          <p>Add authentic certified Rudraksha beads to your cart.</p>
        </div>
      `;
      if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = `${state.currencySymbols[state.currency]}0`;
      return;
    }

    DOM.cartBody.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.src='images/cat-malas.png'">
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">${formatPrice(item.prices)}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="window.rudraApp.updateCartQty('${item.id}', -1)">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="window.rudraApp.updateCartQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="window.rudraApp.removeCartItem('${item.id}')" title="Remove">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    if (DOM.cartSubtotal) {
      DOM.cartSubtotal.textContent = calculateSubtotalFormatted();
    }
  }

  // ==========================================================================
  // WISHLIST SYSTEM
  // ==========================================================================
  function toggleWishlist(productId) {
    const idx = state.wishlist.indexOf(productId);
    if (idx !== -1) {
      state.wishlist.splice(idx, 1);
      showToast('Removed from wishlist', 'fa-heart');
    } else {
      state.wishlist.push(productId);
      showToast('Saved to wishlist!', 'fa-heart');
    }
    localStorage.setItem('rudra_wishlist', JSON.stringify(state.wishlist));
    if (DOM.wishlistBadge) DOM.wishlistBadge.textContent = state.wishlist.length;
    renderProducts();
  }

  // ==========================================================================
  // QUICK VIEW MODAL
  // ==========================================================================
  let currentQvProduct = null;

  function initModals() {
    if (DOM.closeQuickViewBtn) {
      DOM.closeQuickViewBtn.addEventListener('click', closeQuickView);
    }
    if (DOM.quickViewModal) {
      DOM.quickViewModal.addEventListener('click', (e) => {
        if (e.target === DOM.quickViewModal) closeQuickView();
      });
    }

    if (DOM.qvAddToCartBtn) {
      DOM.qvAddToCartBtn.addEventListener('click', () => {
        if (currentQvProduct) {
          addToCart(currentQvProduct.id);
          closeQuickView();
        }
      });
    }

    // Consultation Modal
    DOM.openConsultBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.consultModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    if (DOM.closeConsultBtn) {
      DOM.closeConsultBtn.addEventListener('click', () => {
        DOM.consultModal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    if (DOM.consultModal) {
      DOM.consultModal.addEventListener('click', (e) => {
        if (e.target === DOM.consultModal) {
          DOM.consultModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }

    if (DOM.consultForm) {
      DOM.consultForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('consultName').value;
        showToast(`Consultation booked successfully for ${name}! Our expert will call you shortly.`, 'fa-circle-check');
        DOM.consultModal.classList.remove('active');
        document.body.style.overflow = '';
        DOM.consultForm.reset();
      });
    }
  }

  function openQuickView(prod) {
    currentQvProduct = prod;
    if (DOM.qvImage) DOM.qvImage.src = prod.image;
    if (DOM.qvTitle) DOM.qvTitle.textContent = prod.name;
    if (DOM.qvPrice) DOM.qvPrice.textContent = '';
    if (DOM.qvDesc) DOM.qvDesc.textContent = prod.description;
    if (DOM.qvBenefits) DOM.qvBenefits.textContent = prod.benefits;
    if (DOM.qvRules) DOM.qvRules.textContent = prod.wearingRules;

    const qvWhatsappBtn = document.getElementById('qvWhatsappBtn');
    if (qvWhatsappBtn) {
      const msg = encodeURIComponent(`Namaste Gyan Mala Rudraksh, I am interested in ${prod.name}. Please share price, certificate and details.`);
      qvWhatsappBtn.href = `https://wa.me/917208819922?text=${msg}`;
    }

    if (DOM.quickViewModal) {
      DOM.quickViewModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeQuickView() {
    DOM.quickViewModal.classList.remove('active');
    document.body.style.overflow = '';
    currentQvProduct = null;
  }

  // ==========================================================================
  // RUDRALIFE RECOMMENDATION ENGINE
  // ==========================================================================
  function initRecommendationEngine() {
    if (!DOM.recForm) return;

    DOM.recForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const goal = document.getElementById('recGoal').value;
      const rashi = document.getElementById('recRashi').value;

      // Smart Recommendation Matrix based on Vedic Astrology & Goals
      let recName = "Siddha Mala (1 to 14 Mukhi)";
      let recDesc = "Empowers all chakras and planets for complete success, mental peace and supreme protection.";

      if (goal === 'wealth') {
        recName = "7 Mukhi Mahalakshmi Rudraksha & Wealth Kit";
        recDesc = "Blessed by Goddess Mahalakshmi to attract prosperity, abundance, business growth and financial stability.";
      } else if (goal === 'health') {
        recName = "Swasthya Bandh (3 & 5 Mukhi Combination)";
        recDesc = "Enhances physical vitality, controls blood pressure, relieves stress and aligns your core aura energy.";
      } else if (goal === 'career') {
        recName = "Ganesh Saraswati Wisdom Kit";
        recDesc = "Removes obstacles, improves memory, sharpens intellect and brings outstanding career achievements.";
      } else if (goal === 'relationship') {
        recName = "Gaurishankar Rudraksha & Relationship Harmony Kit";
        recDesc = "Represents divine union of Shiva-Parvati, bringing love, mutual understanding and marital peace.";
      } else if (goal === 'meditation') {
        recName = "Dhyan Yog Mala (Indonesian 108 Beads)";
        recDesc = "Awakens intuition, calms restless thoughts and provides deep spiritual grounding for meditation.";
      } else if (goal === 'dosh') {
        recName = "Navratna Rudraksha Protection Kantha";
        recDesc = "Neutralizes malefic Rahu, Ketu, Shani Sade Sati and balances all nine planetary vibrations.";
      }

      // Find matching product
      let matchedProd = state.allProducts.find(p => p.name.toLowerCase().includes(recName.toLowerCase().split(' ')[0]));
      if (!matchedProd) matchedProd = state.allProducts[0];

      DOM.recResultImg.src = matchedProd.image;
      DOM.recResultTitle.textContent = `Recommended for ${rashi.toUpperCase()} • ${recName}`;
      DOM.recResultText.textContent = `${recDesc} Individually ACE Aura Certified & energised with Vedic Pran-Pratishtha.`;
      
      DOM.recResultBtn.onclick = () => {
        addToCart(matchedProd.id);
      };

      DOM.recResultCard.classList.add('active');
    });
  }

  // ==========================================================================
  // FAQ ACCORDION
  // ==========================================================================
  function initFAQ() {
    DOM.faqItems.forEach(item => {
      const q = item.querySelector('.faq-question');
      q.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        DOM.faqItems.forEach(i => {
          i.classList.remove('active');
          i.querySelector('.faq-answer').style.maxHeight = null;
        });
        if (!isActive) {
          item.classList.add('active');
          const ans = item.querySelector('.faq-answer');
          ans.style.maxHeight = ans.scrollHeight + "px";
        }
      });
    });
  }

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // MOBILE NAVIGATION DRAWER
  // ==========================================================================
  function initMobileNav() {
    if (DOM.mobileNavToggle) {
      DOM.mobileNavToggle.addEventListener('click', openMobileNav);
    }
    if (DOM.closeMobileNavBtn) {
      DOM.closeMobileNavBtn.addEventListener('click', closeMobileNav);
    }
    if (DOM.mobileDrawerOverlay) {
      DOM.mobileDrawerOverlay.addEventListener('click', closeMobileNav);
    }
  }

  function openMobileNav() {
    if (DOM.mobileDrawer) DOM.mobileDrawer.classList.add('active');
    if (DOM.mobileDrawerOverlay) DOM.mobileDrawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (DOM.mobileDrawer) DOM.mobileDrawer.classList.remove('active');
    if (DOM.mobileDrawerOverlay) DOM.mobileDrawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Public API
  window.rudraApp = {
    addToCart,
    updateCartQty,
    removeCartItem,
    closeMobileNav,
    openQuickViewById: (id) => {
      const p = state.allProducts.find(item => item.id === id);
      if (p) openQuickView(p);
    },
    filterCategory: (catName) => {
      state.currentFilter = 'all';
      DOM.filterBtns.forEach(b => b.classList.remove('active'));
      const masterList = window.RUDRALIFE_DATA ? window.RUDRALIFE_DATA.products : [];
      const prods = masterList.filter(p => p.categories && p.categories.some(c => c.toLowerCase().includes(catName.toLowerCase())));
      if (prods.length > 0) {
        state.allProducts = prods;
      } else {
        state.allProducts = masterList;
      }
      renderProducts();
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Header Navigation Active State
  function initHeaderNav() {
    const navLinks = document.querySelectorAll('.site-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initCurrency();
    initHeroSlider();
    initMidPromoSlider();
    initSearch();
    initFilters();
    initCart();
    initModals();
    initMobileNav();
    initHeaderNav();
    initRecommendationEngine();
    initFAQ();
    renderProducts();

    if (DOM.wishlistBadge) DOM.wishlistBadge.textContent = state.wishlist.length;
  });

})();

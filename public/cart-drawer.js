(function () {
  // Empêche l'initialisation multiple
  if (window.__CART_DRAWER_LOADED__) return;
  window.__CART_DRAWER_LOADED__ = true;

  const POLL_INTERVAL = 200;
  const MAX_ATTEMPTS  = 50;
  let attempts        = 0;

  /*********************************************
    1) Configuration
  *********************************************/
  const FREE_SHIPPING_THRESHOLD = 7000; // 70€ en centimes
  const DISCOUNT_CODES = {
    'EXODE10': 0.10,
    'EXODE20': 0.20
  };

  // Sélecteurs potentiels pour repérer l'ancien icône panier
  const ICON_CONTAINER_SELECTORS = [
    'a[href="/cart"].relative.tap-area',
    '.header__icon-list a[href*="/cart"]',
    'a[href*="/cart"].header__icon-wrapper',
    '.site-header__icon--cart',
    'a[href*="/cart"]',
    '.header__icon-wrapper.tap-area',
    '.cart-link',
    '.cart-icon-wrapper'
  ];

  // Sélecteurs potentiels pour mettre à jour l'icône du thème
  const THEME_CART_COUNT_SELECTORS = [
    '.cart-count',
    '.cart-count-bubble',
    '.header-cart-count',
    '.header__cart-count',
    '[data-cart-count]',
    'cart-count.header__cart-count',
    '#CartCount',
    '#HeaderCartCount',
    '.site-header__cart-count',
    '.icon-cart-count',
    '.cart-icon-count',
    '.cart-counter',
    '.shopping-cart-count'
  ];

  /*********************************************
    2) Fonction principale (polling)
  *********************************************/
  function initCartDrawer() {
    // Vérifier si le DOM est prêt
    if (!document.body || !document.head) {
      if (++attempts > MAX_ATTEMPTS) return;
      return setTimeout(initCartDrawer, POLL_INTERVAL);
    }

    console.log("🛒 Drawer script chargé via polling !");

    // 2.1 Masquer l'ancien mini-cart du thème
    hideNativeCart();

    // 2.2 Charger les styles du nouveau drawer
    loadCartDrawerStyles();

    // 2.3 Créer le drawer
    createCartDrawer();

    // 2.4 Remplacer l'icône panier par le nôtre
    replaceThemeCartIcon();

    // 2.5 Intercepter clics sur /cart ou /checkout pour ouvrir le drawer
    setupCartDrawerTriggers();

    // 2.6 Intercepter formulaires "Ajouter au panier"
    setupAddToCartHandler();

    // 2.7 Faire une première mise à jour du drawer
    updateCartDrawer();
  }

  /*********************************************
    3) Masquer l'ancien mini-cart du thème
  *********************************************/
  function hideNativeCart() {
    const style = document.createElement('style');
    style.innerHTML = `
      #mini-cart,
      .mini-cart,
      #cart-drawer,
      .cart-drawer,
      .drawer {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  /*********************************************
    4) Créer le drawer
  *********************************************/
  function createCartDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'universal-cart-drawer';
    drawer.innerHTML = `
      <div id="ucd-overlay"></div>
      <div id="ucd-content">
        <div id="ucd-header">
          <h3>Votre panier</h3>
          <button id="ucd-close">&times;</button>
        </div>

        <!-- Barre de progression -->
        <div id="ucd-shipping-bar"></div>

        <!-- Liste articles -->
        <div id="ucd-items">Chargement du panier...</div>

        <!-- Footer -->
        <div id="ucd-footer">
          <div id="ucd-subtotal"></div>
          <div id="ucd-discount-box"></div>
          <div id="ucd-total"></div>
          <div class="ucd-footer-buttons">
            <a href="/checkout" class="ucd-btn ucd-primary" id="ucd-checkout-btn">Passer la commande</a>
            <a href="/cart" class="ucd-btn">Voir le panier</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Boutons de fermeture
    document.getElementById('ucd-close').onclick = () => drawer.classList.remove('open');
    document.getElementById('ucd-overlay').onclick = () => drawer.classList.remove('open');
  }

  /*********************************************
    5) Remplacer l'icône panier du thème par le nôtre (sac)
  *********************************************/
  function replaceThemeCartIcon() {
    let container = null;
    for (const sel of ICON_CONTAINER_SELECTORS) {
      const found = document.querySelector(sel);
      if (found) {
        container = found;
        console.log(`Conteneur trouvé avec "${sel}"`);
        break;
      }
    }
    if (!container) {
      console.log("Aucun conteneur d'icône panier du thème trouvé. Aucun remplacement ne sera effectué.");
      return;
    }

    // On vide l'ancien container
    container.innerHTML = '';

    // Créer un wrapper pour l'icône
    const iconWrapper = document.createElement('div');
    iconWrapper.id = 'custom-cart-icon';
    iconWrapper.style.display = 'inline-flex';
    iconWrapper.style.alignItems = 'center';
    iconWrapper.style.gap = '6px';
    iconWrapper.style.overflow = 'visible';
    iconWrapper.style.cursor = 'pointer';

    // Code SVG (sac)
    const iconSVG = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6V7H5C4.44772 7 4 7.44772 4 8V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8C20 7.44772 19.5523 7 19 7H18V6C18 4.34315 16.6569 3 15 3H9C7.34315 3 6 4.34315 6 6ZM8 6C8 5.44772 8.44772 5 9 5H15C15.5523 5 16 5.44772 16 6V7H8V6ZM6 9H18V19H6V9Z" />
      </svg>
    `;

    // Span compteur
    const countSpan = document.createElement('span');
    countSpan.id = 'custom-cart-count';
    countSpan.textContent = '0';
    countSpan.style.background = '#000';
    countSpan.style.color = '#fff';
    countSpan.style.borderRadius = '50%';
    countSpan.style.padding = '2px 6px';
    countSpan.style.fontSize = '14px';
    countSpan.style.fontWeight = 'bold';
    countSpan.style.lineHeight = '1';
    countSpan.style.overflow = 'visible';

    iconWrapper.innerHTML = iconSVG;
    iconWrapper.appendChild(countSpan);

    container.appendChild(iconWrapper);

    // Clic → ouvre le drawer
    container.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openCartDrawer();
    });
  }

  /*********************************************
    6) Ouvrir le drawer et charger le contenu
  *********************************************/
  function openCartDrawer() {
    const drawer = document.getElementById('universal-cart-drawer');
    drawer.classList.add('open');
    updateCartDrawer();
  }

  /*********************************************
    7) Mettre à jour le contenu du drawer (AJAX)
  *********************************************/
  function updateCartDrawer() {
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        // Barre de progression livraison
        updateShippingBar(cart.total_price);

        // Si le panier est vide
        if (!cart.items || cart.items.length === 0) {
          document.getElementById('ucd-items').innerHTML = '<p>Panier vide.</p>';
          document.getElementById('ucd-subtotal').textContent = '';
          document.getElementById('ucd-discount-box').innerHTML = '';
          document.getElementById('ucd-total').innerHTML = '';
          updateThemeCartIconCount(0);
          updateCustomCartIconCount(0);
          return;
        }

        // Liste articles
        const itemsHTML = cart.items.map((item, idx) => buildCartItemHTML(item, idx+1)).join('');
        document.getElementById('ucd-items').innerHTML = itemsHTML;

        // Sous-total
        document.getElementById('ucd-subtotal').innerHTML = `<strong>Sous-total :</strong> ${formatMoney(cart.total_price)}`;

        // Attacher events (+/–/Supprimer)
        attachCartItemEvents();

        // Mettre à jour icônes
        updateThemeCartIconCount(cart.item_count);
        updateCustomCartIconCount(cart.item_count);

        // Code promo + total
        updateCartFooter(cart);
      })
      .catch(err => {
        console.error('Erreur updateCartDrawer:', err);
        document.getElementById('ucd-items').innerHTML = '<p>Impossible de charger le panier.</p>';
      });
  }

  /*********************************************
    8) Construire le HTML d'un article
  *********************************************/
  function buildCartItemHTML(item, lineIndex) {
    let itemTitle = item.product_title;
    if (item.variant_title && item.variant_title !== 'Default Title') {
      itemTitle += ` – ${item.variant_title}`;
    }
    const priceStr = formatMoney(item.price);
    return `
      <div class="ucd-item" data-line-index="${lineIndex}">
        <div class="ucd-item-content">
          <div class="ucd-item-image">
            <img src="${item.image}" alt="${itemTitle}" />
          </div>
          <div class="ucd-item-info">
            <p class="ucd-item-title">${itemTitle}</p>
            <p class="ucd-item-price">${item.quantity} × ${priceStr}</p>
            <div class="ucd-qty-wrapper">
              <button class="ucd-qty-minus">-</button>
              <input type="text" class="ucd-qty" value="${item.quantity}" />
              <button class="ucd-qty-plus">+</button>
            </div>
          </div>
        </div>
        <button class="ucd-remove-item">Supprimer</button>
      </div>
    `;
  }

  /*********************************************
    9) Gérer les boutons +/- et supprimer
  *********************************************/
  function attachCartItemEvents() {
    document.querySelectorAll('.ucd-qty-minus').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const parentItem = e.target.closest('.ucd-item');
        const lineIndex = parentItem.getAttribute('data-line-index');
        const qtyInput = parentItem.querySelector('.ucd-qty');
        let newQty = parseInt(qtyInput.value, 10) - 1;
        if (newQty < 0) newQty = 0;
        updateCartLine(lineIndex, newQty);
      });
    });
    document.querySelectorAll('.ucd-qty-plus').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const parentItem = e.target.closest('.ucd-item');
        const lineIndex = parentItem.getAttribute('data-line-index');
        const qtyInput = parentItem.querySelector('.ucd-qty');
        let newQty = parseInt(qtyInput.value, 10) + 1;
        updateCartLine(lineIndex, newQty);
      });
    });
    document.querySelectorAll('.ucd-remove-item').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const parentItem = e.target.closest('.ucd-item');
        const lineIndex = parentItem.getAttribute('data-line-index');
        updateCartLine(lineIndex, 0);
      });
    });
  }

  /*********************************************
    10) Mettre a jour la quantité d'une ligne
  *********************************************/
  function updateCartLine(lineIndex, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ line: lineIndex, quantity: quantity })
    })
    .then(r => r.json())
    .then(cart => {
      updateCartDrawer();
      updateThemeCartIconCount(cart.item_count);
      updateCustomCartIconCount(cart.item_count);
    })
    .catch(err => console.error('Erreur updateCartLine:', err));
  }

  /*********************************************
    11) Barre de progression pour la livraison offerte
  *********************************************/
  function updateShippingBar(totalPrice) {
    const barEl = document.getElementById('ucd-shipping-bar');
    if (!barEl) return;
    const missing = FREE_SHIPPING_THRESHOLD - totalPrice;
    if (missing <= 0) {
      barEl.innerHTML = `
        <div class="ucd-shipping-bar">
          <p class="ucd-shipping-text success">Livraison gratuite débloquée !</p>
          <div class="ucd-shipping-track">
            <div class="ucd-shipping-progress" style="width:100%"></div>
          </div>
        </div>
      `;
    } else {
      const ratio = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD)*100, 100);
      barEl.innerHTML = `
        <div class="ucd-shipping-bar">
          <p class="ucd-shipping-text">Encore ${formatMoney(missing)} pour la livraison offerte</p>
          <div class="ucd-shipping-track">
            <div class="ucd-shipping-progress" style="width:${ratio}%"></div>
          </div>
        </div>
      `;
    }
  }

  /*********************************************
    12) Footer : code promo + total final
  *********************************************/
  function updateCartFooter(cart) {
    const discountBox = document.getElementById('ucd-discount-box');
    const totalEl     = document.getElementById('ucd-total');
    const checkoutBtn = document.getElementById('ucd-checkout-btn');
    if (!discountBox || !totalEl || !checkoutBtn) return;

    const subTotal = cart.total_price;
    // Récup code promo en localStorage
    const storedCode = localStorage.getItem('myActiveDiscount');
    let discountRate = 0;
    if (storedCode && DISCOUNT_CODES[storedCode]) {
      discountRate = DISCOUNT_CODES[storedCode];
    }
    const discountAmount = Math.round(subTotal * discountRate);
    const finalTotal = subTotal - discountAmount;

    // Champ code
    discountBox.innerHTML = `
      <div class="ucd-discount-block">
        <input type="text" id="ucd-coupon-input" placeholder="Code promo" />
        <button id="ucd-coupon-apply">Appliquer</button>
      </div>
      <div id="ucd-coupon-badge" style="display:none;">
        <span id="ucd-coupon-code-text"></span>
        <button id="ucd-coupon-remove">×</button>
      </div>
    `;
    const badge = document.getElementById('ucd-coupon-badge');
    const codeTxt = document.getElementById('ucd-coupon-code-text');
    if (storedCode && DISCOUNT_CODES[storedCode]) {
      badge.style.display = 'inline-block';
      codeTxt.textContent = storedCode;
      checkoutBtn.href = `/checkout?discount=${encodeURIComponent(storedCode)}`;
    }

    // Remise + total
    let discountHtml = '';
    if (discountAmount > 0) {
      discountHtml = `<p style="margin:0; color:#d9534f;">Remise : -${formatMoney(discountAmount)}</p>`;
    }
    totalEl.innerHTML = `
      ${discountHtml}
      <p style="margin:0;">Total : <strong>${formatMoney(finalTotal)}</strong></p>
    `;

    // Events
    const applyBtn = document.getElementById('ucd-coupon-apply');
    const input    = document.getElementById('ucd-coupon-input');
    const removeBtn= document.getElementById('ucd-coupon-remove');

    applyBtn.addEventListener('click', () => {
      const code = input.value.trim().toUpperCase();
      if (DISCOUNT_CODES[code]) {
        localStorage.setItem('myActiveDiscount', code);
        updateCartDrawer();
      } else {
        alert('Code promo invalide');
      }
    });
    removeBtn.addEventListener('click', () => {
      localStorage.removeItem('myActiveDiscount');
      badge.style.display = 'none';
      checkoutBtn.href = '/checkout';
      updateCartDrawer();
    });
  }

  /*********************************************
    13) Intercepter les clics sur /cart ou /checkout
  *********************************************/
  function setupCartDrawerTriggers() {
    const triggers = document.querySelectorAll('a[href="/cart"], button[name="checkout"], a[href*="checkout"]');
    triggers.forEach(el => {
      el.addEventListener('click', e => {
        // Si on est déjà dans le drawer, ne rien faire
        if (el.closest('#universal-cart-drawer')) return;
        e.preventDefault();
        e.stopPropagation();
        openCartDrawer();
      }, true);
    });
  }

  /*********************************************
    14) Intercepter formulaires "Ajouter au panier"
  *********************************************/
  function setupAddToCartHandler() {
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    forms.forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        e.stopPropagation();
        const formData = new FormData(form);
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        })
        .then(r => r.json())
        .then(data => {
          openCartDrawer();
          if (typeof data.item_count !== 'undefined') {
            updateThemeCartIconCount(data.item_count);
            updateCustomCartIconCount(data.item_count);
          } else {
            fetch('/cart.js')
              .then(rr => rr.json())
              .then(c => {
                updateThemeCartIconCount(c.item_count);
                updateCustomCartIconCount(c.item_count);
              });
          }
        })
        .catch(err => console.error('Erreur lors de l\'ajout au panier :', err));
      }, true);
    });
  }

  /*********************************************
    15) Mettre à jour l'icône du thème
  *********************************************/
  function updateThemeCartIconCount(itemCount) {
    THEME_CART_COUNT_SELECTORS.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.textContent = itemCount;
      });
    });
  }

  /*********************************************
    16) Mettre à jour l'icône perso
  *********************************************/
  function updateCustomCartIconCount(itemCount) {
    const el = document.getElementById('custom-cart-count');
    if (el) el.textContent = itemCount;
  }

  /*********************************************
    17) Formater l'argent
  *********************************************/
  function formatMoney(cents) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(cents);
    } else {
      return (cents / 100).toFixed(2).replace('.', ',') + ' €';
    }
  }

  /*********************************************
    18) Charger les styles du drawer
  *********************************************/
  function loadCartDrawerStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* 
        1) Container global du drawer
           - Justify-content: flex-end pour coller le drawer à droite
           - Align-items: stretch pour que l'overlay et le drawer s'étendent sur toute la hauteur
           - pointer-events: none pour empêcher les clics quand il est fermé 
      */
      #universal-cart-drawer {
        font-family: sans-serif;
        position: fixed;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: flex;
        justify-content: flex-end;
        align-items: stretch;
        pointer-events: none;
      }
      #universal-cart-drawer.open {
        pointer-events: all; /* On réactive les clics quand c'est ouvert */
      }

      /*
        2) Overlay
           - Flex:1 pour occuper tout l'espace à gauche
           - pointer-events: all quand le drawer est ouvert, pour pouvoir le fermer au clic
      */
      #ucd-overlay {
        flex: 1;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.3s;
      }
      #universal-cart-drawer.open #ucd-overlay {
        pointer-events: all;
        cursor: pointer;
        opacity: 1;
      }

      /*
        3) Contenu du drawer
           - transform: translateX(100%) pour le cacher hors de l'écran (à droite)
           - pointer-events: auto pour permettre les clics à l'intérieur 
      */
      #ucd-content {
        width: 380px;
        max-width: 90%;
        background: #fff;
        padding: 20px;
        transform: translateX(100%);
        transition: transform 0.3s;
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: relative;
        pointer-events: auto; 
      }
      #universal-cart-drawer.open #ucd-content {
        transform: translateX(0);
      }

      /* Header */
      #ucd-header {
        display: flex; justify-content: space-between; align-items: center;
      }
      #ucd-header h3 {
        margin: 0; font-size: 1.4em;
      }
      #ucd-close {
        font-size: 24px; background: none; border: none; cursor: pointer;
      }

      /* Barre de progression */
      #ucd-shipping-bar {
        background:#f9f9f9; padding:10px; border-radius:6px;
      }
      .ucd-shipping-text {
        margin:0 0 6px; font-size:14px; text-align:center;
      }
      .ucd-shipping-text.success {
        color:#4caf50; font-weight:bold;
      }
      .ucd-shipping-track {
        background:#eee; border-radius:4px; height:8px; position:relative;
      }
      .ucd-shipping-progress {
        background:#70c15f; height:8px; border-radius:4px; transition:width 0.3s;
      }

      /* Liste articles */
      #ucd-items {
        flex:1; overflow:auto; margin-bottom:10px;
      }
      .ucd-item {
        border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px;
        display:flex; flex-direction:row; justify-content:space-between; align-items:center;
        background:#fff;
      }
      .ucd-item-content {
        display:flex; gap:12px; align-items:center;
      }
      .ucd-item-image img {
        width:64px; height:64px; object-fit:cover; border-radius:6px;
      }
      .ucd-item-info {
        display:flex; flex-direction:column; gap:2px;
      }
      .ucd-item-title {
        font-weight:bold; margin:0;
      }
      .ucd-item-price {
        color:#666; margin:0;
      }
      .ucd-qty-wrapper {
        margin-top:4px; display:flex; gap:4px; align-items:center;
      }
      .ucd-qty {
        width:40px; text-align:center;
      }
      .ucd-qty-minus, .ucd-qty-plus {
        width:28px; height:28px; border:1px solid #999; background:#f9f9f9;
        cursor:pointer; border-radius:4px; font-size:16px; line-height:1;
      }
      .ucd-remove-item {
        background:transparent; border:1px solid #999; padding:4px 8px; cursor:pointer; border-radius:4px; font-size:12px;
        color:#333;
      }

      /* Footer */
      #ucd-footer {
        background:#fafafa; border-top:1px solid #eee; padding:10px; border-radius:6px; display:flex; flex-direction:column; gap:8px;
      }
      #ucd-subtotal {
        font-size:14px; font-weight:normal;
      }
      #ucd-discount-box {
        display:flex; flex-direction:column; gap:6px;
      }
      .ucd-discount-block {
        display:flex; align-items:center; gap:6px;
      }
      .ucd-discount-block input {
        flex:1; padding:4px; border:1px solid #ccc; border-radius:4px;
      }
      .ucd-discount-block button {
        padding:4px 8px; background:#000; color:#fff; border:none; border-radius:4px; cursor:pointer;
      }
      #ucd-coupon-badge {
        margin-top:4px; background:#333; color:#fff; padding:2px 6px; border-radius:4px; position:relative; display:none;
      }
      #ucd-coupon-remove {
        position:absolute; top:50%; right:-10px; transform:translateY(-50%);
        background:#fff; color:#333; border:none; border-radius:50%;
        width:16px; height:16px; cursor:pointer; font-size:10px; text-align:center; line-height:16px;
        box-shadow:0 1px 2px rgba(0,0,0,0.2);
      }
      #ucd-total { font-size:14px; }
      .ucd-footer-buttons {
        display:flex; gap:8px; margin-top:4px;
      }
      .ucd-btn {
        flex:1; padding:10px; text-align:center; background:#eee; border-radius:6px; text-decoration:none; color:black; font-weight:bold;
      }
      .ucd-primary {
        background:#70c15f; color:white;
      }

      /* Icône perso dans le header */
      #custom-cart-icon {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        overflow: visible !important;
      }
      #custom-cart-icon svg {
        width: 24px !important;
        height: 24px !important;
        overflow: visible !important;
      }
      #custom-cart-count {
        display: inline-block !important;
        background: #000;
        color: #fff;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 14px;
        font-weight: bold;
        line-height: 1;
        overflow: visible;
        margin-left: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  // Lancer le polling
  initCartDrawer();
})();

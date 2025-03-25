(function () {
  if (window.__CART_DRAWER_LOADED__) return;
  window.__CART_DRAWER_LOADED__ = true;

  const POLL_INTERVAL = 200;
  const MAX_ATTEMPTS = 50;
  let attempts = 0;

  function initCartDrawer() {
    if (!document.body || !document.head) {
      if (++attempts > MAX_ATTEMPTS) return;
      return setTimeout(initCartDrawer, POLL_INTERVAL);
    }

    console.log("🛒 Drawer script chargé !");

    /*********************************************
      Masquer le drawer natif
    *********************************************/
    const s = document.createElement('style');
    s.innerHTML = `
      #mini-cart, .mini-cart, .cart-drawer, .drawer, #cart-drawer {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(s);

    /*********************************************
      Styles minimalistes du drawer
    *********************************************/
    const style = document.createElement("style");
    style.innerHTML = `
      #universal-cart-drawer {
        font-family: sans-serif;
        position: fixed;
        top: 0; right: 0; width: 100%; height: 100%;
        z-index: 9999;
        display: flex;
        pointer-events: none;
      }
      #ucd-overlay {
        flex: 1;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.3s;
      }
      #ucd-content {
        width: 360px;
        max-width: 90%;
        background: #fff;
        padding: 20px;
        transform: translateX(100%);
        transition: transform 0.3s;
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: relative;
      }
      #universal-cart-drawer.open {
        pointer-events: all;
      }
      #universal-cart-drawer.open #ucd-overlay {
        opacity: 1;
      }
      #universal-cart-drawer.open #ucd-content {
        transform: translateX(0);
      }
      #ucd-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #ucd-close {
        font-size: 24px;
        background: none;
        border: none;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    /*********************************************
      Structure HTML
    *********************************************/
    const drawer = document.createElement('div');
    drawer.id = 'universal-cart-drawer';
    drawer.innerHTML = `
      <div id="ucd-overlay"></div>
      <div id="ucd-content">
        <div id="ucd-header">
          <h3>Votre panier</h3>
          <button id="ucd-close">&times;</button>
        </div>
        <div id="ucd-items">Chargement...</div>
      </div>
    `;
    document.body.appendChild(drawer);

    /*********************************************
      Actions de fermeture
    *********************************************/
    document.getElementById('ucd-close').onclick = () => drawer.classList.remove('open');
    document.getElementById('ucd-overlay').onclick = () => drawer.classList.remove('open');

    /*********************************************
      Détection et remplacement de l'icône panier
    *********************************************/
    const possibleSelectors = [
      'a[href="/cart"]',
      '.cart-link',
      '.site-header__icon--cart',
      '.cart-icon-wrapper',
      'a[href*="/cart"].header__icon-wrapper',
    ];

    let trigger = null;
    for (const sel of possibleSelectors) {
      const found = document.querySelector(sel);
      if (found) {
        trigger = found;
        break;
      }
    }

    if (trigger) {
      const clone = trigger.cloneNode(true);
      trigger.replaceWith(clone); // évite les listeners Shopify existants

      clone.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openCartDrawer();
      });
    } else {
      console.warn("🛒 Aucun déclencheur de panier trouvé.");
    }
  }

  function openCartDrawer() {
    const drawer = document.getElementById('universal-cart-drawer');
    drawer.classList.add('open');
    fetch('/cart.js')
      .then(r => r.json())
      .then(data => {
        document.getElementById('ucd-items').innerHTML = data.items.length
          ? data.items.map(i => `<p>${i.quantity}× ${i.title}</p>`).join('')
          : '<p>Votre panier est vide</p>';
      })
      .catch(() => {
        document.getElementById('ucd-items').innerHTML = "<p>Erreur de chargement du panier</p>";
      });
  }

  initCartDrawer();
})();

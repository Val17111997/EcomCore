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
      Masquer l'ancien drawer natif le plus tôt possible
    *********************************************/
    const s = document.createElement('style');
    s.innerHTML = `#mini-cart, .mini-cart, .cart-drawer, .drawer, #cart-drawer { display: none !important; visibility: hidden !important; }`;
    document.head.appendChild(s);

    /*********************************************
      Styles du drawer personnalisé
    *********************************************/
    const style = document.createElement("style");
    style.innerHTML = `
      #universal-cart-drawer { font-family: sans-serif; position: fixed; top: 0; right: 0; width: 100%; height: 100%; z-index: 9999; display: flex; pointer-events: none; }
      #ucd-overlay { flex: 1; background: rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s; }
      #ucd-content { width: 380px; max-width: 90%; background: #fff; padding: 20px; transform: translateX(100%); transition: transform 0.3s; display: flex; flex-direction: column; gap: 16px; position: relative; }
      #universal-cart-drawer.open { pointer-events: all; }
      #universal-cart-drawer.open #ucd-overlay { opacity: 1; }
      #universal-cart-drawer.open #ucd-content { transform: translateX(0); }
      #ucd-header { display: flex; justify-content: space-between; align-items: center; }
      #ucd-header h3 { margin: 0; font-size: 1.4em; }
      #ucd-close { font-size: 24px; background: none; border: none; cursor: pointer; }
      #ucd-items { flex:1; overflow:auto; margin-bottom:10px; }
      .ucd-item { border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; background:#fff; }
    `;
    document.head.appendChild(style);

    /*********************************************
      Structure HTML du drawer
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
      Actions de fermeture du drawer
    *********************************************/
    document.getElementById('ucd-close').onclick = () => drawer.classList.remove('open');
    document.getElementById('ucd-overlay').onclick = () => drawer.classList.remove('open');

    /*********************************************
      Clics sur les icônes ou liens panier
    *********************************************/
    const triggers = document.querySelectorAll('a[href="/cart"], a[href*="checkout"], .cart-icon-wrapper, .site-header__icon--cart');
    triggers.forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        drawer.classList.add('open');
        fetch('/cart.js')
          .then(r => r.json())
          .then(data => {
            document.getElementById('ucd-items').innerHTML = data.items.length
              ? data.items.map(i => `<p>${i.quantity}× ${i.title}</p>`).join('')
              : '<p>Votre panier est vide</p>';
          });
      });
    });
  }

  initCartDrawer();
})();

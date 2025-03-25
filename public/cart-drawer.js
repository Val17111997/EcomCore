console.log("Drawer script chargé !");

function initDrawerWhenReady(retry = 0) {
  const cartIcon = document.querySelector('[href="/cart"]');
  const mainCart = document.querySelector('cart-drawer, .cart-drawer');

  if (cartIcon && mainCart) {
    console.log("Éléments trouvés, initialisation du drawer...");
    
    // Supprimer le drawer Shopify par défaut
    mainCart.remove();

    // Ajouter ton drawer custom (exemple simplifié)
    const newDrawer = document.createElement('div');
    newDrawer.id = 'custom-cart-drawer';
    newDrawer.innerHTML = '<p>Mon drawer est en ligne 🚀</p>';
    newDrawer.style.position = 'fixed';
    newDrawer.style.right = 0;
    newDrawer.style.top = 0;
    newDrawer.style.width = '300px';
    newDrawer.style.height = '100%';
    newDrawer.style.background = '#fff';
    newDrawer.style.zIndex = 9999;
    newDrawer.style.padding = '20px';
    document.body.appendChild(newDrawer);

    // Remplacer le clic
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      newDrawer.style.display = 'block';
    });
  } else {
    if (retry < 20) {
      console.log("Éléments non dispo, retry dans 300ms...");
      setTimeout(() => initDrawerWhenReady(retry + 1), 300);
    } else {
      console.warn("Drawer non initialisé après plusieurs tentatives.");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initDrawerWhenReady();
});

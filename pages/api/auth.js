// /pages/api/auth.js

export default function handler(req, res) {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send('Paramètre "shop" manquant');
  }

  const redirectUri = `${process.env.HOST}/api/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
}

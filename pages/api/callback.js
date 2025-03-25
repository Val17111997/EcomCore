// pages/api/callback.js

import crypto from 'crypto';
import querystring from 'querystring';

export default async function handler(req, res) {
  const { shop, hmac, code } = req.query;

  if (!shop || !hmac || !code) {
    return res.status(400).send('Paramètres manquants');
  }

  // Vérif HMAC
  const { hmac: _hmac, ...params } = req.query;
  const message = querystring.stringify(params);
  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  if (generatedHash !== hmac) {
    return res.status(403).send('Échec de vérification HMAC');
  }

  // Échange code contre access token
  const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
  const accessTokenPayload = {
    client_id: process.env.SHOPIFY_API_KEY,
    client_secret: process.env.SHOPIFY_API_SECRET,
    code,
  };

  const tokenResponse = await fetch(accessTokenRequestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accessTokenPayload),
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

 // Injection du ScriptTag
try {
  const scriptTagResponse = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      script_tag: {
        event: 'onload',
        src: 'https://ecom-core.vercel.app/cart-drawer.js',
      },
    }),
  });

  const result = await scriptTagResponse.json();
  console.log('ScriptTag ajouté :', result);
} catch (error) {
  console.error('Erreur ajout ScriptTag :', error);
}

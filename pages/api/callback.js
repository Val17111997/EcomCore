// /pages/api/callback.js

import crypto from 'crypto';
import querystring from 'querystring';

export default async function handler(req, res) {
  const { shop, hmac, code } = req.query;

  if (!shop || !hmac || !code) {
    return res.status(400).send('Paramètres manquants');
  }

  // Vérification de l'authenticité avec le HMAC
  const { hmac: _hmac, ...params } = req.query;
  const message = querystring.stringify(params);
  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  if (generatedHash !== hmac) {
    return res.status(403).send('Échec de vérification HMAC');
  }

  // Échange du code contre un access token
  const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
  const accessTokenPayload = {
    client_id: process.env.SHOPIFY_API_KEY,
    client_secret: process.env.SHOPIFY_API_SECRET,
    code,
  };

  try {
    const response = await fetch(accessTokenRequestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accessTokenPayload),
    });

    const data = await response.json();

    if (!data.access_token) {
      return res.status(401).send('Impossible de récupérer le token');
    }

    // ✅ Token récupéré avec succès !
    console.log('✅ Access token:', data.access_token);

    // À ce stade, tu peux :
    // - stocker le token
    // - appeler l’API Shopify pour injecter ton ScriptTag
    // - ou rediriger vers une page de succès

    return res.redirect(`/?installed=true&shop=${shop}`);
  } catch (error) {
    console.error('Erreur dans /api/callback:', error);
    return res.status(500).send('Erreur serveur');
  }
}

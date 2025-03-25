// pages/api/callback.js
import crypto from 'crypto';
import querystring from 'querystring';

export default async function handler(req, res) {
  const { shop, hmac, code, state } = req.query;

  if (!shop || !hmac || !code) {
    return res.status(400).send('Paramètres manquants');
  }

  const map = { ...req.query };
  delete map['hmac'];
  const message = querystring.stringify(map);
  const providedHmac = Buffer.from(hmac, 'utf-8');
  const generatedHash = Buffer.from(
    crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(message)
      .digest('hex'),
    'utf-8'
  );

  if (!crypto.timingSafeEqual(generatedHash, providedHmac)) {
    return res.status(400).send('HMAC non valide');
  }

  // Authentification réussie
  res.send('App installée avec succès !');
}

import shopify from '../../lib/shopify';

export default async function handler(req, res) {
  const session = await shopify.utils.loadCurrentSession(req, res);

  await shopify.api.rest.ScriptTag.create({
    session,
    body: {
      event: 'onload',
      src: 'https://ecom-core.vercel.app/cart-drawer.js',
    },
  });

  res.status(200).json({ success: true });
}

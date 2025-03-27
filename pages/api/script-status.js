import shopify from '../../lib/shopify';

export default async function handler(req, res) {
  const session = await shopify.utils.loadCurrentSession(req, res);
  const client = new shopify.api.rest.ScriptTag({ session });
  const response = await client.all();
  const exists = response.data.some(tag => tag.src.includes('cart-drawer.js'));
  res.status(200).json({ enabled: exists });
}

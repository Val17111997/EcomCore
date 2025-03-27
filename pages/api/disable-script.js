import shopify from '../../lib/shopify';

export default async function handler(req, res) {
  const session = await shopify.utils.loadCurrentSession(req, res);
  const client = new shopify.api.rest.ScriptTag({ session });
  const response = await client.all();

  const tag = response.data.find(tag => tag.src.includes('cart-drawer.js'));
  if (tag) {
    await client.delete(tag.id);
  }

  res.status(200).json({ success: true });
}

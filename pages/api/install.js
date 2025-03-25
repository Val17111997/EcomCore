export default async function handler(req, res) {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const scriptTag = {
    script_tag: {
      event: "onload",
      src: `https://${process.env.VERCEL_URL || 'ecom-core.vercel.app'}/cart-drawer.js`,
    },
  };

  try {
    const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify(scriptTag),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création du ScriptTag");
  }
}

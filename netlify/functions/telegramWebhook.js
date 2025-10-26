import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // replace in Netlify
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID; // replace in Netlify

const products = [
  { id: 1, name: "Men’s Classic T-Shirt", price: "450 ETB", image: "https://via.placeholder.com/300x200?text=T-Shirt" },
  { id: 2, name: "Ladies Dress", price: "750 ETB", image: "https://via.placeholder.com/300x200?text=Dress" },
  { id: 3, name: "Kids Shorts", price: "300 ETB", image: "https://via.placeholder.com/300x200?text=Shorts" },
];

export default async (req, res) => {
  try {
    const body = JSON.parse(req.body);
    console.log("Incoming Telegram update:", body);

    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;

      if (text === "/start") {
        await sendMessage(chatId, "👋 Welcome to Dilla Fashion Store!\nUse /products to see our catalog.");
      } else if (text === "/products") {
        for (const p of products) {
          await sendProduct(chatId, p);
        }
      } else {
        await sendMessage(chatId, "Please type /products to view our latest collection.");
      }
    } else if (body.callback_query) {
      const callback = body.callback_query;
      const data = callback.data;
      const chatId = callback.message.chat.id;

      if (data.startsWith("like_")) {
        const productId = data.split("_")[1];
        await sendMessage(chatId, `❤️ You liked product #${productId}.`);
      } else if (data.startsWith("order_")) {
        const productId = data.split("_")[1];
        const product = products.find(p => p.id == productId);
        await sendMessage(chatId, `✅ Order received for ${product.name}. We’ll contact you soon!`);
        await sendMessage(OWNER_CHAT_ID, `🛍️ New order!\nProduct: ${product.name}\nFrom: @${callback.from.username || callback.from.first_name}`);
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing webhook");
  }
};

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function sendProduct(chatId, product) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "❤️ Like", callback_data: `like_${product.id}` },
        { text: "🛒 Order", callback_data: `order_${product.id}` },
      ],
    ],
  };

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: product.image,
      caption: `${product.name}\nPrice: ${product.price}`,
      reply_markup: keyboard,
    }),
  });
}

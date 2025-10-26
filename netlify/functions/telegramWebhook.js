// netlify/functions/telegramWebhook.js
import fetch from "node-fetch";

export default async (req, res) => {
  try {
    // Safely handle body parsing
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body.message || body.channel_post || {};
    const chatId = message.chat?.id;
    const text = message.text?.trim();
    const callback = body.callback_query;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const OWNER_IDS = (process.env.OWNER_CHAT_IDS || "").split(",").map(x => x.trim());

    // Quick sanity check
    if (!BOT_TOKEN) {
      console.error("❌ Missing TELEGRAM_BOT_TOKEN in env");
      return res.status(500).send("Missing bot token");
    }

    // === Handle callback_query (likes or orders) ===
    if (callback) {
      const cbData = callback.data;
      const cbChat = callback.message.chat.id;
      const cbMsgId = callback.message.message_id;
      let replyText = "";

      if (cbData.startsWith("like_")) {
        replyText = "❤️ Thanks for liking!";
      } else if (cbData.startsWith("order_")) {
        replyText = "🛍 Please contact us on WhatsApp or Telegram to finalize your order.";
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: replyText,
          show_alert: false
        })
      });

      return res.status(200).send("Callback handled");
    }

    // === Normal commands ===
    if (text === "/start") {
      await sendText(chatId, BOT_TOKEN, "👗 Welcome to Dilla Fashion Store!\nUse /products to see our catalog.");
    } else if (text === "/products") {
      const products = [
        { id: 1, name: "Men T-Shirt", price: 450, desc: "Size M, Cotton, White", img: "https://via.placeholder.com/300x200?text=T-Shirt" },
        { id: 2, name: "Ladies Dress", price: 850, desc: "Size M, Silk, Red", img: "https://via.placeholder.com/300x200?text=Dress" },
        { id: 3, name: "Children Set", price: 500, desc: "Size S, Cotton, Blue", img: "https://via.placeholder.com/300x200?text=Child+Set" }
      ];

      for (const p of products) {
        await sendPhoto(chatId, BOT_TOKEN, p.img, `${p.name}\n${p.desc}\n💵 ${p.price} Birr`, [
          [
            { text: "❤️ Like", callback_data: `like_${p.id}` },
            { text: "🛒 Order", callback_data: `order_${p.id}` }
          ]
        ]);
      }
    } else if (text?.startsWith("/add") && OWNER_IDS.includes(String(chatId))) {
      // /add name|price|desc|imgURL
      const parts = text.replace("/add", "").split("|");
      if (parts.length < 4) {
        await sendText(chatId, BOT_TOKEN, "⚠️ Format: /add name|price|desc|imgURL");
      } else {
        const [name, price, desc, img] = parts.map(s => s.trim());
        await sendPhoto(chatId, BOT_TOKEN, img, `✅ Added: ${name}\n💵 ${price} Birr\n${desc}`, [
          [
            { text: "❤️ Like", callback_data: `like_new` },
            { text: "🛒 Order", callback_data: `order_new` }
          ]
        ]);
      }
    } else if (text?.startsWith("/edit") && OWNER_IDS.includes(String(chatId))) {
      await sendText(chatId, BOT_TOKEN, "📝 Edit feature coming soon!");
    } else if (text) {
      // Customer message → forward to admins
      for (const admin of OWNER_IDS) {
        await sendText(admin, BOT_TOKEN, `💬 Message from ${chatId}: ${text}`);
      }
    }

    // Always return OK to Telegram
    return res.status(200).send("OK");

  } catch (err) {
    console.error("❌ Telegram webhook error:", err);
    return res.status(200).send("Error handled gracefully");
  }
};

// --- helper functions ---
async function sendText(chatId, token, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function sendPhoto(chatId, token, photoUrl, caption, buttons) {
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      reply_markup: { inline_keyboard: buttons }
    })
  });
}

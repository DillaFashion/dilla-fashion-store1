// netlify/functions/telegramWebhook.js
import fetch from "node-fetch";

const TELEGRAM_TOKEN = "YOUR_BOT_TOKEN";  // Replace with your bot token
const API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const ADMIN_IDS = ["123456789", "987654321"]; // Replace with Telegram user IDs of you & co-admins

let products = [
  {
    id: 1,
    name: "Men’s Cotton Shirt",
    price: "850 ETB",
    size: "M, L, XL",
    fabric: "100% Cotton",
    color: "White",
  },
  {
    id: 2,
    name: "Ladies Dress",
    price: "1200 ETB",
    size: "S, M, L",
    fabric: "Silk",
    color: "Red",
  },
];

// Helper: send a message
async function sendMessage(chatId, text, options = {}) {
  await fetch(`${API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...options }),
  });
}

export async function handler(event) {
  try {
    const body = JSON.parse(event.body);
    const message = body.message;

    if (!message) return { statusCode: 200, body: "No message" };

    const chatId = message.chat.id;
    const text = message.text?.trim();

    // START COMMAND
    if (text === "/start") {
      await sendMessage(
        chatId,
        "👋 Welcome to Dilla Fashion!\n\nBrowse our catalog or message us your request.\n\nCommands:\n/products – View catalog\n/add – Admin add product\n/edit – Admin edit product"
      );
    }

    // PRODUCT LIST
    else if (text === "/products") {
      let msg = "🛍 *Available Products:*\n\n";
      products.forEach((p) => {
        msg += `*${p.name}*\n💰 ${p.price}\n📏 Size: ${p.size}\n🧵 Fabric: ${p.fabric}\n🎨 Color: ${p.color}\n\n`;
      });
      await sendMessage(chatId, msg, { parse_mode: "Markdown" });
    }

    // ADMIN ADD PRODUCT
    else if (text?.startsWith("/add")) {
      if (!ADMIN_IDS.includes(chatId.toString())) {
        await sendMessage(chatId, "🚫 You are not authorized.");
      } else {
        const parts = text.split("|").map((t) => t.trim());
        if (parts.length < 6) {
          await sendMessage(chatId, "Usage:\n/add | name | price | size | fabric | color");
        } else {
          const [, name, price, size, fabric, color] = parts;
          const newProduct = { id: Date.now(), name, price, size, fabric, color };
          products.push(newProduct);
          await sendMessage(chatId, `✅ Product *${name}* added!`, { parse_mode: "Markdown" });
        }
      }
    }

    // ADMIN EDIT PRODUCT
    else if (text?.startsWith("/edit")) {
      if (!ADMIN_IDS.includes(chatId.toString())) {
        await sendMessage(chatId, "🚫 You are not authorized.");
      } else {
        const parts = text.split("|").map((t) => t.trim());
        if (parts.length < 3) {
          await sendMessage(chatId, "Usage:\n/edit | id | new_price");
        } else {
          const [, id, newPrice] = parts;
          const product = products.find((p) => p.id.toString() === id);
          if (!product) {
            await sendMessage(chatId, "❌ Product not found!");
          } else {
            product.price = newPrice;
            await sendMessage(chatId, `✅ Price for *${product.name}* updated to ${newPrice}`, { parse_mode: "Markdown" });
          }
        }
      }
    }

    // CUSTOMER MESSAGES
    else {
      for (const adminId of ADMIN_IDS) {
        await sendMessage(adminId, `📩 New message from ${message.from.first_name}:\n${text}`);
      }
      await sendMessage(chatId, "✅ Message received! We’ll contact you soon.");
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error" };
  }
}

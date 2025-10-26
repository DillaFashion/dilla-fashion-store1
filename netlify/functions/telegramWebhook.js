import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_IDS = process.env.OWNER_CHAT_IDS.split(","); // comma-separated admin chat IDs
let products = []; // can store products in memory or DB

export default async (req, res) => {
  try {
    const body = JSON.parse(req.body);

    if(body.message){
      const chatId = body.message.chat.id;
      const text = body.message.text;
      const username = body.message.from.username || body.message.from.first_name;

      // Forward customer messages to all admins
      if(!text.startsWith("/")) {
        OWNER_CHAT_IDS.forEach(async id=>{
          await sendMessage(id, `💬 Message from @${username}: ${text}`);
        });
        return res.status(200).send("OK");
      }

      // Commands
      if(text.startsWith("/start")) {
        await sendMessage(chatId, "👋 Welcome! Use /products to see catalog. Admins can use /add or /edit.");
      }

      if(text.startsWith("/products")) {
        for(const p of products){
          await sendProduct(chatId, p);
        }
      }

      // Admin commands
      if(text.startsWith("/add") && OWNER_CHAT_IDS.includes(chatId.toString())){
        // Format: /add name|price|description|imageURL
        const args = text.replace("/add ","").split("|");
        if(args.length < 4) return sendMessage(chatId, "❌ Format: /add name|price|description|imageURL");
        const newId = products.length+1;
        const [name, price, description, image] = args;
        products.push({id:newId, name, price, description, image, likes:0, time:Date.now()});
        return sendMessage(chatId, `✅ Product added: ${name}`);
      }

      if(text.startsWith("/edit") && OWNER_CHAT_IDS.includes(chatId.toString())){
        // Format: /edit id|name|price|description|image
        const args = text.replace("/edit ","").split("|");
        if(args.length < 5) return sendMessage(chatId, "❌ Format: /edit id|name|price|description|imageURL");
        const [id,name,price,description

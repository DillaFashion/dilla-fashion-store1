const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_IDS = process.env.OWNER_CHAT_IDS ? process.env.OWNER_CHAT_IDS.split(',') : [];

const DB_FILE = path.join(__dirname,'telegramProductDB.json');

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2));
}

exports.handler = async function(event, context) {
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e){}

  // Handle like from website
  if(body.action==='like' && body.productId){
    const db = readDB();
    const product = db.find(p=>p.id===body.productId);
    if(product){
      product.likes += 1;
      writeDB(db);
    }
    return {statusCode:200, body:'ok'};
  }

  // Telegram updates
  const message = body.message;
  if(!message) return {statusCode:200, body:'ok'};

  const chatId = message.chat.id;
  const text = message.text || '';

  // /start command
  if(text.startsWith('/start')){
    await sendMessage(chatId,"Welcome to Dilla Fashion Store!\nUse /products to see products.\nAdmins can use /add Name,Price,Description");
    return {statusCode:200, body:'ok'};
  }

  // /products command
  if(text.startsWith('/products')){
    const products = readDB();
    let msg = "Products:\n";
    products.forEach(p=>{
      msg += `${p.id}. ${p.name} - ${p.price} ETB - Likes ❤️${p.likes}\n`;
    });
    msg += "\nClick product on website for details!";
    await sendMessage(chatId,msg);
    return {statusCode:200, body:'ok'};
  }

  // /add for admins
  if(text.startsWith('/add')){
    if(!OWNER_IDS.includes(chatId.toString())){
      await sendMessage(chatId,"You are not an admin.");
      return {statusCode:200, body:'ok'};
    }
    const args = text.replace('/add ','').split(',');
    if(args.length<3){
      await sendMessage(chatId,"Use: /add Name,Price,Description");
      return {statusCode:200, body:'ok'};
    }
    const db = readDB();
    const newProduct = {
      id: db.length ? db[db.length-1].id+1 : 1,
      name: args[0].trim(),
      price: parseInt(args[1]),
      description: args[2].trim(),
      likes:0
    };
    db.push(newProduct);
    writeDB(db);
    await sendMessage(chatId,`Product added: ${args[0]}`);
    return {statusCode:200, body:'ok'};
  }

  // /message forwarding
  if(text.startsWith('/msg')){
    const db = readDB();
    const msg = text.replace('/msg ','');
    for(const id of OWNER_IDS){
      await sendMessage(id,msg);
    }
    return {statusCode:200, body:'ok'};
  }

  await sendMessage(chatId,"Unknown command. Use /start or /products");
  return {statusCode:200, body:'ok'};
};

async function sendMessage(chatId,text){
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({chat_id:chatId,text})
  });
}

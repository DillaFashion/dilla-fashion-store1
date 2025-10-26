import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_IDS = process.env.OWNER_CHAT_IDS.split(",");

let products = [];

async function sendMessage(chatId, text, replyMarkup=null){
  const body={chat_id:chatId,text};
  if(replyMarkup) body.reply_markup=replyMarkup;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
    method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
  });
}

async function sendProduct(chatId, product){
  const keyboard={inline_keyboard:[[ {text:"❤️ Like",callback_data:`like_${product.id}`},{text:"🛒 Order",callback_data:`order_${product.id}`} ]]};
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({chat_id:chatId,photo:product.image,caption:`${product.name}\nPrice: ${product.price} ETB\n${product.description}`,reply_markup:keyboard})
  });
}

export default async (req,res)=>{
  try{
    const body=JSON.parse(req.body);
    if(body.message){
      const chatId=body.message.chat.id;
      const text=body.message.text;
      const username=body.message.from.username || body.message.from.first_name;

      if(text && !text.startsWith("/")){
        OWNER_CHAT_IDS.forEach(async id=>{
          await sendMessage(id,`💬 Message from @${username}: ${text}`);
        });
        return res.status(200).send("OK");
      }

      if(text=="/start") await sendMessage(chatId,"👋 Welcome! Use /products to see catalog.");
      if(text=="/products") for(const p of products) await sendProduct(chatId,p);

      if(text.startsWith("/add") && OWNER_CHAT_IDS.includes(chatId.toString())){
        const args=text.replace("/add ","").split("|");
        if(args.length<4) return sendMessage(chatId,"❌ Format: /add name|price|description|imageURL");
        const [name,price,description,image]=args;
        const newId=products.length+1;
        products.push({id:newId,name,price,description,image,likes:0,time:Date.now()});
        await sendMessage(chatId,`✅ Product added: ${name}`);
        if(OWNER_CHAT_IDS[0].startsWith("-100")) await sendProduct(OWNER_CHAT_IDS[0],products[products.length-1]);
      }

      if(text.startsWith("/edit") && OWNER_CHAT_IDS.includes(chatId.toString())){
        const args=text.replace("/edit ","").split("|");
        if(args.length<5) return sendMessage(chatId,"❌ Format: /edit id|name|price|description|imageURL");
        const [id,name,price,description,image]=args;
        const product=products.find(p=>p.id==id);
        if(!product) return sendMessage(chatId,"❌ Product not found");
        product.name=name; product.price=price; product.description=description; product.image=image;
        await sendMessage(chatId,`✅ Product #${id} updated`);
      }
    }

    else if(body.callback_query){
      const callback=body.callback_query;
      const data=callback.data

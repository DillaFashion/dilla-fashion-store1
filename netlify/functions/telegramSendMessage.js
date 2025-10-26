import fetch from "node-fetch";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_IDS = process.env.OWNER_CHAT_IDS.split(",");

export default async (req,res)=>{
  try{
    const {action,productId}=JSON.parse(req.body);
    if(action==="like"){
      OWNER_CHAT_IDS.forEach(async id=>{
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({chat_id:id,text:`❤️ Product ID ${productId} received a new like from web`})
        });
      });
    }
    res.status(200).send("OK");
  }catch(err){
    console.error(err);
    res.status(500).send("Error sending message");
  }
};

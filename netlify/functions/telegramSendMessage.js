import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_IDS = process.env.OWNER_CHAT_IDS.split(",");

export default async (req,res)=>{
  try{
    const { action, productId } = JSON.parse(req.body);
    if(action==="like"){
      // Forward like info to admins
      OWNER_CHAT_IDS.forEach(async id=>{
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{
          method:"POST", headers:{"Content-Type":"application/json"},
          body

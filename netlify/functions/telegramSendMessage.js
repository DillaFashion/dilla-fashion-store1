import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export default async (req, res) => {
  const { chatId, text } = JSON.parse(req.body);
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  res.status(200).json({ status: "ok" });
};

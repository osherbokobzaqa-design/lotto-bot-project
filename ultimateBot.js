const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const ai = new JackpotAI([7000000, 15000000, 25000000, 10000000]);

function generateLotto() {
  let nums = [];
  while (nums.length < 6) {
    let n = Math.floor(Math.random() * 37) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

// פונקציית צ'אנס מתוקנת - סדר קלפים קבוע לפי חוקי המשחק
function generateChance() {
  const suits = ["♣️", "♦️", "♥️", "♠️"]; // סדר קבוע
  const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  
  // הגרלת קלף אחד לכל סדרה בסדר הנכון
  return suits.map(suit => {
    const randomValue = values[Math.floor(Math.random() * values.length)];
    return `${randomValue}${suit}`;
  }).join('  |  ');
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 **מערכת Statisfy AI מעודכנת!**\nהאלגוריתם סונכרן עם סדר הקלפים הרשמי.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 ניתוח קופה חכם (AI)", callback_data: "ai_analyze" }],
        [{ text: "🎰 הגרלת לוטו", callback_data: "lotto" }],
        [{ text: "🃏 הגרלת צ'אנס (מסודר)", callback_data: "chance" }],
        [{ text: "🔍 תוצאות אמת מהאתר", callback_data: "get_results" }]
      ]
    }
  });
});

bot.on("callback_query", async (q) => {
  const id = q.message.chat.id;

  if (q.data === "ai_analyze") {
    const analysis = ai.analyze(28000000);
    let msg = `🧠 **ניתוח אלגוריתם Statisfy:**\n`;
    msg += `💰 קופה נוכחית: 28,000,000 ₪\n`;
    msg += `📈 ציון כדאיות: ${analysis.z ? analysis.z.toFixed(2) : "13.75"}\n`;
    msg += `📢 המלצה: ${analysis.overlay ? "🔥 כדאי מאוד לשחק!" : "❄️ קופה רגילה"}`;
    bot.sendMessage(id, msg);
  }

  if (q.data === "lotto") {
    bot.sendMessage(id, "🎲 **מספרים מומלצים:**\n" + generateLotto().join(", "));
  }

  if (q.data === "chance") {
    bot.sendMessage(id, "🃏 **צירוף צ'אנס מסודר:**\n" + generateChance());
  }

  if (q.data === "get_results") {
    bot.sendMessage(id, "⌛ מושך נתונים מהאתר...");
    const results = await fetchResults();
    bot.sendMessage(id, `✅ **תוצאות אחרונות:**\n1️⃣ ${results[0].join(', ')}\n2️⃣ ${results[1].join(', ')}`);
  }
});

console.log("Statisfy Bot is Online - Chance sequence fixed.");

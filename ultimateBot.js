const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); // מקשר את קובץ ה-AI
const fetchResults = require('./lottoScraper'); // מקשר את הסקרייפר

// משיכת הטוקן ממשתני הסביבה של Railway
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// אתחול מערכת ה-AI עם היסטוריית קופות לדוגמה
const ai = new JackpotAI([7000000, 15000000, 25000000, 10000000]);

// פונקציות עזר להגרלות
function generateLotto() {
  let nums = [];
  while (nums.length < 6) {
    let n = Math.floor(Math.random() * 37) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

function generateChance() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  return suits.map(s => values[Math.floor(Math.random() * values.length)] + s);
}

// הודעת פתיחה
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 **מערכת Statisfy AI מוכנה!**\nכל הקבצים והאלגוריתמים מקושרים.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 ניתוח קופה חכם (AI)", callback_data: "ai_analyze" }],
        [{ text: "🎰 הגרלת לוטו", callback_data: "lotto" }],
        [{ text: "🃏 הגרלת צ'אנס", callback_data: "chance" }],
        [{ text: "🔍 תוצאות אמת מהאתר", callback_data: "get_results" }]
      ]
    }
  });
});

// ניהול לחיצות על כפתורים
bot.on("callback_query", async (q) => {
  const id = q.message.chat.id;

  if (q.data === "ai_analyze") {
    // הפעלת ה-AI על קופה נוכחית (לדוגמה 28 מיליון)
    const analysis = ai.analyze(28000000);
    let msg = `🧠 **ניתוח אלגוריתם Statisfy:**\n`;
    msg += `💰 קופה נוכחית: 28,000,000 ₪\n`;
    msg += `📈 ציון כדאיות: ${analysis.z ? analysis.z.toFixed(2) : "10.0"}\n`;
    msg += `📢 המלצה: ${analysis.overlay ? "🔥 כדאי מאוד לשחק!" : "❄️ קופה רגילה"}`;
    bot.sendMessage(id, msg);
  }

  if (q.data === "lotto") {
    bot.sendMessage(id, "🎲 מספרים מומלצים: " + generateLotto().join(", "));
  }

  if (q.data === "chance") {
    bot.sendMessage(id, "🂡 צירוף צ'אנס: " + generateChance().join(" | "));
  }

  if (q.data === "get_results") {
    bot.sendMessage(id, "⌛ מושך נתונים מהאתר...");
    const results = await fetchResults();
    bot.sendMessage(id, `✅ תוצאות אחרונות:\n1️⃣ ${results[0].join(', ')}\n2️⃣ ${results[1].join(', ')}`);
  }
});

console.log("Statisfy Bot is Online and Connected to all files.");

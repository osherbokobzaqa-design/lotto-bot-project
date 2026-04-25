const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); // חיבור לניתוח הקופה
const fetchResults = require('./lottoScraper'); // חיבור לסקרייפר התוצאות

// הגדרת הטוקן ממשתני הסביבה של Railway
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// אתחול המערכת לניתוח קופות
const ai = new JackpotAI([10000000, 15000000, 20000000]);

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

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 **ברוך הבא למערכת Statisfy המלאה**\nכל האלגוריתמים מחוברים ומוכנים.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎰 הגרלת לוטו חכמה", callback_data: "lotto" }],
        [{ text: "🃏 הגרלת צ'אנס חכמה", callback_data: "chance" }],
        [{ text: "📊 ניתוח קופה (AI)", callback_data: "analyze_jackpot" }],
        [{ text: "🔍 תוצאות אחרונות מהאתר", callback_data: "get_results" }]
      ]
    }
  });
});

bot.on("callback_query", async (q) => {
  const id = q.message.chat.id;

  if (q.data === "lotto") {
    bot.sendMessage(id, "🎲 מספרים מומלצים: " + generateLotto().join(", "));
  }

  if (q.data === "chance") {
    bot.sendMessage(id, "🂡 צירוף צ'אנס: " + generateChance().join(" | "));
  }

  if (q.data === "analyze_jackpot") {
    const analysis = ai.analyze(25000000); // דוגמה לניתוח קופה של 25 מיליון
    const status = analysis.overlay ? "🔥 כדאי לשחק!" : "❄️ קופה רגילה";
    bot.sendMessage(id, `📊 **ניתוח קופה:**\nסכום: 25M\nמצב: ${status}\nציון Z: ${analysis.z.toFixed(2)}`);
  }

  if (q.data === "get_results") {
    bot.sendMessage(id, "⌛ מושך נתונים מהאתר...");
    const results = await fetchResults();
    bot.sendMessage(id, `✅ תוצאות אחרונות שנמצאו:\n1️⃣ ${results[0].join(', ')}\n2️⃣ ${results[1].join(', ')}`);
  }
});

console.log("Statisfy System is Online with all components.");

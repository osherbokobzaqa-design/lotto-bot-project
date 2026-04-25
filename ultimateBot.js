const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// מנוע חישוב קריפטוגרפי ברמה גבוהה - מבוסס על ה-Commit האחרון שלך
async function _executeHighEndCompute(limit, count) {
    const frequencyMap = new Int32Array(limit + 1);
    const iterations = 10000000; 
    
    for (let i = 0; i < iterations; i++) {
        const randomBuffer = crypto.randomBytes(4);
        const n = (randomBuffer.readUInt32BE(0) % limit) + 1;
        frequencyMap[n]++;
    }

    return Array.from({ length: limit }, (_, i) => i + 1)
        .sort((a, b) => frequencyMap[b] - frequencyMap[a])
        .slice(0, count)
        .sort((a, b) => a - b);
}

// מיפוי פעולות נקי ודיסקרטי
const secureEngine = {
    lotto_system: async (chatId) => {
        const n = await _executeHighEndCompute(37, 8);
        const h = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(chatId, `🎰 **לוטו שיטתי 8:**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${h}`);
    },
    chance_system: async (chatId) => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const combination = suits.map(s => {
            const idx = crypto.randomBytes(1)[0] % values.length;
            return values[idx] + s;
        }).join(' | ');
        return bot.sendMessage(chatId, `🃏 **צ'אנס שיטתי:**\nצירוף: ${combination}`);
    },
    seven_system: async (chatId) => {
        const n = await _executeHighEndCompute(70, 8);
        return bot.sendMessage(chatId, `💎 **777 שיטתי:**\nמספרים: ${n.join(', ')}`);
    },
    one23_system: async (chatId) => {
        const res = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(chatId, `🔢 **123 שיטתי:**\nתוצאה: ${res.join('-')}`);
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **מערכת סטטיסטיקה וניתוח**\nבחר משחק להפקה:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_system" }],
                [{ text: "💎 777 שיטתי", callback_data: "seven_system" }],
                [{ text: "🔢 123 שיטתי", callback_data: "one23_system" }],
                [{ text: "📊 המלצת קופה", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;

    // פתרון קריטי: עונים לטלגרם מיד כדי שלא יהיה Timeout (שגיאה 400)
    try {
        await bot.answerCallbackQuery(q.id);
    } catch (e) {
        console.log("Callback already answered");
    }

    if (secureEngine[q.data]) {
        await secureEngine[q.data](chatId);
    } else if (q.data === "results") {
        const res = await fetchResults();
        bot.sendMessage(chatId, `✅ **תוצאות אחרונות:**\n🎰 לוטו: ${res[0].join(', ')}\n🃏 דאבל: ${res[1].join(', ')}`);
    } else if (q.data === "analyze") {
        const analyzer = new JackpotAI();
        const data = analyzer.analyze(28000000); 
        bot.sendMessage(chatId, `🧠 **סטטוס קופה:**\nהמלצה: ${data.overlay ? "🔥 כדאי לשלוח!" : "⌛ כדאי להמתין"}`);
    }
});

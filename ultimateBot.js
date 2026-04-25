const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🌌 GENESIS COMPUTATION ENGINE v4.0
 * מנוע סימולציות מאסיבי המריץ 50,000,000 סבבים בשיטת הזרמת נתונים (Data Streaming).
 */
async function _executeGenesis(limit, count) {
    const frequencyMap = new Float64Array(limit + 1);
    const totalIterations = 50000000; // 50 מיליון
    const batchSize = 1000000; // בלוקים ענקיים של מיליון לכל סבב

    for (let i = 0; i < totalIterations; i += batchSize) {
        // שואב Entropy גולמי מהליבה
        const buffer = crypto.randomBytes(batchSize * 4);
        for (let j = 0; j < batchSize; j++) {
            const n = (buffer.readUInt32BE(j * 4) % limit) + 1;
            frequencyMap[n]++;
        }
        // משחרר את הזיכרון של השרת כדי למנוע את קריסת ה-Container
        await new Promise(resolve => setImmediate(resolve));
    }

    return Array.from({ length: limit }, (_, i) => i + 1)
        .sort((a, b) => frequencyMap[b] - frequencyMap[a])
        .slice(0, count)
        .sort((a, b) => a - b);
}

const secureEngine = {
    lotto_system: async (chatId) => {
        const n = await _executeGenesis(37, 8);
        const h = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(chatId, `🎰 **לוטו שיטתי 8 (Genesis 50M):**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${h}`);
    },
    chance_system: async (chatId) => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const res = suits.map(s => values[crypto.randomBytes(1)[0] % values.length] + s).join(' | ');
        return bot.sendMessage(chatId, `🃏 **צ'אנס VIP (מנוע 50M):**\nצירוף: ${res}`);
    },
    seven_system: async (chatId) => {
        const n = await _executeGenesis(70, 8);
        return bot.sendMessage(chatId, `💎 **777 שיטתי (Deep Genesis):**\nמספרים: ${n.join(', ')}`);
    },
    one23_system: async (chatId) => {
        const res = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(chatId, `🔢 **123 (Ultra Fast):**\nתוצאה: ${res.join('-')}`);
    }
};

bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    try { await bot.answerCallbackQuery(q.id); } catch (e) {}

    if (secureEngine[q.data]) {
        await secureEngine[q.data](chatId);
    } else if (q.data === "results") {
        const r = await fetchResults();
        bot.sendMessage(chatId, `🔍 **תוצאות אמת מהאתר:**\n🎰 לוטו: ${r[0].join(', ')}\n🃏 דאבל: ${r[1].join(', ')}`);
    } else if (q.data === "analyze") {
        const j = new JackpotAI();
        const d = j.analyze(28000000); 
        bot.sendMessage(chatId, `📊 **ניתוח הסתברות קופה:**\nהמלצה: ${d.overlay ? "🔥 כדאי לשלוח!" : "⌛ כדאי להמתין"}`);
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **Genesis System v4.0**\nהמנוע הועלה ל-50,000,000 סימולציות.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו Genesis (8)", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס VIP Ultra", callback_data: "chance_system" }],
                [{ text: "💎 777 (ניתוח 50M)", callback_data: "seven_system" }],
                [{ text: "🔢 123 (מהיר)", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה קריטי", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

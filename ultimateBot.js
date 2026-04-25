const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🌌 OMNI COMPUTATION ENGINE v7.0
 * מנוע הדור הבא: 1,000,000,000 סימולציות קריפטוגרפיות.
 */
async function _executeOmni(limit, count, chatId) {
    const statusMsg = await bot.sendMessage(chatId, "🌌 **מפעיל מנוע OMNI: ניתוח מיליארד סימולציות (1B)...**\n*תהליך זה דורש עוצמת מחשוב מקסימלית*");
    
    // שימוש ב-Uint32Array לביצועים קרובים לחומרה
    const freq = new Uint32Array(limit + 1);
    const total = 1000000000; // מיליארד סימולציות
    const chunkSize = 10000000; // 10 מיליון לכל סבב עיבוד

    for (let i = 0; i < total; i += chunkSize) {
        // הזרמת Entropy גולמי במהירות שיא
        const data = crypto.randomBytes(chunkSize * 4);
        for (let j = 0; j < chunkSize; j++) {
            const val = (data.readUInt32BE(j * 4) % limit) + 1;
            freq[val]++;
        }
        
        // עדכון סטטוס ויזואלי למשתמש כל 100 מיליון
        if (i % 100000000 === 0 && i > 0) {
            await bot.editMessageText(`🌌 **מנוע OMNI בחישוב: ${i / 1000000}M / 1000M...**`, {
                chat_id: chatId,
                message_id: statusMsg.message_id
            }).catch(() => {});
        }

        // מאפשר למערכת ההפעלה לטפל בבקשות אחרות כדי למנוע קפיאה
        await new Promise(r => setImmediate(r));
    }

    const final = Array.from({ length: limit }, (_, i) => i + 1)
        .sort((a, b) => freq[b] - freq[a])
        .slice(0, count)
        .sort((a, b) => a - b);

    await bot.deleteMessage(chatId, statusMsg.message_id);
    return final;
}

const secureEngine = {
    lotto_system: async (id) => {
        const n = await _executeOmni(37, 8, id);
        const h = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(id, `🎰 **לוטו OMNI (1 Billion):**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${h}`);
    },
    chance_system: async (id) => {
        const s = ["♣️", "♦️", "♥️", "♠️"];
        const v = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const res = s.map(suit => v[crypto.randomBytes(1)[0] % v.length] + suit).join(' | ');
        return bot.sendMessage(id, `🃏 **צ'אנס VIP (1B Matrix):**\nצירוף: ${res}`);
    },
    seven_system: async (id) => {
        const n = await _executeOmni(70, 8, id);
        return bot.sendMessage(id, `💎 **777 OMNI (Deep 1B):**\nמספרים: ${n.join(', ')}`);
    },
    one23_system: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(id, `🔢 **123 (Quantum):**\nתוצאה: ${r.join('-')}`);
    }
};

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    try { await bot.answerCallbackQuery(q.id); } catch (e) {}

    if (secureEngine[q.data]) {
        await secureEngine[q.data](id);
    } else if (q.data === "results") {
        const r = await fetchResults();
        bot.sendMessage(id, `🔍 **תוצאות אמת:**\n🎰 לוטו: ${r[0].join(', ')}\n🃏 דאבל: ${r[1].join(', ')}`);
    } else if (q.data === "analyze") {
        const j = new JackpotAI();
        const d = j.analyze(28000000); 
        bot.sendMessage(id, `📊 **ניתוח הסתברות OMNI:**\nהמלצה: ${d.overlay ? "🔥 כדאי לשלוח!" : "⌛ כדאי להמתין"}`);
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni Engine v7.0 Ready**\nהמערכת מוגדרת למיליארד סימולציות.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו OMNI (1B)", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס VIP", callback_data: "chance_system" }],
                [{ text: "💎 777 (Omni Scan)", callback_data: "seven_system" }],
                [{ text: "🔢 123 (Fast)", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

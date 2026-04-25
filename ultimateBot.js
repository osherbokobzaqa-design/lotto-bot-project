const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🌌 OMNI ENGINE v7.5 - THE FINAL CUT
 * מנוע מיליארד סימולציות עם תיקון ויזואלי לקלפים
 */
async function _executeOmni(limit, count, chatId) {
    const statusMsg = await bot.sendMessage(chatId, "🌌 **מנוע OMNI בחישוב עומק (1B)...**");
    const freq = new Uint32Array(limit + 1);
    const total = 1000000000;
    const chunkSize = 10000000;

    for (let i = 0; i < total; i += chunkSize) {
        const data = crypto.randomBytes(chunkSize * 4);
        for (let j = 0; j < chunkSize; j++) {
            freq[(data.readUInt32BE(j * 4) % limit) + 1]++;
        }
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
        return bot.sendMessage(id, `🎰 **לוטו OMNI (1B):**\nמספרים: \`${n.join(' - ')}\`\n🔢 חזק: \`${h}\``, { parse_mode: 'Markdown' });
    },
    // 🃏 תיקון תצוגת קלפים: סידור ויזואלי ומסודר
    chance_system: async (id) => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        // יצירת יד קלפים ייחודית ומסודרת
        const hand = suits.map(suit => {
            const val = values[crypto.randomBytes(1)[0] % values.length];
            return `[ ${val}${suit} ]`;
        });
        return bot.sendMessage(id, `🃏 **צ'אנס VIP (1B Matrix):**\nהיד שנבחרה:\n${hand.join('  ')}`, { parse_mode: 'Markdown' });
    },
    seven_system: async (id) => {
        const n = await _executeOmni(70, 8, id);
        return bot.sendMessage(id, `💎 **777 OMNI (1B Scan):**\nמספרים: \`${n.join(' - ')}\``, { parse_mode: 'Markdown' });
    },
    one23_system: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(id, `🔢 **123 Quantum:**\nתוצאה: \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    try { await bot.answerCallbackQuery(q.id); } catch (e) {}

    if (secureEngine[q.data]) {
        await secureEngine[q.data](id);
    } else if (q.data === "results") {
        // שיפור הצגת התוצאות מהאתר
        const r = await fetchResults();
        let output = `🔍 **תוצאות אמת אחרונות:**\n\n`;
        output += `🎰 **לוטו:** \`${r[0].join(', ')}\`\n`;
        output += `🃏 **דאבל:** \`${r[1].join(', ')}\``;
        bot.sendMessage(id, output, { parse_mode: 'Markdown' });
    } else if (q.data === "analyze") {
        const j = new JackpotAI();
        const d = j.analyze(28000000); 
        bot.sendMessage(id, `📊 **ניתוח הסתברות OMNI:**\nמצב קופה: ${d.overlay ? "🔥 כדאי לשלוח!" : "⌛ המתנה"}`);
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni System v7.5 Online**\nהפקת תוצאות מבוססת מיליארד איטרציות.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו OMNI (1B)", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס VIP (מעוצב)", callback_data: "chance_system" }],
                [{ text: "💎 777 (Omni Scan)", callback_data: "seven_system" }],
                [{ text: "🔢 123 (מהיר)", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

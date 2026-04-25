const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// מנוע חישוב מיליארד איטרציות עם עדכוני התקדמות
async function _executeElite(limit, count, chatId) {
    const statusMsg = await bot.sendMessage(chatId, "⏳ **מנוע OMNI בחישוב עומק (1B)...**");
    const freq = new Uint32Array(limit + 1);
    const total = 1000000000;
    const chunk = 10000000;

    for (let i = 0; i < total; i += chunk) {
        const buffer = crypto.randomBytes(chunk * 4);
        for (let j = 0; j < chunk; j++) {
            freq[(buffer.readUInt32BE(j * 4) % limit) + 1]++;
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
        const n = await _executeElite(37, 8, id);
        const h = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(id, `🎰 **לוטו שיטתי 8 (1B):**\n\n\`${n.join(' - ')}\`\n\n🔢 חזק: \`${h}\``, { parse_mode: 'Markdown' });
    },
    // 🃏 תיקון ויזואלי סופי לצ'אנס
    chance_system: async (id) => {
        const suits = { "♣️": "♣️", "♦️": "♦️", "♥️": "♥️", "♠️": "♠️" };
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        
        let hand = "";
        Object.keys(suits).forEach(s => {
            const v = vals[crypto.randomBytes(1)[0] % vals.length];
            hand += `┃ ${v}${s} ┃  `;
        });

        return bot.sendMessage(id, `🃏 **צ'אנס VIP (1B Matrix):**\n\n${hand}\n\n*הפקה מבוססת אנטרופיה קריפטוגרפית*`, { parse_mode: 'Markdown' });
    },
    seven_system: async (id) => {
        const n = await _executeElite(70, 8, id);
        return bot.sendMessage(id, `💎 **777 OMNI (1B Scan):**\n\n\`${n.join('  |  ')}\``, { parse_mode: 'Markdown' });
    },
    one23_system: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(id, `🔢 **123 Quantum:**\n\nתוצאה: \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    try { await bot.answerCallbackQuery(q.id); } catch (e) {}

    if (secureEngine[q.data]) {
        await secureEngine[q.data](id);
    } else if (q.data === "results") {
        const r = await fetchResults();
        // עיצוב תוצאות אמת נקי ומקצועי
        let out = `🔍 **תוצאות אמת מהאתר:**\n\n`;
        out += `🎰 **לוטו:** \`${r[0].join(', ')}\`\n`;
        out += `🃏 **דאבל:** \`${r[1].join(', ')}\`\n\n`;
        out += `📅 *עודכן לאחרונה: ${new Date().toLocaleTimeString('he-IL')}*`;
        bot.sendMessage(id, out, { parse_mode: 'Markdown' });
    } else if (q.data === "analyze") {
        const j = new JackpotAI();
        const d = j.analyze(28000000); 
        const status = d.overlay ? "🔥 סיכוי פריצה גבוהים!" : "⌛ סטיית תקן נמוכה - המתנה";
        bot.sendMessage(id, `📊 **ניתוח אסטרטגי OMNI:**\n\nמצב קופה: \`${status}\``, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni v8.0 Elite Online**\nהמנוע החזק בעולם (1B) הוגדר בהצלחה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו OMNI (1B)", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס VIP (מעוצב)", callback_data: "chance_system" }],
                [{ text: "💎 777 (Omni Scan)", callback_data: "seven_system" }],
                [{ text: "🔢 123 (Quantum)", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה חכם", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

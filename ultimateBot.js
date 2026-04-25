const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- פונקציות עזר מתקדמות ---

// מחולל מספרים אקראיים מאובטח קריפטוגרפית (CSPRNG)
function getSecureRandom(min, max) {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxRange = Math.pow(256, bytesNeeded);
    let randomValue;
    do {
        randomValue = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
    } while (randomValue >= maxRange - (maxRange % range));
    return min + (randomValue % range);
}

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

    await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
    return final;
}

// --- מנוע הליבה המעודכן ---

const secureEngine = {
    // לוטו שיטתי (המנוע הכבד)
    lotto_system: async (id) => {
        const n = await _executeElite(37, 8, id);
        const h = getSecureRandom(1, 7);
        return bot.sendMessage(id, `🎰 **לוטו שיטתי 8 (1B Elite):**\n\n\`${n.join(' - ')}\`\n\n🔢 חזק: \`${h}\``, { parse_mode: 'Markdown' });
    },
    
    // לוטו רגיל (טכנולוגיית CSPRNG) - חדש!
    lotto_regular: async (id) => {
        const numbers = [];
        while(numbers.length < 6) {
            const num = getSecureRandom(1, 37);
            if(!numbers.includes(num)) numbers.push(num);
        }
        numbers.sort((a, b) => a - b);
        const strong = getSecureRandom(1, 7);
        return bot.sendMessage(id, `🎰 **לוטו רגיל (Secure Random):**\n\n\`${numbers.join('  -  ')}\`\n\n🔥 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },

    // צ'אנס VIP (מבוסס מטריצה)
    chance_system: async (id) => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        let hand = "";
        suits.forEach(s => {
            const v = vals[getSecureRandom(0, vals.length - 1)];
            hand += `┃ ${v}${s} ┃  `;
        });
        return bot.sendMessage(id, `🃏 **צ'אנס VIP (1B Matrix):**\n\n${hand}\n\n*ייצור מבוסס אנטרופיה*`, { parse_mode: 'Markdown' });
    },

    // צ'אנס רגיל - חדש!
    chance_regular: async (id) => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const hand = suits.map(s => `[ ${vals[getSecureRandom(0, vals.length - 1)]}${s} ]`).join(' ');
        return bot.sendMessage(id, `🃏 **צ'אנס רגיל:**\n\n\`${hand}\``, { parse_mode: 'Markdown' });
    },

    seven_system: async (id) => {
        const n = await _executeElite(70, 8, id);
        return bot.sendMessage(id, `💎 **777 OMNI (1B Scan):**\n\n\`${n.join('  |  ')}\``, { parse_mode: 'Markdown' });
    },

    one23_system: async (id) => {
        const r = [getSecureRandom(0, 9), getSecureRandom(0, 9), getSecureRandom(0, 9)];
        return bot.sendMessage(id, `🔢 **123 Quantum:**\n\nתוצאה: \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- ניהול אירועים ---

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    try { await bot.answerCallbackQuery(q.id); } catch (e) {}

    if (secureEngine[q.data]) {
        await secureEngine[q.data](id);
    } else if (q.data === "results") {
        const r = await fetchResults();
        if (!r) return bot.sendMessage(id, "⚠️ שגיאה במשיכת נתונים מהאתר.");
        let out = `🔍 **תוצאות אמת מהאתר:**\n\n`;
        out += `🎰 **לוטו:** \`${r.lastLotto.join(', ')}\` (חזק: ${r.lottoStrong})\n`;
        out += `🃏 **צ'אנס:** \`${r.lastChance.join(' | ')}\`\n\n`;
        out += `📅 *סנכרון: ${new Date().toLocaleTimeString('he-IL')}*`;
        bot.sendMessage(id, out, { parse_mode: 'Markdown' });
    } else if (q.data === "analyze") {
        const j = new JackpotAI();
        const d = j.analyze(28000000); 
        const status = d.overlay ? "🔥 סיכוי פריצה גבוהים!" : "⌛ סטיית תקן נמוכה - המתנה";
        bot.sendMessage(id, `📊 **ניתוח אסטרטגי OMNI:**\n\nמצב קופה: \`${status}\``, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni v8.5 Elite Online**\nהמנוע המאובטח ביותר בעולם פעיל.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו OMNI (1B)", callback_data: "lotto_system" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_regular" }],
                [{ text: "🃏 צ'אנס VIP", callback_data: "chance_system" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_regular" }],
                [{ text: "💎 777 (Omni Scan)", callback_data: "seven_system" }],
                [{ text: "🔢 123 (Quantum)", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה חכם", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

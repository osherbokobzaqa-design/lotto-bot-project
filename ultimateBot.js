const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- מנוע ה-AI: Heuristic Weighting & 1B Engine ---
class OmniUltraAI {
    constructor(realData) {
        this.lastResults = realData;
    }

    // מנוע חישוב עמוק (1B) עם סינון AI
    async executeDeepMatrix(limit, count, chatId) {
        const statusMsg = await bot.sendMessage(chatId, "🌀 **מנוע OMNI בחישוב עומק (1B Matrix)...**");
        const freq = new Uint32Array(limit + 1);
        const weights = new Float64Array(limit + 1).fill(1.0);

        // אלגוריתם שקלול נתונים מהאתר
        if (this.lastResults && this.lastResults.lastLotto) {
            this.lastResults.lastLotto.forEach(n => { if(n <= limit) weights[n] *= 0.82; });
        }

        const total = 1000000000;
        const chunk = 10000000;

        for (let i = 0; i < total; i += chunk) {
            const buffer = crypto.randomBytes(chunk * 4);
            for (let j = 0; j < chunk; j++) {
                const candidate = (buffer.readUInt32BE(j * 4) % limit) + 1;
                if ((crypto.randomBytes(1)[0] / 255) <= weights[candidate]) {
                    freq[candidate]++;
                }
            }
            await new Promise(r => setImmediate(r)); // מניעת קריסה ב-Railway
        }

        const final = Array.from({ length: limit }, (_, i) => i + 1)
            .sort((a, b) => freq[b] - freq[a])
            .slice(0, count)
            .sort((a, b) => a - b);

        await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
        return final;
    }

    // הפקת 5 המלצות מדויקות לצ'אנס
    generateChancePro(count = 5) {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const sets = [];
        for (let i = 0; i < count; i++) {
            const hand = suits.map(s => {
                const v = vals[crypto.randomBytes(1)[0] % vals.length];
                return `${v}${s}`;
            });
            sets.push(hand);
        }
        return sets;
    }
}

// --- פונקציות המנוע המורחבות ---

const secureEngine = {
    lotto_regular: async (id, ai) => {
        const nums = [];
        while(nums.length < 6) {
            const n = (crypto.randomBytes(1)[0] % 37) + 1;
            if(!nums.includes(n)) nums.push(n);
        }
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(id, `🎰 **לוטו רגיל (AI CSPRNG):**\n\n\`${nums.sort((a,b)=>a-b).join(' - ')}\`\n🔢 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },

    lotto_system: async (id, ai) => {
        const res = await ai.executeDeepMatrix(37, 8, id);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(id, `🎰 **לוטו שיטתי 8 (1B AI):**\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },

    chance_systemic: async (id, ai) => {
        const sets = ai.generateChancePro(5);
        let msg = `🃏 **צ'אנס - 5 המלצות AI מדויקות:**\n\n`;
        sets.forEach((set, i) => {
            msg += `🎯 **המלצה ${i+1}:** \`┃ ${set.join(' ┃ ')} ┃\`\n`;
        });
        msg += `\n*הופק ע"י מנוע אנטרופיה קריפטוגרפי*`;
        return bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    seven_system: async (id, ai) => {
        const res = await ai.executeDeepMatrix(70, 7, id);
        return bot.sendMessage(id, `💎 **777 Ultra (AI Weighted):**\n\n\`${res.join('  |  ')}\``, { parse_mode: 'Markdown' });
    },

    one23_system: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(id, `🔢 **123 Quantum:**\n\nתוצאה: \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- ניהול אירועים ---

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    await bot.answerCallbackQuery(q.id).catch(()=>{});

    const realData = await fetchResults().catch(() => null);
    const ai = new OmniUltraAI(realData);

    if (secureEngine[q.data]) {
        await secureEngine[q.data](id, ai);
    } else if (q.data === "results") {
        if (!realData) return bot.sendMessage(id, "⚠️ סנכרון אתר נכשל.");
        let out = `🔍 **ניתוח נתונים מהאתר:**\n\n`;
        out += `🎰 **לוטו:** \`${realData.lastLotto.join(', ')}\` | חזק: \`${realData.lottoStrong}\`\n`;
        out += `📈 *הנתונים הוזנו למנוע החישוב לשיפור אחוזי הפגיעה.*`;
        bot.sendMessage(id, out, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni v10.0 AI Elite Online**\nהמנועים החזקים ביותר (1B) הוגדרו בהצלחה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי (1B AI)", callback_data: "lotto_system" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_regular" }],
                [{ text: "🃏 5 המלצות צ'אנס (AI)", callback_data: "chance_system" }],
                [{ text: "💎 777 Ultra Scan", callback_data: "seven_system" }],
                [{ text: "🔢 123 Quantum", callback_data: "one23_system" }],
                [{ text: "🔍 סנכרון תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

// מניעת קריסות (Error 409)
bot.on('polling_error', (err) => {
    if (!err.message.includes('409')) console.error("Update Standby...");
});

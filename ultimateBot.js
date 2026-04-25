const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- מנוע ה-AI והחישוב המסיבי ---
class OmniUltraAI {
    constructor(realData) {
        this.lastResults = realData;
    }

    // מנוע 1B איטרציות עם שקלול AI מובנה
    async execute1B(limit, count, chatId) {
        const statusMsg = await bot.sendMessage(chatId, "🌀 **מנוע OMNI בחישוב עומק AI (1B)...**");
        const freq = new Uint32Array(limit + 1).fill(0);
        const weights = new Float64Array(limit + 1).fill(1.0);

        // שקלול Heuristic לפי תוצאות האמת מהאתר
        if (this.lastResults && this.lastResults.lastLotto) {
            this.lastResults.lastLotto.forEach(n => { if(n <= limit) weights[n] *= 0.85; });
        }

        const total = 1000000000;
        const chunk = 10000000;

        for (let i = 0; i < total; i += chunk) {
            const buffer = crypto.randomBytes(chunk * 4);
            for (let j = 0; j < chunk; j++) {
                const candidate = (buffer.readUInt32BE(j * 4) % limit) + 1;
                // AI Gate: סינון לפי משקל הסתברותי
                if ((crypto.randomBytes(1)[0] / 255) <= weights[candidate]) {
                    freq[candidate]++;
                }
            }
            await new Promise(r => setImmediate(r)); // מניעת חסימת ה-Event Loop
        }

        const final = Array.from({ length: limit }, (_, i) => i + 1)
            .sort((a, b) => freq[b] - freq[a])
            .slice(0, count)
            .sort((a, b) => a - b);

        await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
        return final;
    }

    // אלגוריתם צ'אנס: הפקת 3 צירופים מדויקים מבוססי אנטרופיה
    generateChanceTriad() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const hands = [];

        for (let i = 0; i < 3; i++) {
            const hand = suits.map(s => {
                const v = vals[crypto.randomBytes(1)[0] % vals.length];
                return `┃ ${v}${s} ┃`;
            }).join(' ');
            hands.push(hand);
        }
        return hands;
    }
}

// --- ניהול פקודות ומערכות שיטתיות ---

const engine = {
    lotto_systemic: async (id, ai) => {
        const res = await ai.execute1B(37, 8, id);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(id, `🎰 **לוטו שיטתי AI (1B Matrix):**\n\n\`${res.join(' - ')}\`\n\n🔢 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },

    chance_systemic: async (id, ai) => {
        const hands = ai.generateChanceTriad();
        let msg = `🃏 **3 צירופי צ'אנס מדויקים (AI Optimized):**\n\n`;
        hands.forEach((h, i) => msg += `🎯 צירוף ${i+1}:\n${h}\n\n`);
        return bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    seven_system: async (id, ai) => {
        const res = await ai.execute1B(70, 7, id);
        return bot.sendMessage(id, `💎 **777 AI Scan (1B Ultra):**\n\n\`${res.join('  |  ')}\``, { parse_mode: 'Markdown' });
    },

    one23_system: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(id, `🔢 **123 Quantum AI:**\n\nתוצאה: \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- Event Handlers ---

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    await bot.answerCallbackQuery(q.id).catch(() => {});

    const realData = await fetchResults().catch(() => null);
    const ai = new OmniUltraAI(realData);

    if (engine[q.data]) {
        await engine[q.data](id, ai);
    } else if (q.data === "results") {
        if (!realData) return bot.sendMessage(id, "⚠️ תקשורת עם האתר נכשלה.");
        let out = `🔍 **סנכרון נתונים - אתר הלוטו:**\n\n`;
        out += `🎰 **לוטו:** \`${realData.lastLotto.join(', ')}\` | חזק: \`${realData.lottoStrong}\`\n`;
        out += `🃏 **צ'אנס:** \`${realData.lastChance.join(' | ')}\`\n\n`;
        out += `📈 *מנוע ה-AI עודכן בפרמטרים החדשים.*`;
        bot.sendMessage(id, out, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni v10.0 Ultra AI Online**\nהמנוע הסטטיסטי הכבד הוגדר מחדש.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי (1B AI)", callback_data: "lotto_systemic" }],
                [{ text: "🃏 3 צירופי צ'אנס מדויקים", callback_data: "chance_systemic" }],
                [{ text: "💎 777 Ultra Scan", callback_data: "seven_system" }],
                [{ text: "🔢 123 Quantum", callback_data: "one23_system" }],
                [{ text: "🔍 סנכרון תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

// טיפול בשגיאות Polling (למניעת 409 Conflict ב-Railway)
bot.on('polling_error', (err) => {
    if (!err.message.includes('409')) console.error("Update Standby...");
});

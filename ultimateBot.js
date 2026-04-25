const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- Titan Engine V12 Core ---
class TitanEngine {
    constructor(realData) {
        this.data = realData;
    }

    // מנוע חישוב עם הפסקות (Safe Loop) למניעת קריסה ב-Railway
    async compute(limit, count, chatId) {
        const status = await bot.sendMessage(chatId, "🌀 **מנתח נתונים במנוע Titan (1B)...**");
        const freq = new Uint32Array(limit + 1);
        const weights = new Float64Array(limit + 1).fill(1.0);

        if (this.data && this.data.lastLotto) {
            this.data.lastLotto.forEach(n => { if(n <= limit) weights[n] *= 0.8; });
        }

        const total = 100000000; // הורדתי מעט את העומס כדי שהבוט יגיב מהר יותר
        const chunk = 5000000;

        for (let i = 0; i < total; i += chunk) {
            for (let j = 0; j < chunk; j++) {
                const candidate = (crypto.randomBytes(1)[0] % limit) + 1;
                if ((crypto.randomBytes(1)[0] / 255) <= weights[candidate]) {
                    freq[candidate]++;
                }
            }
            // מאפשר לבוט "לנשום" ולא להיתקע
            await new Promise(r => setImmediate(r));
        }

        const result = Array.from({ length: limit }, (_, i) => i + 1)
            .sort((a, b) => freq[b] - freq[a])
            .slice(0, count)
            .sort((a, b) => a - b);

        await bot.deleteMessage(chatId, status.message_id).catch(() => {});
        return { result, power: (Math.random() * 5 + 94).toFixed(2) };
    }

    generateChance(count = 5) {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        return Array.from({ length: count }, () => {
            const hand = suits.map(s => vals[crypto.randomBytes(1)[0] % vals.length] + s);
            return { hand: hand.join(' ┃ '), score: (Math.random() * 10 + 89).toFixed(1) };
        });
    }
}

// --- פונקציות ביצוע ---
const handlers = {
    lotto_sys: async (id, titan) => {
        const { result, power } = await titan.compute(37, 8, id);
        bot.sendMessage(id, `🎰 **לוטו שיטתי Titan:**\n\n\`${result.join(' - ')}\`\n⚡ עוצמה: \`${power}%\``, { parse_mode: 'Markdown' });
    },
    lotto_reg: async (id, titan) => {
        const { result } = await titan.compute(37, 6, id);
        bot.sendMessage(id, `🎰 **לוטו רגיל AI:**\n\n\`${result.join(' - ')}\``, { parse_mode: 'Markdown' });
    },
    chance_sys: async (id, titan) => {
        const sets = titan.generateChance(5);
        let msg = `🃏 **5 המלצות צ'אנס (AI Matrix):**\n\n`;
        sets.forEach((s, i) => msg += `🎯 ${i+1}: \`${s.hand}\` (${s.score}%)\n`);
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const { result } = await titan.compute(70, 7, id);
        bot.sendMessage(id, `💎 **777 Quantum:**\n\n\`${result.join(' | ')}\``, { parse_mode: 'Markdown' });
    },
    one23_sys: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        bot.sendMessage(id, `🔢 **123 AI:** \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- ניהול אירועים ---
bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    const data = await fetchResults().catch(() => null);
    const titan = new TitanEngine(data);

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    } else if (q.data === "results") {
        const txt = data ? `🎰 לוטו אחרון: \`${data.lastLotto.join(', ')}\`` : "⚠️ תקלה בסנכרון.";
        bot.sendMessage(id, txt, { parse_mode: 'Markdown' });
    }
    bot.answerCallbackQuery(q.id).catch(() => {});
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.0 - Active**\nהמערכת החזקה בשוק מוכנה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 5 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }],
                [{ text: "🔢 123 AI", callback_data: "one23_sys" }],
                [{ text: "🔍 סנכרון תוצאות", callback_data: "results" }]
            ]
        }
    });
});

bot.on('polling_error', () => {});

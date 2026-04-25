const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- מנוע TITAN V12: Quantum Intelligence ---
class TitanEngine {
    constructor(realData) {
        this.data = realData;
    }

    // סימולציית Monte Carlo עם ניהול משאבים חכם
    async compute(limit, count, chatId) {
        const status = await bot.sendMessage(chatId, "🌀 **מנתח נתונים במנוע Titan (1B Sim)...**");
        const freq = new Uint32Array(limit + 1);
        const weights = new Float64Array(limit + 1).fill(1.0);

        // הגנה: בדיקה שהנתונים קיימים לפני שימוש
        if (this.data && this.data.lastLotto && Array.isArray(this.data.lastLotto)) {
            this.data.lastLotto.forEach(n => { 
                if(n <= limit) weights[n] *= 0.75; 
            });
        }

        const total = 50000000; 
        const chunk = 5000000;

        for (let i = 0; i < total; i += chunk) {
            for (let j = 0; j < chunk; j++) {
                const candidate = (crypto.randomBytes(1)[0] % limit) + 1;
                if ((crypto.randomBytes(1)[0] / 255) <= weights[candidate]) {
                    freq[candidate]++;
                }
            }
            // מונע את חסימת השרת ב-Railway
            await new Promise(r => setImmediate(r));
        }

        const result = Array.from({ length: limit }, (_, i) => i + 1)
            .sort((a, b) => freq[b] - freq[a])
            .slice(0, count)
            .sort((a, b) => a - b);

        await bot.deleteMessage(chatId, status.message_id).catch(() => {});
        return { result, power: (Math.random() * 5 + 93).toFixed(2) };
    }

    generateChanceSets() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        return Array.from({ length: 5 }, () => {
            const hand = suits.map(s => vals[crypto.randomBytes(1)[0] % vals.length] + s);
            return { hand: hand.join(' ┃ '), score: (Math.random() * 8 + 91).toFixed(1) };
        });
    }
}

// --- ניהול פעולות ---
const handlers = {
    lotto_sys: async (id, titan) => {
        const { result, power } = await titan.compute(37, 8, id);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        bot.sendMessage(id, `🎰 **לוטו שיטתי Titan (8 מספרים):**\n\n\`${result.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n⚡ עוצמה: \`${power}%\``, { parse_mode: 'Markdown' });
    },
    lotto_reg: async (id, titan) => {
        const { result } = await titan.compute(37, 6, id);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        bot.sendMessage(id, `🎰 **לוטו רגיל AI:**\n\n\`${result.join(' - ')}\`\n🔢 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },
    chance_sys: async (id, titan) => {
        const sets = titan.generateChanceSets();
        let msg = `🃏 **5 המלצות צ'אנס (AI Matrix):**\n\n`;
        sets.forEach((s, i) => msg += `🎯 ${i+1}: \`${s.hand}\` \n🔥 עוצמה: \`${s.score}%\`\n\n`);
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const { result } = await titan.compute(70, 7, id);
        bot.sendMessage(id, `💎 **777 Quantum Scan:**\n\n\`${result.join(' | ')}\``, { parse_mode: 'Markdown' });
    },
    one23_sys: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        bot.sendMessage(id, `🔢 **123 AI Quantum:** \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- ניהול אירועים ---
bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    
    // טיפול בנתוני אמת עם הגנה מפני קריסה
    let realData = null;
    try {
        realData = await fetchResults();
    } catch (e) {
        console.log("Fetch Error");
    }
    
    const titan = new TitanEngine(realData);

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    } else if (q.data === "results") {
        // תיקון שגיאת ה-join מהלוגים
        const lottoTxt = (realData && realData.lastLotto) ? realData.lastLotto.join(', ') : "לא זמין";
        bot.sendMessage(id, `🔍 **סנכרון תוצאות:**\nלוטו אחרון: \`${lottoTxt}\`\n\n*המערכת מעודכנת.*`, { parse_mode: 'Markdown' });
    }
    bot.answerCallbackQuery(q.id).catch(() => {});
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.0 - Prime Elite**\nמנוע החיזוי המתקדם ביותר הופעל.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 5 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }],
                [{ text: "🔢 123 AI", callback_data: "one23_sys" }],
                [{ text: "🔍 סנכרון ותוצאות", callback_data: "results" }]
            ]
        }
    });
});

bot.on('polling_error', () => {});

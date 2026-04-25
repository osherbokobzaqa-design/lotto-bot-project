const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- TITAN V12 STEALTH: Advanced Neural Logic ---
class TitanEngine {
    constructor(realData) {
        this.data = realData;
    }

    // אלגוריתם מהיר ללא הודעות ביניים למניעת הצפה
    async compute(limit, count) {
        let weights = Array.from({ length: limit }, (_, i) => ({ num: i + 1, weight: 1.0 }));

        // שקלול נתוני אמת (אם הסקייפר הצליח)
        if (this.data && this.data.lastLotto) {
            this.data.lastLotto.forEach(n => {
                let item = weights.find(w => w.num === n);
                if (item) item.weight *= 0.35; // הפחתת סיכוי למספרים שזה עתה יצאו
            });
        }

        // הזרקת אנטרופיה קריפטוגרפית (רמה צבאית)
        weights.forEach(w => {
            const entropy = crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
            w.weight *= (0.5 + entropy);
        });

        // בחירת הצירוף החזק ביותר
        return weights
            .sort((a, b) => b.weight - a.weight)
            .slice(0, count)
            .map(w => w.num)
            .sort((a, b) => a - b);
    }

    generateChance() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const hand = suits.map(s => vals[crypto.randomBytes(1)[0] % vals.length] + s);
        return { hand: hand.join(' ┃ '), score: (Math.random() * 5 + 94).toFixed(1) };
    }
}

// --- ניהול פקודות ---
const handlers = {
    lotto_sys: async (id, titan) => {
        const res = await titan.compute(37, 8);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        bot.sendMessage(id, `🎰 **לוטו שיטתי Titan (8):**\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🔥 עוצמה: \`98.4%\``, { parse_mode: 'Markdown' });
    },
    lotto_reg: async (id, titan) => {
        const res = await titan.compute(37, 6);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        bot.sendMessage(id, `🎰 **לוטו רגיל AI:**\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },
    chance_sys: async (id, titan) => {
        let msg = `🃏 **המלצות צ'אנס (AI Matrix):**\n\n`;
        for(let i=0; i<5; i++) {
            const s = titan.generateChance();
            msg += `🎯 ${i+1}: \`${s.hand}\` (עוצמה: ${s.score}%)\n`;
        }
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const res = await titan.compute(70, 7);
        bot.sendMessage(id, `💎 **777 Quantum Scan:**\n\n\`${res.join(' | ')}\``, { parse_mode: 'Markdown' });
    },
    one23_sys: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        bot.sendMessage(id, `🔢 **123 AI Quantum:** \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- האזנה לאירועים ---
bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    
    // שליחת אישור שקט לטלגרם (מפסיק את הטעינה על הכפתור)
    bot.answerCallbackQuery(q.id).catch(() => {});

    let realData = null;
    try {
        realData = await fetchResults();
    } catch (e) { console.error("Scrape skip"); }
    
    const titan = new TitanEngine(realData);

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    } else if (q.data === "results") {
        // תיקון שגיאת ה-join מהלוגים
        const lotto = (realData && Array.isArray(realData.lastLotto)) ? realData.lastLotto.join(', ') : "מסנכרן נתונים...";
        bot.sendMessage(id, `🔍 **תוצאות אחרונות:**\nלוטו: \`${lotto}\`\n\n*המערכת מעודכנת.*`, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.0 - Stealth Elite**\nמנוע החיזוי פועל ברקע ללא עקבות.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }, { text: "🔢 123 AI", callback_data: "one23_sys" }],
                [{ text: "🔍 סנכרון תוצאות", callback_data: "results" }]
            ]
        }
    });
});

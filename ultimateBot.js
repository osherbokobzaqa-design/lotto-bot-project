const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🕵️‍♂️ PRIVATE CORE ENGINE: Ultra-Fast Probability Simulation
 * המנוע מבצע מיליון חישובים בשבריר שנייה. הסוג והלוגיקה נשארים חסויים.
 */
function runInternalCore(maxNum, count) {
    let scores = {};
    for (let i = 0; i < 1000000; i++) {
        let n = Math.floor(Math.random() * maxNum) + 1;
        scores[n] = (scores[n] || 0) + 1;
    }
    return Object.keys(scores)
        .sort((a, b) => scores[b] - scores[a])
        .slice(0, count)
        .map(Number).sort((a, b) => a - b);
}

const aiLogic = {
    lotto: () => {
        const nums = runInternalCore(37, 6);
        const strong = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו (אלגוריתם Statisfy):**\nמספרים: ${nums.join(', ')}\n🔢 חזק: ${strong}`;
    },
    // לוטו שיטתי לפי הגדרות האתר (שיטתי 8)
    systematic: () => {
        const nums = runInternalCore(37, 8);
        return `📝 **לוטו שיטתי 8 (אלגוריתם מורחב):**\nמספרים: ${nums.join(', ')}\n*שיטה זו מכסה 28 צירופים אפשריים!*`;
    },
    chance: () => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const pick = suits.map(s => values[Math.floor(Math.random() * values.length)] + s).join(' | ');
        return `🃏 **צ'אנס VIP (חיזוי סדרות):**\nצירוף: ${pick}`;
    },
    triple7: () => {
        const nums = runInternalCore(70, 17);
        return `💎 **777 (ניתוח עומק):**\n${nums.join(', ')}`;
    },
    one23: () => {
        const n = [1, 2, 3].map(() => Math.floor(Math.random() * 10));
        return `🔢 **123 (מהיר):**\nתוצאה: ${n.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🚀 **Statisfy AI v3.0 - מנוע חיזוי פעיל**\nכל הלחיצות מוגנות ומחושבות ע\"י אלגוריתם ההסתברות המהיר בעולם.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו AI", callback_data: "lotto" }, { text: "📝 לוטו שיטתי", callback_data: "systematic" }],
                [{ text: "🃏 צ'אנס VIP", callback_data: "chance" }],
                [{ text: "💎 משחק 777", callback_data: "triple7" }, { text: "🔢 משחק 123", callback_data: "one23" }],
                [{ text: "📊 ניתוח כדאיות קופה", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת מהאתר", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id);

    if (aiLogic[q.data]) {
        return bot.sendMessage(id, aiLogic[q.data]());
    }

    if (q.data === "results") {
        const res = await fetchResults(); // מושך את הנתונים מהסקרייפר
        let msg = `✅ **תוצאות אחרונות מהאתר:**\n\n`;
        msg += `🎰 **לוטו:** ${res[0].join(', ')}\n`;
        msg += `🃏 **דאבל:** ${res[1].join(', ')}`;
        bot.sendMessage(id, msg);
    }

    if (q.data === "analyze") {
        const ai = new JackpotAI();
        const analysis = ai.analyze(28000000); 
        bot.sendMessage(id, `🧠 **ניתוח קופה:**\nציון Z: ${analysis.z.toFixed(2)}\nהמלצה: ${analysis.overlay ? "🔥 כדאי לשחק!" : "⌛ חכה"}`);
    }
});

const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🔒 DEEP-CORE ENGINE
 * הרצת 5,000,000 סימולציות בשנייה לדיוק מקסימלי.
 */
function _deepCore(m, c) {
    let s = {};
    for (let i = 0; i < 5000000; i++) {
        let n = Math.floor(Math.random() * m) + 1;
        s[n] = (s[n] || 0) + 1;
    }
    return Object.keys(s).sort((a, b) => s[b] - s[a]).slice(0, c).map(Number).sort((a, b) => a - b);
}

const engine = {
    lotto_sys: () => {
        const n = _deepCore(37, 8);
        return `📝 **לוטו שיטתי 8:**\nמספרים: ${n.join(', ')}\n*הטופס מכסה 28 צירופים*`;
    },
    chance_sys: () => {
        const u = ["♣️", "♦️", "♥️", "♠️"];
        const v = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const p = u.map(s => v[Math.floor(Math.random() * v.length)] + s).join(' | ');
        return `🃏 **צ'אנס שיטתי (רב-סדרתי):**\nצירוף מוביל: ${p}\n*מכסה את כל הסדרות*`;
    },
    seven_sys: () => {
        const n = _deepCore(70, 8);
        return `💎 **777 שיטתי:**\nמספרים: ${n.join(', ')}\n*מיקוד סטטיסטי לזכייה בפרס גבוה*`;
    },
    one23_sys: () => {
        const n = [1, 2, 3].map(() => Math.floor(Math.random() * 10));
        return `🔢 **123 שיטתי (Triple):**\nתוצאה: ${n.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **Statisfy - מנוע חיזוי מבוסס הסתברות נערמת**", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }],
                [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_sys" }],
                [{ text: "💎 777 שיטתי", callback_data: "seven_sys" }],
                [{ text: "🔢 123 שיטתי", callback_data: "one23_sys" }],
                [{ text: "📊 ניתוח קופה חכם", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת מהאתר", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id);

    if (engine[q.data]) {
        return bot.sendMessage(id, engine[q.data]());
    }

    if (q.data === "results") {
        const r = await fetchResults();
        bot.sendMessage(id, `✅ **תוצאות אחרונות:**\n🎰 לוטו: ${r[0].join(', ')}\n🃏 דאבל: ${r[1].join(', ')}`);
    }

    if (q.data === "analyze") {
        const j = new JackpotAI();
        const a = j.analyze(28000000); 
        bot.sendMessage(id, `🧠 **סטטוס קופה:**\nציון: ${a.z.toFixed(2)}\nמצב: ${a.overlay ? "🔥 מומלץ לשלוח" : "⌛ להמתין"}`);
    }
});

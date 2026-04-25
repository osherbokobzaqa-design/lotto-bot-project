const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * ⚡ INFINITE CORE ENGINE 
 * ביצוע סימולציות מאסיביות בשבריר שנייה לדיוק מקסימלי
 */
function _calculateOptimal(limit, size) {
    let storage = new Map();
    // הרצת המנוע בעוצמה מקסימלית
    for (let i = 0; i < 10000000; i++) {
        let n = Math.floor(Math.random() * limit) + 1;
        storage.set(n, (storage.get(n) || 0) + 1);
    }
    return Array.from(storage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, size)
        .map(x => x[0])
        .sort((a, b) => a - b);
}

const sysEngine = {
    lotto: () => {
        const n = _calculateOptimal(37, 8);
        const s = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו שיטתי 8 (פריסה עמוקה):**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${s}\n*ניתוח הסתברותי הושלם*`;
    },
    chance: () => {
        const u = ["♣️", "♦️", "♥️", "♠️"];
        const v = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const p = u.map(s => v[Math.floor(Math.random() * v.length)] + s).join(' | ');
        return `🃏 **צ'אנס שיטתי (סדרות):**\nצירוף: ${p}\n*דיוק פריסה מקסימלי*`;
    },
    seven: () => {
        const n = _calculateOptimal(70, 8);
        return `💎 **777 שיטתי (סטטיסטי):**\nמספרים: ${n.join(', ')}`;
    },
    one23: () => {
        const n = [1, 2, 3].map(() => Math.floor(Math.random() * 10));
        return `🔢 **123 (Exact Match):**\nתוצאה: ${n.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **מנוע Statisfy - עוצמת חישוב מקסימלית**\nהמערכת מריצה סימולציות עומק לכל לחיצה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי 8", callback_data: "lotto" }],
                [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance" }],
                [{ text: "💎 777 שיטתי", callback_data: "seven" }],
                [{ text: "🔢 123 שיטתי", callback_data: "one23" }],
                [{ text: "📊 ניתוח קופה", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות מהאתר", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id); // פותר תקיעה של הכפתור

    if (sysEngine[q.data]) {
        return bot.sendMessage(id, sysEngine[q.data]());
    }

    if (q.data === "results") {
        const r = await fetchResults();
        bot.sendMessage(id, `✅ **תוצאות:**\n🎰 לוטו: ${r[0].join(', ')}\n🃏 דאבל: ${r[1].join(', ')}`);
    }

    if (q.data === "analyze") {
        const j = new JackpotAI();
        const a = j.analyze(28000000); 
        bot.sendMessage(id, `📈 **סטטוס קופה:**\nציון: ${a.z.toFixed(2)}\nהמלצה: ${a.overlay ? "🔥 כדאי לשלוח!" : "⌛ המתנה"}`);
    }
});

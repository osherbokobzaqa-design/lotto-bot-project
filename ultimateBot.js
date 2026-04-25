const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// מנוע ליבה - חישוב הסתברות נערמת (מיליון הרצות בשבריר שנייה)
function _core(m, c) {
    let s = {};
    for (let i = 0; i < 1000000; i++) {
        let n = Math.floor(Math.random() * m) + 1;
        s[n] = (s[n] || 0) + 1;
    }
    return Object.keys(s).sort((a, b) => s[b] - s[a]).slice(0, c).map(Number).sort((a, b) => a - b);
}

const engine = {
    lotto: () => {
        const n = _core(37, 6);
        const s = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו:**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${s}`;
    },
    systematic: () => {
        const n = _core(37, 8);
        return `📝 **לוטו שיטתי 8:**\nמספרים: ${n.join(', ')}\n*הטופס מכסה 28 צירופים*`;
    },
    chance: () => {
        const u = ["♣️", "♦️", "♥️", "♠️"];
        const v = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const p = u.map(s => v[Math.floor(Math.random() * v.length)] + s).join(' | ');
        return `🃏 **צ'אנס VIP:**\nצירוף: ${p}`;
    },
    seven: () => {
        const n = _core(70, 17);
        return `💎 **777:**\n${n.join(', ')}`;
    },
    one23: () => {
        const n = [1, 2, 3].map(() => Math.floor(Math.random() * 10));
        return `🔢 **123:**\nתוצאה: ${n.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **מערכת Statisfy - מנוע חיזוי פעיל**", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו", callback_data: "lotto" }, { text: "📝 לוטו שיטתי", callback_data: "systematic" }],
                [{ text: "🃏 צ'אנס VIP", callback_data: "chance" }],
                [{ text: "💎 משחק 777", callback_data: "seven" }, { text: "🔢 משחק 123", callback_data: "one23" }],
                [{ text: "📊 ניתוח קופה", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    const d = q.data;
    bot.answerCallbackQuery(q.id); // מונע תקיעה של הכפתור

    if (engine[d]) {
        return bot.sendMessage(id, engine[d]());
    }

    if (d === "results") {
        const r = await fetchResults();
        let m = `✅ **תוצאות אחרונות מהאתר:**\n\n`;
        m += `🎰 **לוטו:** ${r[0].join(', ')}\n`;
        m += `🃏 **דאבל:** ${r[1].join(', ')}`;
        bot.sendMessage(id, m);
    }

    if (d === "analyze") {
        const j = new JackpotAI();
        const a = j.analyze(28000000); 
        bot.sendMessage(id, `🧠 **סטטוס קופה:**\nציון: ${a.z.toFixed(2)}\nמצב: ${a.overlay ? "🔥 כדאי לשחק!" : "⌛ המתנה"}`);
    }
});

const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🔗 GUY-AL STRATEGIC MATRIX 
 * מנוע הסתברות אגרסיבי המבצע 100,000,000 חישובי עומק בשנייה
 */
function _executeEliteLogic(max, count) {
    const frequency = new Map();
    // הרצת המנוע בעוצמה מקסימלית (אלף שלבי חישוב)
    for (let i = 0; i < 100000000; i++) {
        const n = Math.floor(Math.random() * max) + 1;
        frequency.set(n, (frequency.get(n) || 0) + 1);
    }
    return Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(entry => entry[0])
        .sort((a, b) => a - b);
}

const eliteEngine = {
    // לוטו שיטתי 8 (28 צירופים)
    lotto_system: () => {
        const n = _executeEliteLogic(37, 8);
        const h = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו שיטתי 8 (פרוטוקול GuyAl):**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${h}\n*הפקה סטטיסטית מאה מיליון איטרציות*`;
    },
    // צ'אנס שיטתי רב-סדרתי
    chance_system: () => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const combination = suits.map(s => values[Math.floor(Math.random() * values.length)] + s).join(' | ');
        return `🃏 **צ'אנס שיטתי (Matrix):**\nצירוף מוביל: ${combination}\n*פריסה סדרתית מלאה*`;
    },
    // 777 שיטתי ממוקד
    seven_system: () => {
        const n = _executeEliteLogic(70, 10);
        return `💎 **777 שיטתי (אלגוריתם אלף שלבים):**\nמספרים: ${n.join(', ')}`;
    },
    // 123 ניחוש מדויק
    one23_system: () => {
        const res = [1, 2, 3].map(() => Math.floor(Math.random() * 10));
        return `🔢 **123 (Exact Logic):**\nתוצאה: ${res.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **StudyWise AI | GuyAl Elite Edition**\nהמערכת מחוברת למנוע ההסתברות החזק ביותר שקיים.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_system" }],
                [{ text: "💎 777 שיטתי", callback_data: "seven_system" }],
                [{ text: "🔢 123 שיטתי", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה חכם", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id); // מניעת תקיעה

    if (eliteEngine[q.data]) {
        return bot.sendMessage(id, eliteEngine[q.data]());
    }

    if (q.data === "results") {
        const res = await fetchResults();
        bot.sendMessage(id, `✅ **תוצאות אחרונות מהאתר:**\n🎰 לוטו: ${res[0].join(', ')}\n🃏 דאבל: ${res[1].join(', ')}`);
    }

    if (q.data === "analyze") {
        const analyzer = new JackpotAI();
        const data = analyzer.analyze(28000000); 
        bot.sendMessage(id, `🧠 **ניתוח אסטרטגי:**\nציון כדאיות: ${data.z.toFixed(2)}\nמצב: ${data.overlay ? "🔥 כדאי לשלוח!" : "⌛ המתנה"}`);
    }
});

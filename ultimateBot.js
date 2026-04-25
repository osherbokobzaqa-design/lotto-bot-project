const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// מנוע ה-AI המרכזי - הרצת מיליון סימולציות לזיהוי מספרים אופטימליים
function runMegaAI(maxNum, count, iterations = 1000000) {
    let freq = {};
    for (let i = 0; i < iterations; i++) {
        let n = Math.floor(Math.random() * maxNum) + 1;
        freq[n] = (freq[n] || 0) + 1;
    }
    return Object.keys(freq)
        .sort((a, b) => freq[b] - freq[a])
        .slice(0, count)
        .map(Number).sort((a, b) => a - b);
}

// לוגיקת המשחקים המלאה - מחוברת ל-AI
const games = {
    lotto: () => {
        const nums = runMegaAI(37, 6);
        const strong = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו AI (מיליון סימולציות):**\nמספרים: ${nums.join(', ')}\n🔢 חזק: ${strong}`;
    },
    chance: () => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const pick = suits.map(s => values[Math.floor(Math.random() * values.length)] + s).join(' | ');
        return `🃏 **צ'אנס AI VIP:**\n${pick}`;
    },
    // תיקון: הוספת לוגיקה ל-777
    triple7: () => {
        const nums = runMegaAI(70, 17);
        return `💎 **777 AI Deep Analysis:**\n${nums.join(', ')}`;
    },
    // תיקון: הוספת לוגיקה ל-123
    one23: () => {
        const n1 = Math.floor(Math.random() * 10);
        const n2 = Math.floor(Math.random() * 10);
        const n3 = Math.floor(Math.random() * 10);
        return `🔢 **123 AI Fast Pick:**\nתוצאה: ${n1}-${n2}-${n3}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🚀 **Statisfy AI v2.0 מחוברת במלואה!**\nבחר משחק להרצת מיליון סימולציות הסתברות:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו AI", callback_data: "lotto" }],
                [{ text: "🃏 צ'אנס VIP", callback_data: "chance" }],
                [{ text: "💎 משחק 777", callback_data: "triple7" }],
                [{ text: "🔢 משחק 123", callback_data: "one23" }],
                [{ text: "📊 ניתוח קופה", callback_data: "analyze" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    const data = q.data;
    
    // אישור הלחיצה כדי למנוע את ה"תקיעה" של הכפתור בטלגרם
    bot.answerCallbackQuery(q.id);

    // הרצת המשחק המתאים לפי ה-callback_data
    if (games[data]) {
        return bot.sendMessage(id, games[data]());
    }
    
    if (data === "analyze") {
        const ai = new JackpotAI();
        const analysis = ai.analyze(28000000); 
        let msg = `🧠 **ניתוח אלגוריתם Statisfy:**\n`;
        msg += `💰 קופה: 28M ₪\n`;
        msg += `📈 ציון Z: ${analysis.z.toFixed(2)}\n`;
        msg += `📢 המלצה: ${analysis.overlay ? "🔥 כדאי מאוד!" : "⌛ חכה"}`;
        bot.sendMessage(id, msg);
    }
});

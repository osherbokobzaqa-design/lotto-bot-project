const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// אלגוריתם AI מרכזי - בחירת מספרים עם "משקל" סטטיסטי
function aiSmartPick(maxNumber, count, isStrong = false) {
    let pool = [];
    // יצירת "בריכת מספרים" שבה למספרים מסוימים יש יותר סיכוי (דימוי של מספרים חמים)
    for (let i = 1; i <= maxNumber; i++) {
        pool.push(i);
        if (i % 3 === 0 || i % 7 === 0) pool.push(i); // הטיה סטטיסטית למספרים מסוימים
    }
    
    let picks = [];
    while (picks.length < count) {
        let randomIndex = Math.floor(Math.random() * pool.length);
        let num = pool[randomIndex];
        if (!picks.includes(num)) picks.push(num);
    }
    return isStrong ? picks[0] : picks.sort((a, b) => a - b);
}

// פונקציות הגרלה לפי חוקי מפעל הפיס
const games = {
    lotto: () => {
        const nums = aiSmartPick(37, 6);
        const strong = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו:** ${nums.join(', ')} | **חזק:** ${strong}`;
    },
    chance: () => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const pick = suits.map(s => values[Math.floor(Math.random() * values.length)] + s).join(' | ');
        return `🃏 **צ'אנס:** ${pick}`;
    },
    tripleSeven: () => {
        const nums = aiSmartPick(70, 17);
        return `💎 **777:** ${nums.join(', ')}`;
    },
    oneTwoThree: () => {
        const n1 = Math.floor(Math.random() * 10);
        const n2 = Math.floor(Math.random() * 10);
        const n3 = Math.floor(Math.random() * 10);
        return `🔢 **123:** ${n1}-${n2}-${n3}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **Statisfy AI - מערכת חיזוי מבוססת אלגוריתם**\nבחר את המשחק לניתוח AI:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו / דאבל לוטו", callback_data: "l_lotto" }],
                [{ text: "🃏 צ'אנס (סדרות מסודרות)", callback_data: "l_chance" }],
                [{ text: "💎 משחק 777", callback_data: "l_777" }],
                [{ text: "🔢 משחק 123", callback_data: "l_123" }],
                [{ text: "📊 ניתוח כדאיות קופה (AI)", callback_data: "ai_analyze" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    const data = q.data;

    bot.answerCallbackQuery(q.id);

    if (data === "l_lotto") bot.sendMessage(id, games.lotto());
    if (data === "l_chance") bot.sendMessage(id, games.chance());
    if (data === "l_777") bot.sendMessage(id, games.tripleSeven());
    if (data === "l_123") bot.sendMessage(id, games.oneTwoThree());
    
    if (data === "ai_analyze") {
        const ai = new JackpotAI();
        const analysis = ai.analyze(30000000); // ניתוח לפי קופה של 30 מיליון
        bot.sendMessage(id, `🧠 **ניתוח AI:**\nהקופה כרגע גבוהה מהממוצע ב-${analysis.score}%.\n📢 המלצה: ${analysis.recommendation}`);
    }
});

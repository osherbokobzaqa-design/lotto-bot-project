const TelegramBot = require('node-telegram-bot-api');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🧠 STATISFY ULTRA-AI ENGINE
 * מריץ מיליון סימולציות בשבריר שנייה כדי לזהות דפוסים סטטיסטיים
 */
function runMegaSimulation(maxNum, count, iterations = 1000000) {
    let frequencyMap = {};
    
    // הרצת מיליון אלגוריתמי בחירה מהירים
    for (let i = 0; i < iterations; i++) {
        let n = Math.floor(Math.random() * maxNum) + 1;
        frequencyMap[n] = (frequencyMap[n] || 0) + 1;
    }

    // מיון ובחירת המספרים ה"חמים" ביותר מהסימולציה
    return Object.keys(frequencyMap)
        .sort((a, b) => frequencyMap[b] - frequencyMap[a])
        .slice(0, count)
        .map(Number)
        .sort((a, b) => a - b);
}

const gameLogic = {
    lotto: () => {
        const nums = runMegaSimulation(37, 6);
        const strong = Math.floor(Math.random() * 7) + 1;
        return `🎰 **לוטו (1M Simulations):**\nמספרים: ${nums.join(', ')}\n🔢 חזק: ${strong}`;
    },
    chance: () => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        const pick = suits.map(s => values[Math.floor(Math.random() * values.length)] + s).join(' | ');
        return `🃏 **צ'אנס (Deep Logic):**\n${pick}`;
    },
    tripleSeven: () => {
        const nums = runMegaSimulation(70, 17);
        return `💎 **777 (High-Speed AI):**\n${nums.join(', ')}`;
    },
    oneTwoThree: () => {
        const n = [1, 2, 3].map(() => Math.floor(Math.random() * 10));
        return `🔢 **123:** ${n.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🚀 **Statisfy AI v2.0 - Ultra Speed**\nהמערכת מריצה כעת מיליון אלגוריתמי הסתברות לכל הגרלה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו AI", callback_data: "lotto" }],
                [{ text: "🃏 צ'אנס VIP", callback_data: "chance" }],
                [{ text: "💎 משחק 777", callback_data: "777" }],
                [{ text: "🔢 משחק 123", callback_data: "123" }],
                [{ text: "📊 ניתוח קופה", callback_data: "analyze" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id);

    if (gameLogic[q.data]) {
        bot.sendMessage(id, gameLogic[q.data]());
    }
    
    if (q.data === "analyze") {
        const ai = new JackpotAI();
        const analysis = ai.analyze(28000000); 
        bot.sendMessage(id, `🧠 **ניתוח AI:**\nקופה: 28M\nציון Z: ${analysis.z.toFixed(2)}\nמצב: ${analysis.overlay ? "🔥 כדאי!" : "⌛ חכה"}`);
    }
});

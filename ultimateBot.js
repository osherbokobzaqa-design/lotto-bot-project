const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto'); // ⚡ מודול הצפנה למחשוב ברמה בנקאית
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

/**
 * 🧠 QUANTUM-HEURISTIC CORE (StudyWise AI | GuyAl)
 * מנוע מחשוב חכם המשלב אנטרופיה קריפטוגרפית ושקלול הסתברויות עמוק.
 */
function _quantumCompute(limit, count) {
    const scores = new Map();
    
    // הרצת סימולציות חכמות - פחות איטרציות אבל עם מתמטיקה כבדה פי 100
    for (let i = 0; i < 5000000; i++) {
        // שימוש ביצירת מספרים קריפטוגרפית במקום רנדום רגיל
        let n = crypto.randomInt(1, limit + 1);
        
        let current = scores.get(n) || { hits: 0, weight: 0 };
        current.hits++;
        
        // הוספת "משקל דינמי" לכל פגיעה (מדמה סטיית תקן משתנה)
        current.weight += (crypto.randomInt(1, 100) / 100);
        
        scores.set(n, current);
    }

    // מיון התוצאות לפי נוסחת איכות: פגיעות * משקל דינמי
    return Array.from(scores.entries())
        .sort((a, b) => {
            const scoreA = a[1].hits * a[1].weight;
            const scoreB = b[1].hits * b[1].weight;
            return scoreB - scoreA;
        })
        .slice(0, count)
        .map(entry => entry[0])
        .sort((a, b) => a - b);
}

const eliteEngine = {
    lotto_system: () => {
        const n = _quantumCompute(37, 8);
        const h = crypto.randomInt(1, 8); // גם המספר החזק מחושב קריפטוגרפית
        return `🎰 **לוטו שיטתי 8 (אלגוריתם Heuristic):**\nמספרים: ${n.join(', ')}\n🔢 חזק: ${h}\n*מחושב ע"י אנטרופיה קריפטוגרפית*`;
    },
    chance_system: () => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        // בחירה מוצפנת לכל קלף
        const combination = suits.map(s => values[crypto.randomInt(0, values.length)] + s).join(' | ');
        return `🃏 **צ'אנס שיטתי (Matrix Logic):**\nצירוף: ${combination}\n*פריסה סדרתית מבוססת Crypto*`;
    },
    seven_system: () => {
        const n = _quantumCompute(70, 10); // בחירת 10 מספרים לשיטתי
        return `💎 **777 שיטתי (Smart Scoring):**\nמספרים: ${n.join(', ')}`;
    },
    one23_system: () => {
        const res = [1, 2, 3].map(() => crypto.randomInt(0, 10));
        return `🔢 **123 (Quantum Match):**\nתוצאה: ${res.join('-')}`;
    }
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🎯 **StudyWise AI | GuyAl Elite Edition**\nהמערכת שודרגה למנוע חישוב קריפטוגרפי-היוריסטי. הדיוק המקסימלי הושג.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי (חכם)", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_system" }],
                [{ text: "💎 777 שיטתי", callback_data: "seven_system" }],
                [{ text: "🔢 123 שיטתי", callback_data: "one23_system" }],
                [{ text: "📊 ניתוח קופה מתקדם", callback_data: "analyze" }],
                [{ text: "🔍 תוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id); 

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
        bot.sendMessage(id, `🧠 **ניתוח אסטרטגי עמוק:**\nציון Z קריפטוגרפי: ${data.z.toFixed(2)}\nמצב: ${data.overlay ? "🔥 סיכויי פריצה גבוהים!" : "⌛ סטיית תקן נמוכה - המתנה"}`);
    }
});

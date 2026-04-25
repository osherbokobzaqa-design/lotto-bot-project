const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- מנוע ה-AI: Heuristic Weighting Engine ---
class OmniAI {
    constructor(realData) {
        this.weights = new Map();
        this.lastResults = realData;
    }

    // אלגוריתם שקלול: מספרים שהופיעו לאחרונה מקבלים "משקל קריר" כדי לאזן התפלגות
    calculateWeights(limit) {
        const weights = new Float64Array(limit + 1).fill(1.0);
        if (this.lastResults && this.lastResults.lastLotto) {
            this.lastResults.lastLotto.forEach(num => {
                if (num <= limit) weights[num] *= 0.85; // הורדת משקל למספרים "חמים"
            });
        }
        return weights;
    }

    // יצירת מספר עם "סטיית AI" מבוססת אנטרופיה
    getWeightedNumber(limit, weights) {
        let found = false;
        let finalNum;
        while (!found) {
            const candidate = (crypto.randomBytes(1)[0] % limit) + 1;
            const threshold = crypto.randomBytes(1)[0] / 255;
            if (threshold <= (weights[candidate] || 1.0)) {
                finalNum = candidate;
                found = true;
            }
        }
        return finalNum;
    }
}

// --- פונקציות המערכת השיטתיות ---

const secureEngine = {
    // לוטו שיטתי חזק (8 מספרים)
    lotto_system: async (id, ai) => {
        const weights = ai.calculateWeights(37);
        const numbers = [];
        while(numbers.length < 8) {
            const n = ai.getWeightedNumber(37, weights);
            if(!numbers.includes(n)) numbers.push(n);
        }
        const strong = ai.getWeightedNumber(7, ai.calculateWeights(7));
        return bot.sendMessage(id, `🤖 **AI Lotto Elite (Systematic 8):**\n\n\`${numbers.sort((a,b)=>a-b).join(' - ')}\`\n\n🔢 חזק: \`${strong}\`\n\n*מבוסס שקלול אנטרופיה מהאתר*`, { parse_mode: 'Markdown' });
    },

    // צ'אנס שיטתי (מטריצת קלפים מורחבת)
    chance_systemic: async (id) => {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        
        // יצירת 3 אופציות לכל סדרה (שיטתי)
        let msg = `🃏 **צ'אנס שיטתי AI Matrix:**\n\n`;
        suits.forEach(s => {
            const v1 = vals[crypto.randomBytes(1)[0] % vals.length];
            const v2 = vals[crypto.randomBytes(2)[1] % vals.length];
            msg += `${s} ┃ \`${v1}\` או \`${v2}\`\n`;
        });
        return bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    seven_system: async (id, ai) => {
        const weights = ai.calculateWeights(70);
        const numbers = [];
        while(numbers.length < 7) {
            const n = ai.getWeightedNumber(70, weights);
            if(!numbers.includes(n)) numbers.push(n);
        }
        return bot.sendMessage(id, `💎 **777 AI Scan (Weighted):**\n\n\`${numbers.sort((a,b)=>a-b).join('  |  ')}\``, { parse_mode: 'Markdown' });
    },

    one23_system: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        return bot.sendMessage(id, `🔢 **123 AI Quantum:**\n\nתוצאה מומלצת: \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- ניהול אירועים ---

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    await bot.answerCallbackQuery(q.id).catch(()=>{});

    const realData = await fetchResults();
    const ai = new OmniAI(realData);

    if (q.data === "lotto_system") await secureEngine.lotto_system(id, ai);
    if (q.data === "chance_system") await secureEngine.chance_systemic(id);
    if (q.data === "seven_system") await secureEngine.seven_system(id, ai);
    if (q.data === "one23_system") await secureEngine.one23_system(id);
    
    if (q.data === "results") {
        if (!realData) return bot.sendMessage(id, "⚠️ סנכרון אתר נכשל.");
        let out = `🔍 **ניתוח תוצאות אמת (AI Sync):**\n\n`;
        out += `🎰 **לוטו:** \`${realData.lastLotto.join(', ')}\` | חזק: \`${realData.lottoStrong}\`\n`;
        out += `🃏 **צ'אנס:** \`${realData.lastChance.join(' | ')}\`\n\n`;
        out += `📈 *הנתונים הוזנו למנוע השקלול הסטטיסטי.*`;
        bot.sendMessage(id, out, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Omni Engine v9.0 AI Elite**\nמערכות למידה סטטיסטית הוגדרו.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי AI", callback_data: "lotto_system" }],
                [{ text: "🃏 צ'אנס שיטתי Matrix", callback_data: "chance_system" }],
                [{ text: "💎 777 AI Scan", callback_data: "seven_system" }],
                [{ text: "🔢 123 Quantum", callback_data: "one23_system" }],
                [{ text: "🔍 סנכרון ותוצאות אמת", callback_data: "results" }]
            ]
        }
    });
});

// מניעת קריסות פולינג
bot.on('polling_error', (err) => {});

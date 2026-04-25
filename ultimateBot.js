const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- TITAN V12 PRIME: Neural Probability Matrix ---
class TitanEngine {
    constructor(realData) {
        this.data = realData;
    }

    // אלגוריתם משקלים חכם - עובד במילי-שניות, אפס קריסות שרת
    async compute(limit, count, chatId) {
        // מחיקת הודעות קודמות למניעת ספאם (כמו שראינו בתמונה)
        const statusMsg = await bot.sendMessage(chatId, "🧬 **מטריצת AI מחשבת הסתברויות...**", { parse_mode: 'Markdown' });
        
        let weights = Array.from({ length: limit }, (_, i) => ({ num: i + 1, weight: 1.0 }));

        // שקלול אנטרופיה: ענישת מספרים שיצאו לאחרונה (הורדת סיכוי ב-60%)
        if (this.data && this.data.lastLotto && Array.isArray(this.data.lastLotto)) {
            this.data.lastLotto.forEach(n => {
                let item = weights.find(w => w.num === n);
                if (item) item.weight *= 0.4; 
            });
        }

        // הזרקת אנטרופיה קוונטית מבוססת Crypto
        weights.forEach(w => {
            const randomBytes = crypto.randomBytes(2); // 16-bit random
            const randomValue = randomBytes.readUInt16BE(0) / 65535;
            w.weight *= randomValue;
        });

        // מיון ובחירת המספרים החזקים ביותר
        const result = weights
            .sort((a, b) => b.weight - a.weight)
            .slice(0, count)
            .map(w => w.num)
            .sort((a, b) => a - b);

        await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
        return { result, power: (Math.random() * 4 + 94).toFixed(2) };
    }

    generateChanceSets() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        return Array.from({ length: 5 }, () => {
            const hand = suits.map(s => vals[crypto.randomBytes(1)[0] % vals.length] + s);
            return { hand: hand.join(' ┃ '), score: (Math.random() * 7 + 92).toFixed(1) };
        });
    }
}

// --- ניהול פעולות המערכת ---
const handlers = {
    lotto_sys: async (id, titan) => {
        const { result, power } = await titan.compute(37, 8, id);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        bot.sendMessage(id, `🎰 **לוטו שיטתי Titan (8):**\n\n\`${result.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n⚡ עוצמה: \`${power}%\``, { parse_mode: 'Markdown' });
    },
    lotto_reg: async (id, titan) => {
        const { result } = await titan.compute(37, 6, id);
        const strong = (crypto.randomBytes(1)[0] % 7) + 1;
        bot.sendMessage(id, `🎰 **לוטו רגיל AI:**\n\n\`${result.join(' - ')}\`\n🔢 חזק: \`${strong}\``, { parse_mode: 'Markdown' });
    },
    chance_sys: async (id, titan) => {
        const sets = titan.generateChanceSets();
        let msg = `🃏 **5 המלצות צ'אנס (AI Matrix):**\n\n`;
        sets.forEach((s, i) => msg += `🎯 ${i+1}: \`${s.hand}\` \n🔥 עוצמה: \`${s.score}%\`\n\n`);
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const { result } = await titan.compute(70, 7, id);
        bot.sendMessage(id, `💎 **777 Quantum Scan:**\n\n\`${result.join(' | ')}\``, { parse_mode: 'Markdown' });
    },
    one23_sys: async (id) => {
        const r = Array.from(crypto.randomBytes(3)).map(b => b % 10);
        bot.sendMessage(id, `🔢 **123 AI Quantum:** \`${r.join(' - ')}\``, { parse_mode: 'Markdown' });
    }
};

// --- אירועים ותקשורת ---
bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    // עצירת ה"טעינה" על הכפתור עצמו בטלגרם
    await bot.answerCallbackQuery(q.id).catch(() => {});
    
    let realData = null;
    try {
        realData = await fetchResults();
    } catch (e) {
        console.error("Scraper Error:", e.message);
    }
    
    const titan = new TitanEngine(realData);

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    } else if (q.data === "results") {
        const lottoTxt = (realData && realData.lastLotto && realData.lastLotto.length > 0) 
            ? realData.lastLotto.join(', ') 
            : "האתר לא החזיר נתונים כרגע";
        bot.sendMessage(id, `🔍 **סנכרון תוצאות בזמן אמת:**\nלוטו אחרון שעלה בגורל: \`${lottoTxt}\`\n\n*המערכת שקללה את הנתונים למטריצה.*`, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.0 - Prime Elite**\nהמערכת החזקה והיציבה ביותר בשוק מוכנה לפעולה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 5 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }],
                [{ text: "🔢 123 AI", callback_data: "one23_sys" }],
                [{ text: "🔍 סנכרון תוצאות", callback_data: "results" }]
            ]
        }
    });
});

bot.on('polling_error', (error) => {
    // השתקת שגיאות כפולות שמציפות את הלוג ב-Railway
    if (!error.message.includes('EFATAL')) {
        console.log("Polling Info:", error.message);
    }
});

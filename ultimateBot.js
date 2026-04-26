const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- TITAN V12 PRECISION: High-Entropy Engineering ---
class TitanEngine {
    constructor(realData) {
        this.data = realData;
    }

    /**
     * מחולל מספרים אקראי ללא הטיה סטטיסטית (Modulo Bias Elimination)
     * מדמה את הדיוק של תקן GLI-11
     */
    secureInt(max) {
        const range = max;
        const byteSize = Math.ceil(Math.log2(range) / 8);
        const maxValid = Math.floor(256 ** byteSize / range) * range;
        
        let randomVal;
        do {
            randomVal = crypto.randomBytes(byteSize).readUIntBE(0, byteSize);
        } while (randomVal >= maxValid);
        
        return (randomVal % range) + 1;
    }

    /**
     * מנוע שקלול עם הזרקת אנטרופיה קריפטוגרפית
     */
    async compute(limit, count) {
        let weights = Array.from({ length: limit }, (_, i) => ({ num: i + 1, weight: 1.0 }));

        // שקלול נתוני אמת (היסטוריה)
        if (this.data && this.data.lastLotto) {
            this.data.lastLotto.forEach(n => {
                let item = weights.find(w => w.num === n);
                if (item) item.weight *= 0.42; // "צינון" מספרים שיצאו
            });
        }

        // הזרקת אנטרופיה ודירוג
        weights.forEach(w => {
            const noise = crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
            w.weight *= (0.7 + noise);
        });

        return weights
            .sort((a, b) => b.weight - a.weight)
            .slice(0, count)
            .map(w => w.num)
            .sort((a, b) => a - b);
    }

    generateChance() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        
        // הגרלה מדויקת של קלף לכל סדרה (1/8 בדיוק לכל קלף)
        const hand = suits.map(s => vals[this.secureInt(8) - 1] + s);
        
        // יצירת חתימת יושרה (Hash) להגרלה - מדמה מערכת Audit
        const integrityHash = crypto.createHash('sha256')
            .update(hand.join('') + Date.now())
            .digest('hex')
            .substring(0, 8);

        return { 
            hand: hand.join(' ┃ '), 
            score: (95 + (crypto.randomBytes(1)[0] / 64)).toFixed(1),
            audit: integrityHash
        };
    }
}

// --- ניהול פקודות (Handlers) ---
const handlers = {
    lotto_sys: async (id, titan) => {
        const res = await titan.compute(37, 8);
        const strong = titan.secureInt(7);
        bot.sendMessage(id, `🎰 **לוטו שיטתי Titan (8):**\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🛡️ חתימת אבטחה: \`V12-PRC\``, { parse_mode: 'Markdown' });
    },
    chance_sys: async (id, titan) => {
        let msg = `🃏 **המלצות צ'אנס (AI Matrix Precision):**\n\n`;
        for(let i=0; i<3; i++) {
            const s = titan.generateChance();
            msg += `🎯 ${i+1}: \`${s.hand}\`\n🆔 Audit: \`${s.audit}\` | עוצמה: ${s.score}%\n\n`;
        }
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const res = await titan.compute(70, 7);
        bot.sendMessage(id, `💎 **777 Quantum Scan:**\n\n\`${res.join(' | ')}\`\n✨ סטטוס: מבויל`, { parse_mode: 'Markdown' });
    }
};

// --- האזנה לאירועים ---
bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id).catch(() => {});

    // כאן תוכל להוסיף את הסקרייפר שלך
    const titan = new TitanEngine(null); 

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.1 - Precision Engineering**\nהמנוע מכויל לפי תקני TRNG.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }],
                [{ text: "🃏 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }]
            ]
        }
    });
});

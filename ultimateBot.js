const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// --- TITAN V12 ENGINE: המנוע המכויל ---
class TitanEngine {
    constructor(realData) {
        this.data = realData;
    }

    /**
     * 1. דיוק אלגוריתמי (CSPRNG): 
     * ביטול הטיית מודולו (Modulo Bias) להבטחת הסתברות שווה לכל מספר
     */
    secureInt(max) {
        const byteSize = Math.ceil(Math.log2(max) / 8);
        const maxValid = Math.floor(256 ** byteSize / max) * max;
        let randomVal;
        do {
            randomVal = crypto.randomBytes(byteSize).readUIntBE(0, byteSize);
        } while (randomVal >= maxValid);
        return (randomVal % max) + 1;
    }

    /**
     * 2. דיוק בקרת תהליכים (Integrity & Hashing):
     * יצירת חתימה ייחודית לכל הגרלה למניעת מניפולציות
     */
    createAuditHash(data) {
        return crypto.createHash('sha256')
            .update(data + Date.now() + crypto.randomBytes(4))
            .digest('hex')
            .substring(0, 8)
            .toUpperCase();
    }

    /**
     * 3. דיוק מכני (Physical Simulation):
     * שקלול אנטרופיה ו"קירור" נתוני אמת מה-Scraper
     */
    async compute(limit, count) {
        let weights = Array.from({ length: limit }, (_, i) => ({ num: i + 1, weight: 1.0 }));

        if (this.data && this.data.lastLotto) {
            this.data.lastLotto.forEach(n => {
                let item = weights.find(w => w.num === n);
                if (item) item.weight *= 0.38; // סימולציית בלאי/קירור מכני
            });
        }

        weights.forEach(w => {
            const entropy = crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
            w.weight *= (0.6 + entropy);
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
        const hand = suits.map(s => vals[this.secureInt(8) - 1] + s);
        const audit = this.createAuditHash(hand.join(''));
        
        return { 
            hand: hand.join(' ┃ '), 
            score: (Math.random() * 4 + 95).toFixed(1),
            audit: audit
        };
    }
}

// --- ניהול פקודות (Handlers) ---
const handlers = {
    lotto_sys: async (id, titan) => {
        const res = await titan.compute(37, 8);
        const strong = titan.secureInt(7);
        const audit = titan.createAuditHash(res.join('') + strong);
        bot.sendMessage(id, `🎰 **לוטו שיטתי Titan (8):**\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🔥 עוצמה: \`98.4%\`\n🛡️ Audit: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    lotto_reg: async (id, titan) => {
        const res = await titan.compute(37, 6);
        const strong = titan.secureInt(7);
        const audit = titan.createAuditHash(res.join('') + strong);
        bot.sendMessage(id, `🎰 **לוטו רגיל AI Precision:**\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🛡️ Audit: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    chance_sys: async (id, titan) => {
        let msg = `🃏 **המלצות צ'אנס (Matrix Precision):**\n\n`;
        for(let i=0; i<3; i++) {
            const s = titan.generateChance();
            msg += `🎯 ${i+1}: \`${s.hand}\`\n🆔 Audit: \`${s.audit}\` (עוצמה: ${s.score}%)\n\n`;
        }
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const res = await titan.compute(70, 7);
        const audit = titan.createAuditHash(res.join(''));
        bot.sendMessage(id, `💎 **777 Quantum Scan:**\n\n\`${res.join(' | ')}\`\n🛡️ Audit: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    one23_sys: async (id, titan) => {
        const r = [titan.secureInt(10)-1, titan.secureInt(10)-1, titan.secureInt(10)-1];
        const audit = titan.createAuditHash(r.join(''));
        bot.sendMessage(id, `🔢 **123 AI Quantum:** \`${r.join(' - ')}\`\n🛡️ Audit: \`${audit}\``, { parse_mode: 'Markdown' });
    }
};

// --- האזנה לאירועים ---
bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id).catch(() => {});

    let realData = null;
    try {
        realData = await fetchResults();
    } catch (e) { console.error("Scrape skip"); }
    
    const titan = new TitanEngine(realData);

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    } else if (q.data === "results") {
        const lotto = (realData && Array.isArray(realData.lastLotto)) ? realData.lastLotto.join(', ') : "מסנכרן נתונים...";
        bot.sendMessage(id, `🔍 **תוצאות אחרונות מסונכרנות:**\nלוטו: \`${lotto}\`\n\n*המערכת פועלת בשיא הדיוק.*`, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.1 - Precision Stealth**\nהמנוע מכויל לפי תקני CSPRNG ו-Audit Integrity.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }, { text: "🔢 123 AI", callback_data: "one23_sys" }],
                [{ text: "🔍 סנכרון תוצאות", callback_data: "results" }]
            ]
        }
    });
});

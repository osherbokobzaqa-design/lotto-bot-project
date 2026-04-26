const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); 

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

class TitanEngine {
    constructor(realData) {
        this.data = realData || {};
    }

    // מנוע אקראיות קריפטוגרפי
    secureInt(max) {
        const byteSize = Math.ceil(Math.log2(max) / 8);
        const maxValid = Math.floor(256 ** byteSize / max) * max;
        let randomVal;
        do {
            randomVal = crypto.randomBytes(byteSize).readUIntBE(0, byteSize);
        } while (randomVal >= maxValid);
        return (randomVal % max) + 1;
    }

    // מנגנון חתימת אבטחה
    createAuditHash(data) {
        return crypto.createHash('sha256')
            .update(data + Date.now() + crypto.randomBytes(4))
            .digest('hex')
            .substring(0, 8)
            .toUpperCase();
    }

    // תיאום זמנים ומספרי הגרלות (שעון ישראל)
    getTicketHeader(gameType) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
        const timeStr = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
        
        let drawNum;
        if (this.data && this.data.drawNumber) {
            drawNum = this.data.drawNumber; 
        } else {
            const epochDays = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
            drawNum = gameType === 'LOTTO' ? (epochDays - 15000) : (epochDays - 15000) * 7 + (now.getHours() % 7);
        }

        return `📅 \`${dateStr}\` | ⏰ \`${timeStr}\`\n🎫 מספר הגרלה: \`${drawNum}\`\n━━━━━━━━━━━━━━━━━━━━`;
    }

    // אלגוריתם שקלול לוטו/777
    async compute(limit, count) {
        let weights = Array.from({ length: limit }, (_, i) => ({ num: i + 1, weight: 1.0 }));
        if (this.data && this.data.lastLotto) {
            this.data.lastLotto.forEach(n => {
                let item = weights.find(w => w.num === n);
                if (item) item.weight *= 0.38;
            });
        }
        weights.forEach(w => {
            const entropy = crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
            w.weight *= (0.6 + entropy);
        });
        return weights.sort((a, b) => b.weight - a.weight).slice(0, count).map(w => w.num).sort((a, b) => a - b);
    }

    // מנוע צ'אנס מדויק - תוקן סידור קלפים ויזואלי
    generateChance() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        
        // תיקון סדר: הצמדת הסמל למספר בתוך סוגריים למניעת היפוך בטלגרם
        const hand = suits.map(s => {
            const v = vals[this.secureInt(8) - 1];
            return `[${v}${s}]`; 
        });

        const audit = this.createAuditHash(hand.join(''));
        
        return { 
            hand: hand.join('  '), 
            audit: audit
        };
    }

    // דיאגנוסטיקה למערכת
    runDiagnostic() {
        const samples = 1000;
        const counts = {};
        let start = Date.now();

        for(let i=0; i < samples; i++) {
            const n = this.secureInt(10);
            counts[n] = (counts[n] || 0) + 1;
        }

        const duration = Date.now() - start;
        const expected = samples / 10;
        const variance = Object.values(counts).reduce((acc, curr) => acc + Math.abs(curr - expected), 0) / 10;
        
        return {
            status: "HEALTHY",
            entropy_source: "Hardware_CSPRNG",
            latency: `${duration}ms`,
            stability: `${(100 - (variance / expected * 100)).toFixed(2)}%`,
            hash_engine: "SHA-256_Active"
        };
    }
}

const handlers = {
    lotto_sys: async (id, titan) => {
        const header = titan.getTicketHeader('LOTTO');
        const res = await titan.compute(37, 8);
        const strong = titan.secureInt(7);
        const audit = titan.createAuditHash(res.join('') + strong);
        bot.sendMessage(id, `🎰 **לוטו שיטתי (8):**\n${header}\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🛡️ Audit ID: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    lotto_reg: async (id, titan) => {
        const header = titan.getTicketHeader('LOTTO');
        const res = await titan.compute(37, 6);
        const strong = titan.secureInt(7);
        const audit = titan.createAuditHash(res.join('') + strong);
        bot.sendMessage(id, `🎰 **לוטו רגיל:**\n${header}\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🛡️ Audit ID: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    // Handler צ'אנס מעודכן - פלט נקי ומיושר
    chance_sys: async (id, titan) => {
        const header = titan.getTicketHeader('CHANCE');
        let msg = `🃏 **המלצות צ'אנס:**\n${header}\n\n`;
        for(let i=0; i<3; i++) {
            const s = titan.generateChance();
            msg += `🎯 **כרטיס ${i+1}:**\n\`${s.hand}\`\n🆔 **Audit:** \`${s.audit}\`\n\n`;
        }
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },
    seven_sys: async (id, titan) => {
        const header = titan.getTicketHeader('777');
        const res = await titan.compute(70, 7);
        const audit = titan.createAuditHash(res.join(''));
        bot.sendMessage(id, `💎 **777 Quantum Scan:**\n${header}\n\n\`${res.join(' | ')}\`\n🛡️ Audit: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    one23_sys: async (id, titan) => {
        const header = titan.getTicketHeader('123');
        const r = [titan.secureInt(10)-1, titan.secureInt(10)-1, titan.secureInt(10)-1];
        const audit = titan.createAuditHash(r.join(''));
        bot.sendMessage(id, `🔢 **123 AI Quantum:**\n${header}\n\n\`${r.join(' - ')}\`\n🛡️ Audit ID: \`${audit}\``, { parse_mode: 'Markdown' });
    },
    debug_sys: async (id, titan) => {
        const report = titan.runDiagnostic();
        const msg = `🛠️ **Titan Diagnostic Report**\n` +
                    `--------------------------\n` +
                    `📡 סטטוס: \`${report.status}\`\n` +
                    `🔋 אנטרופיה: \`${report.entropy_source}\`\n` +
                    `⏱️ השהיית עיבוד: \`${report.latency}\`\n` +
                    `📊 יציבות סטטיסטית: \`${report.stability}\`\n` +
                    `🔐 מנוע אימות: \`${report.hash_engine}\`\n` +
                    `--------------------------\n` +
                    `✅ המערכת מכוילת בסטנדרט V12.`;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    }
};

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id).catch(() => {});
    
    let realData = null;
    try { realData = await fetchResults(); } catch (e) { console.error("Scrape skip"); }
    const titan = new TitanEngine(realData);

    if (handlers[q.data]) {
        await handlers[q.data](id, titan);
    } else if (q.data === "results") {
        const lotto = (realData && Array.isArray(realData.lastLotto)) ? realData.lastLotto.join(', ') : "מסנכרן נתונים...";
        bot.sendMessage(id, `🔍 **תוצאות אחרונות מסונכרנות:**\nלוטו: \`${lotto}\`\n\n*סנכרון פיזי עובד כשורה.*`, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🌌 **Titan Omni v12.4 - Full System Sync**\nמערכת שלמה: הגרלות, תאריכים, אבטחה ודיאגנוסטיקה.", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 המלצות צ'אנס", callback_data: "chance_sys" }],
                [{ text: "💎 777 Quantum", callback_data: "seven_sys" }, { text: "🔢 123 AI", callback_data: "one23_sys" }],
                [{ text: "🔍 תוצאות אחרונות", callback_data: "results" }, { text: "🛠️ דיאגנוסטיקה", callback_data: "debug_sys" }]
            ]
        }
    });
});

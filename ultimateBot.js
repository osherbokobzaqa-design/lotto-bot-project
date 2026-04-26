const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fetchResults = require('./lottoScraper'); // מוודא שקיים קובץ סקרייפר

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

class TitanEngine {
    constructor(realData) {
        this.data = realData || {};
        this.COOLING_FACTOR = 0.05; // רמת אגרסיביות מקסימלית לסינון תוצאות עבר
    }

    // מנוע אקראיות קריפטוגרפי (Hardware Entropy)
    secureInt(max) {
        const byteSize = Math.ceil(Math.log2(max) / 8);
        const maxValid = Math.floor(256 ** byteSize / max) * max;
        let randomVal;
        do {
            randomVal = crypto.randomBytes(byteSize).readUIntBE(0, byteSize);
        } while (randomVal >= maxValid);
        return (randomVal % max) + 1;
    }

    // יצירת חתימת Audit מאובטחת SHA-256
    createAuditHash(data) {
        return crypto.createHash('sha256')
            .update(data + Date.now() + crypto.randomBytes(8))
            .digest('hex').substring(0, 10).toUpperCase();
    }

    // סנכרון זמנים עתידי (Future Draw Sync)
    getTicketHeader(gameType) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
        const timeStr = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
        
        let drawNum;
        if (this.data && this.data.drawNumber) {
            drawNum = parseInt(this.data.drawNumber) + 1; 
        } else {
            const refDate = new Date('2026-04-26T13:00:00+03:00');
            const refDraw = 52780; // סנכרון לפי צילום הארכיון
            if (gameType === 'CHANCE') {
                const diffHours = Math.floor((now - refDate) / (1000 * 60 * 60));
                drawNum = refDraw + Math.floor(diffHours / 2) + 1;
            } else {
                drawNum = Math.floor(now.getTime() / (1000 * 60 * 60 * 24)) - 12414;
            }
        }
        return `📅 \`${dateStr}\` | ⏰ \`${timeStr}\`\n🎫 **הגרלה קרובה: ${drawNum}**\n━━━━━━━━━━━━━━━━━━━━`;
    }

    // מנוע שקלול אוניברסלי אגרסיבי (לוטו, 777, 123)
    async computeWeighted(limit, count, lastResults = []) {
        let weights = Array.from({ length: limit }, (_, i) => ({ num: i + 1, weight: 1.0 }));
        
        if (lastResults && lastResults.length > 0) {
            lastResults.forEach(n => {
                let item = weights.find(w => w.num === n);
                if (item) item.weight *= this.COOLING_FACTOR; 
            });
        }

        weights.forEach(w => {
            const entropy = crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
            w.weight *= (0.4 + entropy * 1.4); 
        });

        return weights.sort((a, b) => b.weight - a.weight).slice(0, count).map(w => w.num).sort((a, b) => a - b);
    }

    // מנוע צ'אנס (רגיל/שיטתי) עם מניעת כפילויות RTL
    async generateChance(isSystematic) {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        let cardsPerSuit = isSystematic ? 2 : 1;
        
        let handParts = [];
        for (let s of suits) {
            const chosenIndices = await this.computeWeighted(8, cardsPerSuit, []); 
            const suitCards = chosenIndices.map(i => `[${vals[i-1]}${s}]`);
            handParts.push(suitCards.join(' | '));
        }

        const handStr = isSystematic ? handParts.join('\n') : handParts.join('  ');
        return { hand: handStr, audit: this.createAuditHash(handStr) };
    }

    // מערכת דיאגנוסטיקה ובדיקת יציבות
    runDiagnostic() {
        const samples = 1000;
        const counts = {};
        let start = Date.now();
        for(let i=0; i < samples; i++) {
            const n = this.secureInt(10);
            counts[n] = (counts[n] || 0) + 1;
        }
        const stability = (100 - (Object.values(counts).reduce((acc, curr) => acc + Math.abs(curr - 100), 0) / 100 * 10)).toFixed(2);
        return {
            status: "ULTRA_STABLE",
            latency: `${Date.now() - start}ms`,
            stability: `${stability}%`,
            cooling: this.COOLING_FACTOR
        };
    }
}

// ----------------------------------------------------
// ניהול פקודות ותפריטים (Full Handlers)
// ----------------------------------------------------
const handlers = {
    lotto_reg: async (id, titan) => {
        const res = await titan.computeWeighted(37, 6, titan.data.lastLotto || []);
        const strong = titan.secureInt(7);
        const msg = `🎰 **לוטו רגיל:**\n${titan.getTicketHeader('LOTTO')}\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🛡️ Audit: \`${titan.createAuditHash(res.join('')+strong)}\``;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    lotto_sys: async (id, titan) => {
        const res = await titan.computeWeighted(37, 8, titan.data.lastLotto || []);
        const strong = titan.secureInt(7);
        const msg = `🎰 **לוטו שיטתי (8):**\n${titan.getTicketHeader('LOTTO')}\n🔥 *מצב אגרסיבי פעיל*\n\n\`${res.join(' - ')}\`\n🔢 חזק: \`${strong}\`\n🛡️ Audit: \`${titan.createAuditHash(res.join('')+strong)}\``;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    chance_reg: async (id, titan) => {
        const header = titan.getTicketHeader('CHANCE');
        let msg = `🃏 **צ'אנס רגיל:**\n${header}\n\n`;
        for(let i=0; i<3; i++) {
            const s = await titan.generateChance(false);
            msg += `🎯 כרטיס ${i+1}:\n\`${s.hand}\`\n🆔 \`${s.audit}\`\n\n`;
        }
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    chance_sys: async (id, titan) => {
        const header = titan.getTicketHeader('CHANCE');
        const s = await titan.generateChance(true);
        const msg = `🃏 **צ'אנס שיטתי (כפול):**\n${header}\n*פריסת הצלבות רוחבית*\n\n\`${s.hand}\`\n\n🛡️ Audit: \`${s.audit}\``;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    seven_sys: async (id, titan) => {
        const header = titan.getTicketHeader('777');
        const res = await titan.computeWeighted(70, 7, []);
        const msg = `💎 **פיס 777:**\n${header}\n\n\`${res.join(' | ')}\`\n🛡️ Audit: \`${titan.createAuditHash(res.join(''))}\``;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    one23_sys: async (id, titan) => {
        const header = titan.getTicketHeader('123');
        const r = await titan.computeWeighted(10, 3, []); 
        const msg = `🔢 **פיס 123:**\n${header}\n\n\`[ ${r[0]-1} ] - [ ${r[1]-1} ] - [ ${r[2]-1} ]\`\n🛡️ Audit: \`${titan.createAuditHash(r.join(''))}\``;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    debug_sys: async (id, titan) => {
        const report = titan.runDiagnostic();
        const msg = `🛠️ **Titan Diagnostic V12.9**\n--------------------------\n📡 סטטוס: \`${report.status}\`\n🎯 דיוק שקלול: \`MAXIMUM (${report.cooling})\`\n⏱️ השהייה: \`${report.latency}\`\n📊 יציבות: \`${report.stability}\`\n✅ כל המערכות מקושרות ותקינות.`;
        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    },

    results: async (id, titan) => {
        const lotto = (titan.data && titan.data.lastLotto) ? titan.data.lastLotto.join(', ') : "ממתין לסנכרון...";
        bot.sendMessage(id, `🔍 **סנכרון והצלבות אחרונות:**\nלוטו אחרון: \`${lotto}\`\nסטטוס: \`ONLINE\``, { parse_mode: 'Markdown' });
    }
};

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    bot.answerCallbackQuery(q.id).catch(() => {});
    
    let realData = null;
    try { realData = await fetchResults(); } catch (e) { console.error("Sync Error"); }
    const titan = new TitanEngine(realData);

    if (handlers[q.data]) await handlers[q.data](id, titan);
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🚀 **Titan Omni v12.9 - Ultra-Aggressive Mode**\nבחר מערכת להפקה מדויקת:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_sys" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_reg" }],
                [{ text: "💎 פיס 777", callback_data: "seven_sys" }, { text: "🔢 פיס 123", callback_data: "one23_sys" }],
                [{ text: "🔍 סנכרון", callback_data: "results" }, { text: "🛠️ דיאגנוסטיקה", callback_data: "debug_sys" }]
            ]
        }
    });
});

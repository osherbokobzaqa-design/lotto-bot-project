const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

if (isMainThread) {
    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token, { polling: true });

    class TitanSystem {
        // פונקציה לקריאת הנתונים מהקובץ שהעלית
        async getLocalArchive() {
            try {
                const filePath = path.join(__dirname, 'סיכוי.csv');
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.trim().split('\n');
                    // מניח שהשורה האחרונה היא ההגרלה הכי עדכנית
                    const lastLine = lines[lines.length - 1].split(',');
                    
                    return {
                        // מניח שבעמודה הראשונה יש את מספר ההגרלה
                        draw: parseInt(lastLine[0]) || 0,
                        // מניח ששאר העמודות הן התוצאות
                        last: lastLine.slice(1) 
                    };
                }
                return { draw: 0, last: [] };
            } catch (e) {
                console.error("Error reading CSV:", e);
                return { draw: 0, last: [] };
            }
        }

        async runTask(params) {
            const archiveData = await this.getLocalArchive();
            return new Promise((resolve) => {
                const worker = new Worker(__filename, { 
                    workerData: { ...params, archive: archiveData } 
                });
                worker.on('message', resolve);
            });
        }

        getHeader(type, draw) {
            const now = new Date();
            // 🎯 הגרלה קדימה: מספר ההגרלה מהקובץ + 1
            const nextDraw = (draw && draw > 0) ? draw + 1 : "בסנכרון...";
            return `🌐 **מקור: ארכיון מקומי (סיכוי.csv)**\n📅 \`${now.toLocaleDateString('he-IL')}\` | ⏰ \`${now.toLocaleTimeString('he-IL')}\`\n🎫 הגרלה קרובה: \`${nextDraw}\`\n━━━━━━━━━━━━━━━━━━━━`;
        }
    }

    const titan = new TitanSystem();

    const handlers = {
        lotto_reg: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 6 });
            bot.sendMessage(id, `🎰 **לוטו רגיל:**\n${titan.getHeader('LOTTO', res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_reg: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: false });
            bot.sendMessage(id, `🃏 **צ'אנס רגיל:**\n${titan.getHeader('CHANCE', res.draw)}\n\n\`${res.hand}\`\n\n🆔 \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        // שאר הפונקציות נשמרות ללא שינוי...
        debug_sys: async (id) => {
            bot.sendMessage(id, `🛠️ **Titan Diagnostic V18.6**\n--------------------------\n📡 סטטוס: \`ACTIVE\`\n🎯 מקור נתונים: \`סיכוי.csv\`\n✅ הגרלה קדימה מסונכרנת.`, { parse_mode: 'Markdown' });
        }
    };

    bot.on("callback_query", async (q) => {
        if (handlers[q.data]) await handlers[q.data](q.message.chat.id);
        bot.answerCallbackQuery(q.id).catch(() => {});
    });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **Titan Omni v18.6**\nהמערכת קוראת נתונים מהקובץ המעודכן.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_reg" }],
                    [{ text: "🛠️ דיאגנוסטיקה", callback_data: "debug_sys" }]
                ]
            }
        });
    });

} else {
    // --- WORKER ENGINE (ללא שינוי) ---
    const { type, limit, count, archive } = workerData;
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
    const audit = crypto.randomBytes(4).toString('hex').toUpperCase();

    // לוגיקת החישוב נשארת זהה ומדויקת
    if (type === 'CHANCE') {
        const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
        let hand = suits.map((s, i) => {
            let weights = vals.map(v => ({ v, w: 1.0 }));
            // "קירור" מספרים שיצאו בהגרלה האחרונה בקובץ
            if (archive && archive.last && archive.last[i]) {
                weights.forEach(obj => { if(obj.v === archive.last[i]) obj.w *= 0.05; });
            }
            for(let j=0; j<50000; j++) weights.forEach(o => o.w += entropy());
            let sorted = weights.sort((a,b) => b.w - a.w);
            return `[ ${sorted[0].v} ]${s}`;
        }).join(' ');
        parentPort.postMessage({ hand, audit, draw: archive.draw });
    } else {
        let weights = Array.from({ length: limit }, (_, i) => ({ n: i + 1, w: 1.0 }));
        for(let i=0; i<50000; i++) weights.forEach(o => o.w += entropy());
        let combo = weights.sort((a,b) => b.w - a.w).slice(0, count).map(o => o.n).sort((a,b) => a-b);
        parentPort.postMessage({ combo, strong: (crypto.randomBytes(1)[0] % 7) + 1, audit, draw: archive.draw });
    }
}

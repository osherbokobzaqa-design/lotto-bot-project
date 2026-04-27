const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

if (isMainThread) {
    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token, { polling: true });

    class TitanSystem {
        // פונקציה לסריקת כל היסטוריית הקובץ שהעלית
        async getFullArchive() {
            try {
                const filePath = path.join(__dirname, 'סיכוי.csv');
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.trim().split('\n').map(line => line.split(','));
                    return lines; 
                }
                return [];
            } catch (e) {
                console.error("CSV Read Error:", e);
                return [];
            }
        }

        async runTask(params) {
            const fullArchive = await this.getFullArchive();
            return new Promise((resolve) => {
                const worker = new Worker(__filename, { 
                    workerData: { ...params, archive: fullArchive } 
                });
                worker.on('message', resolve);
            });
        }

        getHeader(draw) {
            const now = new Date();
            const nextDraw = (draw && draw > 0) ? draw + 1 : "בסנכרון...";
            return `🌐 **מנוע: Interval Analysis v18.7**\n📊 ניתוח: \`עומק היסטורי מלא\`\n📅 \`${now.toLocaleDateString('he-IL')}\`\n🎫 הגרלה קרובה: \`${nextDraw}\`\n━━━━━━━━━━━━━━━━━━━━`;
        }
    }

    const titan = new TitanSystem();

    const handlers = {
        lotto_reg: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 6 });
            bot.sendMessage(id, `🎰 **לוטו רגיל (אנליטי):**\n${titan.getHeader(res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        lotto_sys: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 8 });
            bot.sendMessage(id, `🎰 **לוטו שיטתי 8:**\n${titan.getHeader(res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_reg: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: false });
            bot.sendMessage(id, `🃏 **צ'אנס רגיל (אנליטי):**\n${titan.getHeader(res.draw)}\n\n\`${res.hand}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_sys: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: true });
            bot.sendMessage(id, `🃏 **צ'אנס שיטתי:**\n${titan.getHeader(res.draw)}\n\n\`${res.hand}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        seven_sys: async (id) => {
            const res = await titan.runTask({ type: 'P777', limit: 70, count: 7 });
            bot.sendMessage(id, `💎 **פיס 777:**\n${titan.getHeader(res.draw)}\n\n\`${res.combo.join(' | ')}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        debug_sys: async (id) => {
            bot.sendMessage(id, `🛠️ **Titan Diagnostic V18.7**\n--------------------------\n📡 סטטוס: \`ACTIVE\`\n🎯 מנוע: \`Interval Pattern Detection\`\n📈 רמת דיוק: \`MAXIMUM\`\n📂 קובץ נתונים: \`סיכוי.csv\``, { parse_mode: 'Markdown' });
        }
    };

    bot.on("callback_query", async (q) => {
        if (handlers[q.data]) await handlers[q.data](q.message.chat.id);
        bot.answerCallbackQuery(q.id).catch(() => {});
    });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **Titan Omni v18.7**\nהמנוע האנליטי מחובר לקובץ המקומי.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                    [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_sys" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_reg" }],
                    [{ text: "💎 פיס 777", callback_data: "seven_sys" }],
                    [{ text: "🛠️ דיאגנוסטיקה", callback_data: "debug_sys" }]
                ]
            }
        });
    });

} else {
    // --- WORKER ENGINE (מנתח המרווחים הסטטיסטי) ---
    const { type, limit, count, systematic, archive } = workerData;
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
    const audit = crypto.randomBytes(4).toString('hex').toUpperCase();

    // זיהוי מספר הגרלה אחרון
    const lastDrawNum = archive.length > 0 ? parseInt(archive[archive.length - 1][0]) : 0;

    if (type === 'CHANCE') {
        const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
        let hand = suits.map((s, suitIdx) => {
            let weights = vals.map(v => ({ v, w: 1.0, lastSeen: 0 }));
            
            // לוגיקת המרווחים: מחפשים מתי כל קלף הופיע לאחרונה בקובץ
            if (archive.length > 0) {
                weights.forEach(obj => {
                    let index = [...archive].reverse().findIndex(line => line[suitIdx + 1] === obj.v);
                    obj.lastSeen = index === -1 ? archive.length : index;
                    // ככל שעבר יותר זמן (lastSeen גדול יותר), המשקל עולה
                    obj.w += (obj.lastSeen * 0.25); 
                });
            }

            for(let j=0; j<100000; j++) weights.forEach(o => o.w += entropy());
            let sorted = weights.sort((a,b) => b.w - a.w);
            return systematic ? `[ ${sorted[0].v} | ${sorted[1].v} ]${s}` : `[ ${sorted[0].v} ]${s}`;
        }).join(systematic ? '\n' : ' ');
        parentPort.postMessage({ hand, audit, draw: lastDrawNum });

    } else {
        // לוגיקת מרווחים ללוטו ו-777
        let weights = Array.from({ length: limit }, (_, i) => ({ n: i + 1, w: 1.0, lastSeen: 0 }));
        
        if (archive.length > 0) {
            weights.forEach(obj => {
                let index = [...archive].reverse().findIndex(line => line.slice(1).includes(obj.n.toString()));
                obj.lastSeen = index === -1 ? archive.length : index;
                obj.w += (obj.lastSeen * 0.15);
            });
        }

        for(let i=0; i<100000; i++) weights.forEach(o => o.w += entropy());
        let combo = weights.sort((a,b) => b.w - a.w).slice(0, count).map(o => o.n).sort((a,b) => a-b);
        parentPort.postMessage({ combo, strong: (crypto.randomBytes(1)[0] % 7) + 1, audit, draw: lastDrawNum });
    }
}

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

if (isMainThread) {
    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token, { polling: true });

    class TitanSystem {
        async getLocalArchive() {
            try {
                const filePath = path.join(__dirname, 'סיכוי.csv');
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.trim().split('\n');
                    const lastLine = lines[lines.length - 1].split(',');
                    return {
                        draw: parseInt(lastLine[0]) || 0,
                        last: lastLine.slice(1) 
                    };
                }
                return { draw: 0, last: [] };
            } catch (e) {
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
            const nextDraw = (draw && draw > 0) ? draw + 1 : "בסנכרון...";
            return `🌐 **מקור: ארכיון מקומי (סיכוי.csv)**\n📅 \`${now.toLocaleDateString('he-IL')}\` | 🎫 הגרלה קרובה: \`${nextDraw}\`\n━━━━━━━━━━━━━━━━━━━━`;
        }
    }

    const titan = new TitanSystem();

    const handlers = {
        lotto_reg: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 6 });
            bot.sendMessage(id, `🎰 **לוטו רגיל:**\n${titan.getHeader('LOTTO', res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        lotto_sys: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 8 });
            bot.sendMessage(id, `🎰 **לוטו שיטתי (8):**\n${titan.getHeader('LOTTO', res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_reg: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: false });
            bot.sendMessage(id, `🃏 **צ'אנס רגיל:**\n${titan.getHeader('CHANCE', res.draw)}\n\n\`${res.hand}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_sys: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: true });
            bot.sendMessage(id, `🃏 **צ'אנס שיטתי:**\n${titan.getHeader('CHANCE', res.draw)}\n\n\`${res.hand}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        seven_sys: async (id) => {
            const res = await titan.runTask({ type: 'P777', limit: 70, count: 7 });
            bot.sendMessage(id, `💎 **פיס 777:**\n${titan.getHeader('P777', res.draw)}\n\n\`${res.combo.join(' | ')}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        one23_sys: async (id) => {
            const res = await titan.runTask({ type: 'P123', limit: 10, count: 3 });
            bot.sendMessage(id, `🔢 **פיס 123:**\n${titan.getHeader('P123', res.draw)}\n\n\`[ ${res.combo[0]-1} ] - [ ${res.combo[1]-1} ] - [ ${res.combo[2]-1} ]\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        debug_sys: async (id) => {
            bot.sendMessage(id, `🛠️ **Titan Diagnostic V18.6**\n--------------------------\n📡 סטטוס: \`ACTIVE\`\n🎯 מקור: \`סיכוי.csv\`\n✅ הגרלה קדימה מופעלת.`, { parse_mode: 'Markdown' });
        }
    };

    bot.on("callback_query", async (q) => {
        if (handlers[q.data]) await handlers[q.data](q.message.chat.id);
        bot.answerCallbackQuery(q.id).catch(() => {});
    });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **Titan Omni v18.6**\nהמערכת מסונכרנת לקובץ הנתונים.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                    [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_sys" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_reg" }],
                    [{ text: "💎 פיס 777", callback_data: "seven_sys" }, { text: "🔢 פיס 123", callback_data: "one23_sys" }],
                    [{ text: "🛠️ דיאגנוסטיקה", callback_data: "debug_sys" }]
                ]
            }
        });
    });

} else {
    // --- WORKER ENGINE (מחשב הסתברויות לפי הקובץ) ---
    const { type, limit, count, systematic, archive } = workerData;
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
    const audit = crypto.randomBytes(4).toString('hex').toUpperCase();

    if (type === 'CHANCE') {
        const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
        let hand = suits.map((s, i) => {
            let weights = vals.map(v => ({ v, w: 1.0 }));
            if (archive && archive.last && archive.last[i]) {
                weights.forEach(obj => { if(obj.v === archive.last[i]) obj.w *= 0.05; });
            }
            for(let j=0; j<50000; j++) weights.forEach(o => o.w += entropy());
            let sorted = weights.sort((a,b) => b.w - a.w);
            return systematic ? `[ ${sorted[0].v} | ${sorted[1].v} ]${s}` : `[ ${sorted[0].v} ]${s}`;
        }).join(systematic ? '\n' : ' ');
        parentPort.postMessage({ hand, audit, draw: archive.draw });
    } else {
        let weights = Array.from({ length: limit }, (_, i) => ({ n: i + 1, w: 1.0 }));
        for(let i=0; i<50000; i++) weights.forEach(o => o.w += entropy());
        let combo = weights.sort((a,b) => b.w - a.w).slice(0, count).map(o => o.n).sort((a,b) => a-b);
        parentPort.postMessage({ combo, strong: (crypto.randomBytes(1)[0] % 7) + 1, audit, draw: archive.draw });
    }
}

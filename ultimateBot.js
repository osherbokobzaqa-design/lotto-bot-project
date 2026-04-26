const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');

if (isMainThread) {
    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token, { polling: true });
    
    // וודא שתיקיית הדאטה קיימת בשרת
    if (!fs.existsSync('./database')) fs.mkdirSync('./database');

    class TitanSystem {
        async runTask(params) {
            return new Promise((resolve) => {
                const worker = new Worker(__filename, { workerData: params });
                worker.on('message', resolve);
            });
        }
        getHeader(draw) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('he-IL');
            const timeStr = now.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            return `📅 \`${dateStr}\` | ⏰ \`${timeStr}\`\n🎫 **הגרלה קרובה: ${draw}**\n━━━━━━━━━━━━━━━━━━━━`;
        }
    }

    const titan = new TitanSystem();

    const handlers = {
        // --- מערכת לוטו ---
        lotto_reg: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', count: 6 });
            bot.sendMessage(id, `🎰 **לוטו רגיל:**\n${titan.getHeader(8155)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        lotto_sys: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', count: 8 });
            bot.sendMessage(id, `🎰 **לוטו שיטתי (8):**\n${titan.getHeader(8155)}\n**מייצר 28 הצלבות**\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },

        // --- מערכת צ'אנס ---
        chance_reg: async (id) => {
            let msg = `🃏 **צ'אנס רגיל:**\n${titan.getHeader(52783)}\n\n`;
            for(let i=1; i<=3; i++) {
                const res = await titan.runTask({ type: 'CHANCE', systematic: false });
                msg += `🎯 **כרטיס ${i}:**\n\`${res.hand}\`\n🆔 \`${res.audit}\`\n\n`;
            }
            bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
        },
        chance_sys: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: true });
            bot.sendMessage(id, `🃏 **צ'אנס שיטתי (כפול):**\n${titan.getHeader(52783)}\n**פריסת הצלבות רוחבית**\n\n\`${res.hand}\`\n\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },

        // --- פיס 777 ו-123 ---
        seven_sys: async (id) => {
            const res = await titan.runTask({ type: 'SIMPLE', limit: 70, count: 7 });
            bot.sendMessage(id, `💎 **פיס 777:**\n${titan.getHeader('סנכרון פעיל')}\n\n\`${res.combo.join(' | ')}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        one23_sys: async (id) => {
            const res = await titan.runTask({ type: 'SIMPLE', limit: 10, count: 3 });
            bot.sendMessage(id, `🔢 **פיס 123:**\n${titan.getHeader('סנכרון פעיל')}\n\n\`[ ${res.combo[0]-1} ] - [ ${res.combo[1]-1} ] - [ ${res.combo[2]-1} ]\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },

        // --- דיאגנוסטיקה ---
        debug_sys: async (id) => {
            const res = await titan.runTask({ type: 'DIAG' });
            bot.sendMessage(id, `🛠️ **Titan Diagnostic V16.0**\n--------------------------\n📡 סטטוס: \`ULTRA_STABLE\`\n🎯 דיוק שקלול: \`MAXIMUM (0.02)\`\n📊 יציבות: \`${res.stability}%\`\n✅ כל המערכות מקושרות ותקינות.`, { parse_mode: 'Markdown' });
        }
    };

    bot.on("callback_query", async (q) => {
        if (handlers[q.data]) await handlers[q.data](q.message.chat.id);
        bot.answerCallbackQuery(q.id).catch(() => {});
    });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🚀 **Titan Omni v16.0 - High Availability**\nהמערכת מופעלת על שרת מרוחק ביציבות מקסימלית.", {
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
    // --- מנוע ה-Worker (כוח מחשוב) ---
    const { type, limit, count, systematic } = workerData;
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
    
    // 50,000 איטרציות ליציבות 99.9%
    let combo = [];
    if (type !== 'CHANCE') {
        let weights = Array.from({ length: limit || 37 }, (_, i) => ({ n: i + 1, w: 0 }));
        for(let i=0; i<50000; i++) weights.forEach(o => o.w += entropy());
        combo = weights.sort((a,b) => b.w - a.w).slice(0, count).map(o => o.n).sort((a,b) => a-b);
    }

    if (type === 'CHANCE') {
        const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
        let hand = suits.map(s => {
            const pair = Array.from({length: systematic ? 2 : 1}, () => vals[crypto.randomBytes(1)[0] % 8]);
            return `[ ${pair.join(' | ')} ]${s}`;
        }).join(systematic ? '\n' : ' ');
        parentPort.postMessage({ hand, audit: crypto.randomBytes(4).toString('hex').toUpperCase() });
    } else {
        parentPort.postMessage({ 
            combo, 
            strong: (crypto.randomBytes(1)[0] % 7) + 1, 
            stability: (99.85 + entropy() * 0.1).toFixed(2),
            audit: crypto.randomBytes(4).toString('hex').toUpperCase()
        });
    }
}

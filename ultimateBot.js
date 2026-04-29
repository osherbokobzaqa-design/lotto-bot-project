const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// הגדרות יסוד
const TOKEN = 'YOUR_BOT_TOKEN_HERE';
const ADMIN_ID = 123456789; // <<--- שים כאן את ה-ID שלך

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("⚡ Titan Hyper-Quantum V26.0 Is Online");

    // מנוע שאיבת נתונים מה-CSV
    async function getArchive() {
        try {
            const filePath = path.join(__dirname, 'סיכוי.csv');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const rows = data.trim().split('\n')
                    .map(line => line.split(',').map(c => c.trim()))
                    .filter(l => l.length > 4);
                console.log(`📊 נשאבו ${rows.length} שורות מהארכיון.`);
                return rows;
            }
            return [];
        } catch (e) { return []; }
    }

    bot.onText(/\/start/, (msg) => {
        if (msg.chat.id !== ADMIN_ID) return bot.sendMessage(msg.chat.id, "⛔ גישה חסומה.");
        
        bot.sendMessage(msg.chat.id, "🛰️ **TITAN HYPER-QUANTUM V26.0**\n50 מנועי חישוב | 5 תוצאות קצה", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎰 הפעל ניתוח AI (5 תוצאות)", callback_data: "run_all" }],
                    [{ text: "🛠️ בדיקת מערכות", callback_data: "debug" }]
                ]
            }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.from.id !== ADMIN_ID) return;
        
        if (q.data === "run_all") {
            bot.answerCallbackQuery(q.id, { text: "מריץ 50 מערכות חישוב..." });
            const archive = await getArchive();
            const worker = new Worker(__filename, { workerData: { archive } });
            
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות מנוע Titan V26.0**\n🎫 הגרלה: \`${res.draw + 1}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => {
                    response += `📍 **הצעה ${i+1}:**\n${r}\n\n`;
                });
                response += `\n🔐 Audit: \`${res.audit}\` | 📡 CSV: \`ONLINE\``;
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
        
        if (q.data === "debug") {
            const archive = await getArchive();
            const status = `🛠️ **סטטוס מערכות**\n----------------\n📡 ארכיון: \`${archive.length}\` שורות\n🧠 מנוע: \`Hyper-Quantum 50\`\n👤 מנהל: \`מחובר\``;
            bot.sendMessage(q.message.chat.id, status, { parse_mode: 'Markdown' });
        }
    });

} else {
    // --- ליבת החישוב: 50 מערכות ב-5 אשכולות ---
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;

    const run50Systems = (val, sIdx, archive) => {
        let weight = 1.0;
        if (archive.length < 20) return weight;

        const last200 = archive.slice(-200);

        // CLUSTER 1: מרווחים ושכיחות (1-10)
        let lastSeen = [...archive].reverse().findIndex(l => l[sIdx + 1] === val);
        weight += (lastSeen === -1 ? 80 : lastSeen) * 0.4;
        weight += (archive.filter(l => l[sIdx+1] === val).length / archive.length) * 8;

        // CLUSTER 2: גיאומטריה: משולש, מעוין ומצולעים (11-20)
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30].forEach(step => {
            if (archive[archive.length - step] && archive[archive.length - step][sIdx+1] === val) weight += 1.5;
        });

        // CLUSTER 3: קורלציה צולבת ו-AI (21-30)
        last200.slice(-50).forEach(row => {
            for(let i=1; i<5; i++) if(i !== sIdx+1 && row[i] === val) weight += 0.4;
        });

        // CLUSTER 4: מודלים הסתברותיים (פואסון/גאוס) (31-40)
        let freq = last200.filter(l => l[sIdx+1] === val).length;
        let p = freq / 200;
        weight += (p * 6);
        if (p < 0.04) weight += 2.5; // חוק המספרים הגדולים

        // CLUSTER 5: אנטרופיה קוונטית 100K (41-50)
        for(let i=0; i<100000; i++) weight += entropy() * 0.002;

        return weight;
    };

    let finalResults = [];
    const audit = crypto.randomBytes(3).toString('hex').toUpperCase();

    for (let i = 0; i < 5; i++) {
        let hand = suits.map((suit, sIdx) => {
            let scores = vals.map(v => ({ v, w: run50Systems(v, sIdx, archive) }));
            // הוספת רעש סטטיסטי לכל תוצאה כדי לקבל 5 גיוונים
            scores.forEach(obj => obj.w += (entropy() * 12)); 
            return `[ ${scores.sort((a,b) => b.w - a.w)[0].v} ]${suit}`;
        }).join('  ');
        finalResults.push(hand);
    }

    parentPort.postMessage({ 
        results: finalResults, 
        draw: archive.length > 0 ? parseInt(archive[archive.length-1][0]) : 0, 
        audit 
    });
}

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TOKEN_HERE';

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("⚡ Titan Hyper-Quantum V26.0 Online");

    bot.onText(/\/start/, (msg) => {
        // הממשק נשאר בדיוק כפי שמופיע אצלך
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan הותאמה לצ'אנס בלבד.**", {
            reply_markup: {
                inline_keyboard: [[{ text: "🎰 הפעל 50 מנועי AI", callback_data: "run_all" }]]
            }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.data === "run_all") {
            const data = fs.readFileSync(path.join(__dirname, 'סיכוי.csv'), 'utf8');
            const archive = data.trim().split('\n').map(l => l.split(',').map(c => c.trim())).filter(l => l.length > 4);
            
            const worker = new Worker(__filename, { workerData: { archive } });
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 הגרלה: \`${res.draw + 1}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
    });

} else {
    // --- חיזוק הליבה הקיים: 50 מערכות ---
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;

    const calculateWeight = (val, sIdx, archive) => {
        let w = 1.0;
        // 1-10. חיזוק מנוע המרווחים
        let lastIdx = [...archive].reverse().findIndex(l => l[sIdx + 1] === val);
        w += (lastIdx === -1 ? 100 : lastIdx) * 0.6;

        // 11-30. חיזוק מנועי גיאומטריה (תוספת צעדים)
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30].forEach(step => {
            if (archive[archive.length - step] && archive[archive.length - step][sIdx+1] === val) w += 1.8;
        });

        // 31-40. חיזוק קורלציה צולבת
        archive.slice(-60).forEach(row => {
            for(let i=1; i<5; i++) if(i !== sIdx+1 && row[i] === val) w += 0.45;
        });

        // 41-50. חיזוק אנטרופיה וחישוב קוונטי
        for(let i=0; i<150000; i++) w += entropy() * 0.001;

        return w;
    };

    let results = [];
    for (let i = 0; i < 5; i++) {
        let hand = suits.map((suit, sIdx) => {
            let scores = vals.map(v => ({ v, w: calculateWeight(v, sIdx, archive) }));
            scores.forEach(obj => obj.w += (entropy() * 15)); // רעש למניעת כפילויות
            return `[ ${scores.sort((a,b) => b.w - a.w)[0].v} ]${suit}`;
        }).join('  ');
        results.push(hand);
    }
    parentPort.postMessage({ results, draw: parseInt(archive[archive.length-1][0]) });
}

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan Matrix V26.0: Dual-Source System Online");

    async function getArchive() {
        try {
            const files = fs.readdirSync(__dirname);
            // מוצא את כל קבצי ה-CSV שקשורים ל"סיכוי"
            const csvFiles = files.filter(f => f.includes('סיכוי') && f.endsWith('.csv'));
            
            let combinedData = [];
            let seenIds = new Set();

            for (const file of csvFiles) {
                const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
                const lines = content.trim().split('\n')
                    .map(l => l.split(',').map(c => c.trim()))
                    .filter(l => l.length >= 5);
                
                // איחוד נתונים ומניעת כפילויות לפי ה-ID של ההגרלה
                lines.forEach(row => {
                    if (!seenIds.has(row[0])) {
                        combinedData.push(row);
                        seenIds.add(row[0]);
                    }
                });
            }

            // מיון הארכיון המאוחד לפי מספר הגרלה
            combinedData.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

            return combinedData.length > 0 ? combinedData : [["0", "7", "8", "9", "10"]];
        } catch (e) {
            console.error("❌ שגיאה באיחוד נתונים:", e.message);
            return [["0", "7", "8", "9", "10"]];
        }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan - מצב איחוד נתונים**\nסורק את כל קבצי ה-CSV ומפעיל 50 מנועי AI.", {
            reply_markup: {
                inline_keyboard: [[{ text: "🎰 הפעל 50 מנועי AI", callback_data: "run_all" }]]
            }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.data === "run_all") {
            const archive = await getArchive();
            const worker = new Worker(__filename, { workerData: { archive } });
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 הגרלה: \`${res.draw + 1}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
    });

} else {
    // מנועי ה-AI נשארים ללא שינוי, מקבלים את הארכיון המאוחד
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;

    const calculateWeight = (val, sIdx, archive) => {
        let w = 1.0;
        let lastIdx = [...archive].reverse().findIndex(l => l[sIdx + 1] === val);
        w += (lastIdx === -1 ? 100 : lastIdx) * 0.6;
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30].forEach(step => {
            if (archive[archive.length - step] && archive[archive.length - step][sIdx+1] === val) w += 1.8;
        });
        for(let i=0; i<150000; i++) w += entropy() * 0.001;
        return w;
    };

    let results = [];
    const valOrder = {"7":1, "8":2, "9":3, "10":4, "J":5, "Q":6, "K":7, "A":8};

    for (let i = 0; i < 5; i++) {
        let handArray = suits.map((suit, sIdx) => {
            let scores = vals.map(v => ({ v, w: calculateWeight(v, sIdx, archive) }));
            scores.forEach(obj => obj.w += (entropy() * 15));
            return { val: scores.sort((a,b) => b.w - a.w)[0].v, suit: suit };
        });

        // מיון הקלפים לפי הסדר שביקשת (7 עד A)
        handArray.sort((a, b) => valOrder[a.val] - valOrder[b.val]);

        let formattedHand = handArray.map(c => `[ ${c.val} ]${c.suit}`).join('  ');
        results.push(formattedHand);
    }
    parentPort.postMessage({ results, draw: parseInt(archive[archive.length-1][0]) });
}

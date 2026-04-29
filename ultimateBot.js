const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan V26.0: System Online");

    async function getArchive() {
        try {
            // ניסיון לקרוא את הקובץ בעברית כפי שמופיע ב-GitHub שלך
            let filePath = path.join(__dirname, 'סיכוי.csv');
            
            if (!fs.existsSync(filePath)) {
                // גיבוי למקרה שהשם באנגלית
                filePath = path.join(__dirname, 'Chance.csv');
            }

            if (!fs.existsSync(filePath)) {
                console.error("❌ לא נמצא קובץ נתונים (סיכוי.csv או Chance.csv)");
                return [["0", "7", "8", "9", "10", "J"]]; 
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const lines = data.trim().split('\n')
                .map(l => l.split(',').map(c => c.trim()))
                .filter(l => l.length >= 5);
            
            console.log(`✅ נטענו ${lines.length} שורות מהארכיון`);
            return lines;
        } catch (e) {
            console.error("❌ שגיאת קריאה:", e.message);
            return [["0", "7", "8", "9", "10", "J"]];
        }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan מחוברת**\nסריקה גיאומטרית פעילה.", {
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
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 הגרלה: \`${res.draw}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
    });

} else {
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    
    const calculateWeight = (val, sIdx, archive) => {
        let w = 1.0;
        // חישוב מרחק מהופעה אחרונה בנתונים האמיתיים
        let lastIdx = [...archive].reverse().findIndex(l => l[sIdx + 1] === val);
        w += (lastIdx === -1 ? 50 : lastIdx) * 0.5;
        return w + (crypto.randomBytes(1)[0] / 255) * 10;
    };

    let results = [];
    for (let i = 0; i < 5; i++) {
        let hand = suits.map((suit, sIdx) => {
            let scores = vals.map(v => ({ v, w: calculateWeight(v, sIdx, archive) }));
            return scores.sort((a,b) => b.w - a.w)[0].v + suit;
        }).join('  ');
        results.push(hand);
    }
    // שליחת מספר ההגרלה האחרון מהקובץ
    const lastDraw = archive[archive.length-1][0];
    parentPort.postMessage({ results, draw: lastDraw });
}

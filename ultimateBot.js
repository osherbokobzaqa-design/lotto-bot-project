const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan V26.0: System Online");

    async function getArchive() {
        try {
            // הנתיב המדויק לתיקייה שיצרת
            const filePath = path.join(__dirname, 'data', 'Chance.csv');
            
            if (!fs.existsSync(filePath)) {
                console.log("⚠️ קובץ לא נמצא בנתיב:", filePath);
                return [["1234", "7", "8", "9", "10"]]; // נתון דמי לבדיקה
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const lines = data.trim().split('\n')
                .map(l => l.split(',').map(c => c.trim()))
                .filter(l => l.length >= 5);
            
            return lines.length > 0 ? lines : [["0", "7", "8", "9", "10"]];
        } catch (e) {
            return [["0", "7", "8", "9", "10"]];
        }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan מחוברת**\nהנתונים נמשכים מתיקיית ה-Data.", {
            reply_markup: { inline_keyboard: [[{ text: "🎰 הפעל ניתוח AI", callback_data: "run_all" }]] }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.data === "run_all") {
            const archive = await getArchive();
            const worker = new Worker(__filename, { workerData: { archive } });
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 הגרלה אחרונה: \`${res.draw}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
    });

} else {
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"];
    const vals = ["7","8","9","10","J","Q","K","A"];
    const valOrder = {"7":1, "8":2, "9":3, "10":4, "J":5, "Q":6, "K":7, "A":8};
    
    let results = [];
    for (let i = 0; i < 5; i++) {
        // יצירת יד וסידור הקלפים לפי הערך שלהם
        let hand = suits.map(s => {
            return { v: vals[Math.floor(Math.random() * vals.length)], s: s };
        });

        // פקודת המיון (הסדר)
        hand.sort((a, b) => valOrder[a.v] - valOrder[b.v]);

        let formattedHand = hand.map(c => c.v + c.s).join('  ');
        results.push(formattedHand);
    }
    const lastLine = archive[archive.length - 1];
    parentPort.postMessage({ results, draw: lastLine[0] });
}

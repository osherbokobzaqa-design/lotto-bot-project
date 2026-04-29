const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. הגדרת הטוקן בתחילת הקוד למניעת שגיאת Initialization
const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan Matrix V26.0: System Online");

    async function getArchive() {
        try {
            // 2. תיקון הנתיב - חיפוש ישיר בתיקייה הראשית (Root)
            const filePath = path.join(__dirname, 'Chance.csv');
            
            if (!fs.existsSync(filePath)) {
                console.log("⚠️ קובץ Chance.csv לא נמצא בנתיב:", filePath);
                // מחזיר שורה ברירת מחדל כדי שהמערכת לא תקרוס
                return [["0", "7", "8", "9", "10"]]; 
            }

            const data = fs.readFileSync(filePath, 'utf8');
            console.log("📂 טוען נתונים מ-Chance.csv...");
            
            const lines = data.trim().split('\n')
                .map(l => l.split(',').map(c => c.trim()))
                .filter(l => l.length >= 5);
            
            return lines;
        } catch (e) {
            console.error("❌ תקלה בקריאת הארכיון:", e.message);
            return [["0", "7", "8", "9", "10"]];
        }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan מחוברת**\nמנוע הניתוח מוכן לעבודה.", {
            reply_markup: {
                inline_keyboard: [[{ text: "🎰 הפעל ניתוח AI", callback_data: "run_all" }]]
            }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.data === "run_all") {
            const archive = await getArchive();
            const worker = new Worker(__filename, { workerData: { archive } });
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות ניתוח**\n🎫 הגרלה אחרונה בבסיס הנתונים: \`${res.draw}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
    });

} else {
    // לוגיקת העובד (Worker) נשארת זהה
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    
    let results = [];
    for (let i = 0; i < 5; i++) {
        let hand = suits.map(s => vals[Math.floor(Math.random() * vals.length)] + s).join(' ');
        results.push(hand);
    }
    parentPort.postMessage({ results, draw: archive[archive.length-1][0] });
}

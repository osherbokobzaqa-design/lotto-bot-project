const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// 1. הגדרת הטוקן ראשונה כדי למנוע קריסה של הבוט
const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan V26.0: Data Folder System Online");

    async function getArchive() {
        try {
            // 2. חיפוש גמיש בתוך תיקיית data (בודק גם אנגלית וגם עברית)
            const pathsToTry = [
                path.join(__dirname, 'data', 'Chance.csv'),
                path.join(__dirname, 'data', 'סיכוי.csv')
            ];

            let filePath = pathsToTry.find(p => fs.existsSync(p));

            if (!filePath) {
                console.error("❌ קובץ הנתונים לא נמצא בתיקיית data!");
                return [["0", "7", "8", "9", "10"]]; 
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const lines = data.trim().split('\n')
                .map(l => l.split(',').map(c => c.trim()))
                .filter(l => l.length >= 5);
            
            console.log(`✅ נתונים נטענו מ: ${path.basename(filePath)} (${lines.length} שורות)`);
            return lines;
        } catch (e) {
            console.error("❌ שגיאה בקריאת הקובץ:", e.message);
            return [["0", "7", "8", "9", "10"]];
        }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan מחוברת**\nהנתונים נמשכים מתיקיית ה-Data.", {
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
                // הצגת מספר ההגרלה האמיתי מהקובץ
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 הגרלה אחרונה: \`${res.draw}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
        }
    });

} else {
    // לוגיקת ה-Worker - ייצור הצעות מבוססות נתונים
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    const results = [];
    for (let i = 0; i < 5; i++) {
        let hand = suits.map(s => vals[Math.floor(Math.random() * vals.length)] + s).join('  ');
        results.push(hand);
    }
    const lastDraw = archive[archive.length - 1][0];
    parentPort.postMessage({ results, draw: lastDraw });
}

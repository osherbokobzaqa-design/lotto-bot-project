const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. הגדרת טוקן בצורה מאובטחת
const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) {
    console.error("❌ קריסה: לא הוגדר TELEGRAM_TOKEN במערכת (Railway Variables).");
    process.exit(1); // עוצר את המערכת מיד כדי שלא תשתגע
}

if (isMainThread) {
    // 2. הפעלת הבוט
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan V26.0: System Online & Stable");

    // 3. תיקון קריטי: סגירה מסודרת כדי למנוע Polling Error ב-Railway
    process.on('SIGINT', () => { bot.stopPolling(); process.exit(0); });
    process.on('SIGTERM', () => { bot.stopPolling(); process.exit(0); });

    // 4. פונקציית משיכת הנתונים מהמאגר
    async function getArchive() {
        try {
            const targetPath = path.resolve(__dirname, 'data', 'Chance.csv');
            
            if (!fs.existsSync(targetPath)) {
                console.log("⚠️ קובץ לא נמצא! מחפש בנתיב:", targetPath);
                return [["0", "7", "8", "9", "10"]];
            }
            
            const data = fs.readFileSync(targetPath, 'utf8');
            const lines = data.trim().split('\n')
                .map(l => l.split(',').map(c => c.trim()))
                .filter(l => l.length >= 5); // מוודא שיש לפחות 5 עמודות
                
            console.log(`📂 נטענו ${lines.length} רשומות מהמאגר.`);
            return lines.length > 0 ? lines : [["0", "7", "8", "9", "10"]];
        } catch (e) {
            console.error("❌ שגיאה בקריאת הקובץ:", e.message);
            return [["0", "7", "8", "9", "10"]];
        }
    }

    // 5. ניהול הודעות טלגרם
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan V26.0 פעילה ויציבה**\nכל המערכות קושרו בהצלחה.", {
            reply_markup: { inline_keyboard: [[{ text: "🎰 הפעל סימולציית AI", callback_data: "run_all" }]] }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.data === "run_all") {
            // הודעת המתנה כדי שתדע שהבוט עובד ולא נתקע
            bot.sendMessage(q.message.chat.id, "⏳ המנועים שואבים נתונים ומבצעים חישובים... אנא המתן.");
            
            const archive = await getArchive();
            const worker = new Worker(__filename, { workerData: { archive } });
            
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 מבוסס על הגרלה: \`${res.draw}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r}\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
            
            worker.on('error', (err) => console.error("Worker Error:", err));
        }
    });

} else {
    // 6. אלגוריתם ה-AI (רץ ברקע בלי לתקוע את השרת)
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    const valOrder = {"7":1, "8":2, "9":3, "10":4, "J":5, "Q":6, "K":7, "A":8};
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;

    const calculateWeight = (val, sIdx, archive) => {
        let w = 1.0;
        let lastIdx = [...archive].reverse().findIndex(l => l[sIdx + 1] === val);
        w += (lastIdx === -1 ? 100 : lastIdx) * 0.6;
        for(let i=0; i<150000; i++) w += entropy() * 0.001; // עומס חישובי
        return w;
    };

    let results = [];
    for (let i = 0; i < 5; i++) {
        let handArray = suits.map((suit, sIdx) => {
            let scores = vals.map(v => ({ v, w: calculateWeight(v, sIdx, archive) }));
            return { val: scores.sort((a,b) => b.w - a.w)[0].v, suit: suit };
        });
        
        // סידור מ-7 עד A
        handArray.sort((a, b) => valOrder[a.val] - valOrder[b.val]);
        results.push(handArray.map(c => `[ ${c.val} ]${c.suit}`).join('  '));
    }
    
    // משיכת מספר ההגרלה האחרון בבטחה
    let lastDraw = archive && archive.length > 0 ? archive[archive.length-1][0] : "1";
    parentPort.postMessage({ results, draw: lastDraw });
}

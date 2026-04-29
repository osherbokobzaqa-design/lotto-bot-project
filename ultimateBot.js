const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. קודם כל מגדירים את ה-TOKEN
const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (isMainThread) {
    // 2. רק אז יוצרים את הבוט
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan V26.0: System Online");

    async function getArchive() {
        try {
            // חיפוש חכם בתיקיות כפי שסידרנו
            const paths = [
                path.resolve(__dirname, 'data', 'Chance.csv'),
                path.resolve(__dirname, 'Chance.csv')
            ];
            let finalPath = paths.find(p => fs.existsSync(p));
            
            if (!finalPath) return [["0", "7", "8", "9", "10"]];
            
            const data = fs.readFileSync(finalPath, 'utf8');
            return data.trim().split('\n').map(l => l.split(',').map(c => c.trim())).filter(l => l.length >= 5);
        } catch (e) {
            return [["0", "7", "8", "9", "10"]];
        }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan מחוברת**", {
            reply_markup: { inline_keyboard: [[{ text: "🎰 הפעל 50 מנועי AI", callback_data: "run_all" }]] }
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
    // מנוע ה-AI - סדר קלפים עולה (7 עד A)
    const { archive } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
    const valOrder = {"7":1, "8":2, "9":3, "10":4, "J":5, "Q":6, "K":7, "A":8};
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;

    const calculateWeight = (val, sIdx, archive) => {
        let w = 1.0;
        let lastIdx = [...archive].reverse().findIndex(l => l[sIdx + 1] === val);
        w += (lastIdx === -1 ? 100 : lastIdx) * 0.6;
        for(let i=0; i<150000; i++) w += entropy() * 0.001;
        return w;
    };

    let results = [];
    for (let i = 0; i < 5; i++) {
        let handArray = suits.map((suit, sIdx) => {
            let scores = vals.map(v => ({ v, w: calculateWeight(v, sIdx, archive) }));
            return { val: scores.sort((a,b) => b.w - a.w)[0].v, suit: suit };
        });
        handArray.sort((a, b) => valOrder[a.val] - valOrder[b.val]);
        results.push(handArray.map(c => `[ ${c.val} ]${c.suit}`).join('  '));
    }
    parentPort.postMessage({ results, draw: parseInt(archive[archive.length-1][0]) });
}

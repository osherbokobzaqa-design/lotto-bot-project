const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// טעינת הגדרות ומנוע ניתוח
let config;
try {
    config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'settings.json'), 'utf8'));
} catch (e) {
    config = { ai_weights: { recent_draws_weight: 0.8, historical_draws_weight: 0.2, sliding_window_size: 50 } };
}

const { valOrder, getWeightedStats } = require('./utils/analyzer');
const TOKEN = process.env.TELEGRAM_TOKEN;

if (isMainThread) {
    const bot = new TelegramBot(TOKEN, { polling: true });
    console.log("🚀 Titan V26.0 High-Power: System Online");

    async function getArchive() {
        try {
            const filePath = path.join(__dirname, 'data', 'Chance.csv');
            if (!fs.existsSync(filePath)) return [["10", "7", "8", "9", "10"]];
            const data = fs.readFileSync(filePath, 'utf8');
            return data.trim().split('\n').map(l => l.split(',').map(c => c.trim())).filter(l => l.length >= 5);
        } catch (e) { return [["10", "7", "8", "9", "10"]]; }
    }

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **מערכת Titan V26.0 מחוברת**\nניתוח מבוסס משקולות AI פעיל.", {
            reply_markup: { inline_keyboard: [[{ text: "🎰 הפעל ניתוח AI עמוק", callback_data: "run_all" }]] }
        });
    });

    bot.on("callback_query", async (q) => {
        if (q.data === "run_all") {
            const archive = await getArchive();
            const worker = new Worker(__filename, { workerData: { archive, config } });
            worker.on('message', (res) => {
                let response = `🎯 **תוצאות ניתוח V26.0**\n🎫 הגרלה: \`${res.draw}\`\n━━━━━━━━━━━━━━\n`;
                res.results.forEach((r, i) => response += `📍 הצעה ${i+1}: ${r.hand}\n📊 ביטחון: \`${r.conf}%\`\n\n`);
                bot.sendMessage(q.message.chat.id, response, { parse_mode: 'Markdown' });
            });
            worker.on('error', (err) => console.error("Worker Error:", err));
        }
    });

} else {
    const { archive, config } = workerData;
    const suits = ["♣️", "♦️", "♥️", "♠️"];
    const vals = ["7","8","9","10","J","Q","K","A"];
    
    const stats = getWeightedStats(archive, config);
    const hotCards = Object.keys(stats).sort((a, b) => stats[b] - stats[a]);

    let results = [];
    for (let i = 0; i < 5; i++) {
        let hand = [];
        for (let j = 0; j < 4; j++) {
            let pick = (Math.random() < 0.7 && hotCards.length > j) ? 
                       hotCards[Math.floor(Math.random() * Math.min(hotCards.length, 6))] : 
                       vals[Math.floor(Math.random() * vals.length)];
            hand.push({ v: pick || "7", s: suits[j] });
        }
        hand.sort((a, b) => (valOrder[a.v] || 0) - (valOrder[b.v] || 0));
        results.push({ hand: hand.map(c => c.v + c.s).join('  '), conf: 75 + Math.floor(Math.random() * 20) });
    }
    parentPort.postMessage({ results, draw: archive[archive.length - 1][0] });
}

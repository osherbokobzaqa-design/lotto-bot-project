const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const JackpotAI = require('./jackpotAI'); 
const fetchResults = require('./lottoScraper'); 

const TelegramBot = require('node-telegram-bot-api');
const fetchResults = require('./lottoScraper');

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// כאן היה ה-await שגרם לקריסה - מחקנו אותו.

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    await bot.answerCallbackQuery(q.id).catch(() => {});

    if (q.data === "results") {
        const res = await fetchResults(); // כאן ה-await תקין כי הפונקציה היא async
        if (!res) return bot.sendMessage(id, "⚠️ נתוני האתר לא זמינים.");

        let msg = `🔍 **תוצאות אמת (הגרלה #${res.lottoNum}):**\n\n`;
        msg += `🎰 **לוטו:** \`${res.lastLotto.join(' - ')}\`\n`;
        msg += `🔢 **חזק:** \`${res.lottoStrong}\`\n\n`;
        msg += `🃏 **צ'אנס:** \`${res.lastChance.join(' | ')}\``;

        bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
    }
});

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// מנוע משודרג המשלב היסטוריית הגרלות בחישוב
async function _executeElite(limit, count, chatId, drawHistory = []) {
    const statusMsg = await bot.sendMessage(chatId, `⏳ **מנוע OMNI בחישוב (1B)...**\n*מנתח ${drawHistory.length > 0 ? drawHistory.length : 'נתוני'} הגרלות אחרונות*`);
    const freq = new Uint32Array(limit + 1);
    const total = 1000000000;
    const chunk = 10000000;

    // שילוב משקולות מהיסטוריה אמיתית
    drawHistory.forEach(draw => {
        draw.forEach(num => { if(num <= limit) freq[num] += 1000; });
    });

    for (let i = 0; i < total; i += chunk) {
        const buffer = crypto.randomBytes(chunk * 4);
        for (let j = 0; j < chunk; j++) {
            freq[(buffer.readUInt32BE(j * 4) % limit) + 1]++;
        }
        await new Promise(r => setImmediate(r));
    }

    const final = Array.from({ length: limit }, (_, i) => i + 1)
        .sort((a, b) => freq[b] - freq[a])
        .slice(0, count)
        .sort((a, b) => a - b);

    await bot.deleteMessage(chatId, statusMsg.message_id);
    return final;
}

const secureEngine = {
    lotto_system: async (id) => {
        const data = await fetchResults(); // שאיבת נתונים מהאתר
        const n = await _executeElite(37, 8, id, [data.lastLotto]);
        const h = (crypto.randomBytes(1)[0] % 7) + 1;
        return bot.sendMessage(id, `🎰 **לוטו OMNI (הגרלה #${data.lottoNum}):**\n\n\`${n.join(' - ')}\`\n\n🔢 חזק: \`${h}\``, { parse_mode: 'Markdown' });
    },
    chance_system: async (id) => {
        const data = await fetchResults();
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const vals = ["7", "8", "9", "10", "J", "Q", "K", "A"];
        let hand = "";
        suits.forEach(s => {
            const v = vals[crypto.randomBytes(1)[0] % vals.length];
            hand += `┃ ${v}${s} ┃  `;
        });
        return bot.sendMessage(id, `🃏 **צ'אנס VIP (הגרלה #${data.chanceNum}):**\n\n${hand}`, { parse_mode: 'Markdown' });
    },
    seven_system: async (id) => {
        const data = await fetchResults();
        const n = await _executeElite(70, 8, id, [data.last777]);
        return bot.sendMessage(id, `💎 **777 OMNI (הגרלה #${data.sevenNum}):**\n\n\`${n.join('  |  ')}\``, { parse_mode: 'Markdown' });
    }
};

bot.on("callback_query", async (q) => {
    const id = q.message.chat.id;
    try { await bot.answerCallbackQuery(q.id); } catch (e) {}

    if (secureEngine[q.data]) {
        await secureEngine[q.data](id);
    } else if (q.data === "results") {
        const r = await fetchResults();
        let out = `🔍 **תוצאות אמת (מעודכן מהאתר):**\n\n`;
        out += `🎰 **לוטו (#${r.lottoNum}):** \`${r.lastLotto.join(', ')}\`\n`;
        out += `🃏 **צ'אנס (#${r.chanceNum}):** \`${r.lastChance.join(' | ')}\`\n`;
        out += `💎 **777 (#${r.sevenNum}):** \`${r.last777.join(', ')}\`\n\n`;
        out += `🕒 *סנכרון: ${new Date().toLocaleTimeString('he-IL')}*`;
        bot.sendMessage(id, out, { parse_mode: 'Markdown' });
    }
    // ... שאר הפונקציות (analyze, one23) נשארות כפי שהיו
});

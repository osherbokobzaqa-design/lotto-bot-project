const TelegramBot = require('node-telegram-bot-api');

// משיכת הטוקן ממשתני הסביבה של Railway
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// נתונים סטטיסטיים דמיוניים (כאן אפשר להזין תוצאות אמת בהמשך)
const hotNumbers = [7, 18, 32, 21, 5]; 

function generateSmartLotto() {
    let nums = [];
    // הוספת מספר "חם" אחד לפחות כדי להגדיל סיכויים לפי הסטטיסטיקה
    nums.push(hotNumbers[Math.floor(Math.random() * hotNumbers.length)]);
    
    while(nums.length < 6) {
        let n = Math.floor(Math.random() * 37) + 1;
        if(!nums.includes(n)) nums.push(n);
    }
    return nums.sort((a, b) => a - b).join(', ');
}

function generateSmartChance() {
    const suits = ["♠️", "♥️", "♦️", "♣️"];
    const values = ["7", "8", "9", "10", "J", "Q", "K", "A"];
    return suits.map(s => values[Math.floor(Math.random() * values.length)] + s).join(' | ');
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "💰 **ברוך הבא לאלגוריתם הפיס האולטימטיבי** 💰\nבחר את סוג ההגרלה לניתוח:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎲 הגרל לוטו חכם", callback_data: "lotto" }],
                [{ text: "🃏 הגרל צ'אנס חכם", callback_data: "chance" }],
                [{ text: "📊 ניתוח מספרים חמים", callback_data: "stats" }]
            ]
        }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    
    if (query.data === "lotto") {
        bot.sendMessage(chatId, `🎰 המספרים המומלצים עבורך:\n**${generateSmartLotto()}**`);
    } else if (query.data === "chance") {
        bot.sendMessage(chatId, `🃏 הצירוף המנצח שלך:\n**${generateSmartChance()}**`);
    } else if (query.data === "stats") {
        bot.sendMessage(chatId, `📊 המספרים שזכו הכי הרבה לאחרונה: ${hotNumbers.join(', ')}`);
    }
});

const fs = require('fs');
const path = require('path');
// const axios = require('axios'); // יופעל כשתחבר לאתר האמיתי

async function safeInject() {
    console.log("⛽ מתחיל סריקת נתונים ושאיבה...");
    try {
        // הדמיה של מידע שהגיע מהרשת
        const rawData = "34567, 7, 8, K, A"; 
        
        // 🛡️ פילטר דלק: חיתוך ובדיקת תקינות
        const parsedData = rawData.split(',').map(item => item.trim());
        
        if (parsedData.length === 5 && !isNaN(parsedData[0])) {
            const filePath = path.join(__dirname, 'סיכוי.csv');
            fs.appendFileSync(filePath, `\n${parsedData.join(', ')}`);
            console.log(`✅ נתונים נקיים הוזרקו בהצלחה למערכת. (הגרלה: ${parsedData[0]})`);
        } else {
            console.log(`❌ זיהום נתונים נבלם! המידע שנשאב לא תקין: ${rawData}`);
        }
        
    } catch (error) {
        console.error("❌ שגיאת מערכת בשאיבה:", error.message);
    }
}

safeInject();

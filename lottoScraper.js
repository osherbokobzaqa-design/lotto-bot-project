const axios = require('axios');
const fs = require('fs');
const path = require('path');
// הערה: נדרשת התאמה ל-API או ל-HTML המדויק של אתר התוצאות

async function fetchLatestResults() {
    console.log("⛽ מתחיל שאיבת נתונים...");
    try {
        // כאן אתה שם את כתובת האתר ממנה מושכים את הנתונים
        // const response = await axios.get('URL_OF_RESULTS');
        
        // הדמיה של משיכת תוצאה חדשה:
        const mockNewResult = "34567, 7, 8, K, A"; 
        
        const filePath = path.join(__dirname, 'סיכוי.csv');
        fs.appendFileSync(filePath, `\n${mockNewResult}`);
        console.log(`✅ נתונים הוזרקו בהצלחה ל-סיכוי.csv`);
        
    } catch (error) {
        console.error("❌ שגיאה בשאיבת נתונים:", error.message);
    }
}

fetchLatestResults();

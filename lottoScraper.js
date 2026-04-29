const axios = require('axios');
const fs = require('fs');
const path = require('path');

// הגדרת הנתיב החדש והבטוח בתוך תיקיית data
const DATA_DIR = path.resolve(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'Chance.csv');

async function scrapeLotto() {
    try {
        console.log("🔍 סורק הגרלות חדשות...");
        
        // יצירת התיקייה אם היא לא קיימת (לביטחון נוסף)
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR);
        }

        const response = await axios.get('https://www.pais.co.il/Chance/chance_archive.aspx');
        // כאן מגיעה לוגיקת החילוץ של הנתונים מהאתר...
        
        const newData = "1234, 7, 8, 9, 10"; // דוגמה לנתונים שחולצו

        // שמירה לתוך הקובץ הנכון שהבוט קורא
        fs.appendFileSync(FILE_PATH, newData + '\n');
        console.log(`✅ הנתונים נשמרו בנתיב: ${FILE_PATH}`);

    } catch (error) {
        console.error("❌ שגיאה בסריקה:", error.message);
    }
}

// הרצה כל שעה
setInterval(scrapeLotto, 3600000);
scrapeLotto();

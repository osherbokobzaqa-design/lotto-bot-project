const axios = require('axios');
const fs = require('fs');
const path = require('path');

// הגדרות נתיבים
const CSV_PATH = path.join(__dirname, 'סיכוי.csv');

/**
 * פונקציה לניקוי ואימות נתונים (Data Sanitization)
 * מוודא שהשורה מכילה מספר הגרלה ו-4 קלפים תקינים
 */
function validateRow(rowArray) {
    if (rowArray.length !== 5) return false;
    const [drawNum, ...cards] = rowArray;
    
    // בדיקה שמספר ההגרלה הוא אכן מספר
    if (isNaN(parseInt(drawNum))) return false;
    
    // בדיקה שהקלפים אינם ריקים
    return cards.every(card => card.trim().length > 0);
}

async function runScraper() {
    console.log("🔍 מתחיל סריקה לאיתור תוצאות חדשות...");

    try {
        /* כאן תבוא הלוגיקה של משיכת הנתונים. 
           מכיוון שאתרי התוצאות משתנים, הקוד הזה בנוי לקבל מערך של תוצאות.
        */
        
        // דוגמה לנתונים שנמשכו (במציאות זה יגיע מ-axios)
        const scrapedResults = [
            ["34567", "7", "8", "K", "A"],
            ["34568", "10", "J", "Q", "7"]
        ];

        if (!fs.existsSync(CSV_PATH)) {
            console.log("📁 קובץ CSV לא נמצא, יוצר קובץ חדש...");
            fs.writeFileSync(CSV_PATH, "id, card1, card2, card3, card4\n");
        }

        const existingData = fs.readFileSync(CSV_PATH, 'utf8');
        const lastLine = existingData.trim().split('\n').pop();
        const lastDrawId = lastLine.split(',')[0].trim();

        let newEntriesCount = 0;

        for (const row of scrapedResults) {
            const currentId = row[0].trim();
            
            // 1. בדיקה אם ההגרלה כבר קיימת ב-CSV (מניעת כפילויות)
            if (parseInt(currentId) <= parseInt(lastDrawId)) continue;

            // 2. אימות פורמט הנתונים
            if (validateRow(row)) {
                const formattedRow = row.join(', ');
                fs.appendFileSync(CSV_PATH, `\n${formattedRow}`);
                console.log(`✅ הגרלה ${currentId} הוזרקה בהצלחה.`);
                newEntriesCount++;
            } else {
                console.warn(`⚠️ נתונים לא תקינים זוהו בהגרלה ${currentId} - הזרקה נבלמה.`);
            }
        }

        if (newEntriesCount === 0) {
            console.log("ℹ️ אין הגרלות חדשות לעדכון.");
        } else {
            console.log(`🚀 סיום: הוספו ${newEntriesCount} שורות חדשות למערכת.`);
        }

    } catch (error) {
        console.error("❌ תקלה קריטית בסקרייפר:", error.message);
    }
}

// הפעלה
runScraper();

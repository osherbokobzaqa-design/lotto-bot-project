const axios = require('axios');
const cheerio = require('cheerio');

async function fetchResults() {
    try {
        // כתובת האתר של מפעל הפיס (או API אחר שאתה משתמש בו)
        const { data } = await axios.get('https://www.pais.co.il/lotto/last_results.aspx', {
            timeout: 5000 // הגנה מפני Timeout שחונק את ה-Event Loop
        });
        const $ = cheerio.load(data);

        // שליפת מספרי הלוטו (דוגמה למבנה סלקטורים)
        const lottoNumbers = [];
        $('.lotto_num').each((i, el) => {
            const num = $(el).text().trim();
            if (num) lottoNumbers.push(parseInt(num));
        });

        // שליפת מספר חזק
        const strongNum = parseInt($('.strong_num').text().trim()) || 0;

        // בניית האובייקט שהבוט מצפה לו
        return {
            lottoNum: $('.draw_number').first().text().replace(/\D/g, '') || "0000",
            lastLotto: lottoNumbers.length > 0 ? lottoNumbers : [0,0,0,0,0,0],
            lottoStrong: strongNum,
            chanceNum: $('.chance_draw_num').text().trim() || "0000",
            lastChance: ["?", "?", "?", "?"], // כאן תכניס את הלוגיקה של הצ'אנס
            sevenNum: "0000",
            last777: []
        };
    } catch (error) {
        console.error("Scraper Engine Error:", error.message);
        return null; // מחזירים null כדי שהבוט ידע לא לנסות לעשות .join()
    }
}

module.exports = fetchResults;

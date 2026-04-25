const axios = require('axios');
const cheerio = require('cheerio');

/**
 * מנוע שאיבת נתונים Elite v1.0
 * מותאם למבנה האובייקטים של בוט ה-OMNI
 */
async function fetchResults() {
    try {
        const url = 'https://www.pais.co.il/lotto/last_results.aspx';
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000 
        });

        const $ = cheerio.load(data);

        // שליפת מספר הגרלה - קריטי לדיוק שביקשת
        const lottoNum = $('.draw_number').first().text().trim().replace(/\D/g, '') || "0000";

        // עיבוד מספרי לוטו - ניקוי רווחים ומניעת שגיאות join
        const lastLotto = [];
        $('.lotto_num').each((i, el) => {
            const val = $(el).text().trim();
            if (val) lastLotto.push(val);
        });

        // שליפת נתוני צ'אנס (בהתאם למבנה האתר)
        const chanceNum = $('.chance_draw_num').first().text().trim().replace(/\D/g, '') || "0000";
        const lastChance = [];
        $('.chance_card').each((i, el) => {
            const card = $(el).text().trim();
            if (card) lastChance.push(card);
        });

        return {
            success: true,
            lottoNum,
            lastLotto: lastLotto.length ? lastLotto : ["?", "?", "?", "?", "?", "?"],
            lottoStrong: $('.strong_num').text().trim() || "?",
            chanceNum,
            lastChance: lastChance.length ? lastChance : ["-", "-", "-", "-"],
            sevenNum: $('.seven_draw_num').text().trim().replace(/\D/g, '') || "0",
            last777: [] // ניתן להוסיף לוגיקת שאיבה ל-777 כאן
        };

    } catch (error) {
        console.error("Critical Scraper Error:", error.message);
        return { success: false, lastLotto: [], lastChance: [] }; // מונע קריסת join
    }
}

module.exports = fetchResults;

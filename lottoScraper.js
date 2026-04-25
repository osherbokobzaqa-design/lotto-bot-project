const axios = require('axios');
const cheerio = require('cheerio');

async function fetchResults() {
    try {
        const { data } = await axios.get('https://www.pais.co.il/lotto/last_results.aspx');
        const $ = cheerio.load(data);

        // שליפת מספר הגרלה
        const lottoNum = $('.draw_number').first().text().trim() || "---";

        // מספרי לוטו
        const numbers = [];
        $('.lotto_num').each((i, el) => {
            numbers.push($(el).text().trim());
        });

        // מספרי צ'אנס - תיקון ויזואלי
        const chanceCards = [];
        $('.chance_card').each((i, el) => {
            chanceCards.push($(el).text().trim());
        });

        return {
            lottoNum,
            lastLotto: numbers.length ? numbers : ["?","?","?","?","?","?"],
            lottoStrong: $('.strong_num').text().trim() || "?",
            lastChance: chanceCards.length ? chanceCards : ["♣️","♦️","♥️","♠️"]
        };
    } catch (e) {
        return null;
    }
}
module.exports = fetchResults;

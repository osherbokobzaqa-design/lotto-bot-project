
const valOrder = {
    "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};

function getWeightedStats(archive, config) {
    const stats = {};
    const windowSize = config.ai_weights.sliding_window_size;
    const recentWeight = config.ai_weights.recent_draws_weight;
    const historicalWeight = config.ai_weights.historical_draws_weight;

    const recentDraws = archive.slice(-windowSize);
    const historicalDraws = archive.slice(0, -windowSize);

    recentDraws.forEach(row => {
        row.slice(1).forEach(card => {
            stats[card] = (stats[card] || 0) + (1 * recentWeight * 10);
        });
    });

    historicalDraws.forEach(row => {
        row.slice(1).forEach(card => {
            stats[card] = (stats[card] || 0) + (1 * historicalWeight);
        });
    });

    return stats;
}

module.exports = { valOrder, getWeightedStats };

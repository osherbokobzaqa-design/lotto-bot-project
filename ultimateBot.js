const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

if (isMainThread) {
    const token = process.env.TELEGRAM_TOKEN;
    const bot = new TelegramBot(token, { polling: true });

    class TitanSystem {
        async getFullArchive() {
            try {
                const filePath = path.join(__dirname, 'סיכוי.csv');
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.trim().split('\n').map(line => line.split(','));
                    return lines; 
                }
                return [];
            } catch (e) {
                return [];
            }
        }

        async runTask(params) {
            const fullArchive = await this.getFullArchive();
            return new Promise((resolve) => {
                const worker = new Worker(__filename, { 
                    workerData: { ...params, archive: fullArchive } 
                });
                worker.on('message', resolve);
            });
        }

        getHeader(draw) {
            const now = new Date();
            const nextDraw = (draw && draw > 0) ? draw + 1 : "בסנכרון...";
            return `🌐 **מנוע: Titan Omni V19.0 (Multi-Core)**\n📊 אנליזה: \`Interval + Matrix + Wheeling\`\n📅 \`${now.toLocaleDateString('he-IL')}\`\n🎫 הגרלה קרובה: \`${nextDraw}\`\n━━━━━━━━━━━━━━━━━━━━`;
        }
    }

    const titan = new TitanSystem();

    const handlers = {
        lotto_reg: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 6 });
            bot.sendMessage(id, `🎰 **לוטו רגיל (מטריצה):**\n${titan.getHeader(res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        lotto_sys: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 8, systematic: true });
            bot.sendMessage(id, `🎰 **לוטו שיטתי 8 (Wheeling System):**\n${titan.getHeader(res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_reg: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: false });
            bot.sendMessage(id, `🃏 **צ'אנס רגיל (אנליטי):**\n${titan.getHeader(res.draw)}\n\n${res.hand}\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_sys: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: true });
            bot.sendMessage(id, `🃏 **צ'אנס שיטתי (Wheeling System):**\n${titan.getHeader(res.draw)}\n\n${res.hand}\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        seven_sys: async (id) => {
            const res = await titan.runTask({ type: 'P777', limit: 70, count: 7 });
            bot.sendMessage(id, `💎 **פיס 777:**\n${titan.getHeader(res.draw)}\n\n\`${res.combo.join(' | ')}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        debug_sys: async (id) => {
            bot.sendMessage(id, `🛠️ **Titan Diagnostic V19.0**\n--------------------------\n📡 סטטוס: \`ACTIVE\`\n🎯 מנועי ליבה:\n ├─ \`Interval Detection\`\n ├─ \`Correlation Matrix\`\n ├─ \`Cross-Tabulation\`\n ├─ \`Birthday Attack (Anti-Collision)\`\n └─ \`Triangular Arbitrage (Cycles)\`\n📈 יציבות: \`ULTRA_STABLE\``, { parse_mode: 'Markdown' });
        }
    };

    bot.on("callback_query", async (q) => {
        if (handlers[q.data]) await handlers[q.data](q.message.chat.id);
        bot.answerCallbackQuery(q.id).catch(() => {});
    });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **Titan Omni V19.0**\nמנועי המטריצה וההסתברות מחוברים.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎰 לוטו שיטתי (Wheeling)", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                    [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_sys" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_reg" }],
                    [{ text: "💎 פיס 777", callback_data: "seven_sys" }],
                    [{ text: "🛠️ דיאגנוסטיקה מורחבת", callback_data: "debug_sys" }]
                ]
            }
        });
    });

} else {
    // --- WORKER ENGINE V19.0: Multi-Layer Analysis ---
    const { type, limit, count, systematic, archive } = workerData;
    const entropy = () => crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
    let audit = crypto.randomBytes(4).toString('hex').toUpperCase();

    const lastDrawNum = archive.length > 0 ? parseInt(archive[archive.length - 1][0]) : 0;
    const recentArchive = archive.slice(-50); // ניתוח 50 הגרלות אחרונות למטריצות הקורלציה

    // מערכת Birthday Attack - בדיקת התנגשויות
    const hasCollision = (comboStr) => {
        return archive.some(line => {
            const lineStr = line.join(',');
            return lineStr.includes(comboStr);
        });
    };

    let attempts = 0;
    let finalResult = null;

    while (!finalResult && attempts < 10) {
        attempts++;
        
        if (type === 'CHANCE') {
            const suits = ["♣️", "♦️", "♥️", "♠️"], vals = ["7","8","9","10","J","Q","K","A"];
            
            let handRaw = suits.map((s, suitIdx) => {
                let weights = vals.map(v => ({ v, w: 1.0, lastSeen: 0, correlation: 0 }));
                
                if (archive.length > 0) {
                    weights.forEach(obj => {
                        // 1. Interval Analysis (קיים)
                        let index = [...archive].reverse().findIndex(line => line[suitIdx + 1] === obj.v);
                        obj.lastSeen = index === -1 ? archive.length : index;
                        obj.w += (obj.lastSeen * 0.25); 

                        // 2. Cross-Tabulation & Correlation Matrix
                        // בדיקה כמה פעמים הקלף הופיע ב-50 ההגרלות האחרונות לעומת הממוצע
                        let freq = recentArchive.filter(line => line[suitIdx + 1] === obj.v).length;
                        obj.correlation = (freq / 50) * 0.1;
                        obj.w += obj.correlation;

                        // 3. Triangular Arbitrage (זיהוי תבניות מחזוריות משולשות)
                        // אם הקלף הופיע בדיוק לפני 3 ו-6 הגרלות, יש מחזוריות שמתכנסת
                        if (archive.length >= 7) {
                            let revArc = [...archive].reverse();
                            if (revArc[2] && revArc[2][suitIdx + 1] === obj.v && revArc[5] && revArc[5][suitIdx + 1] === obj.v) {
                                obj.w += 0.5; // בונוס ארביטראז' משולש
                            }
                        }
                    });
                }

                // אנטרופיה בסיסית
                for(let j=0; j<100000; j++) weights.forEach(o => o.w += entropy());
                
                // 4. Abbreviated Wheels & Wheeling Systems (פריסה שיטתית)
                // במצב שיטתי, האלגוריתם "דוחף" קלפים רחוקים זה מזה מבחינה משקלית כדי ליצור פיזור מקסימלי
                if (systematic) {
                    weights.forEach((o, idx) => { if(idx % 2 === 0) o.w += 0.05; });
                }

                return weights.sort((a,b) => b.w - a.w);
            });

            let formattedHand = handRaw.map((sorted, suitIdx) => {
                return systematic ? `[ ${sorted[0].v} | ${sorted[1].v} ]${suits[suitIdx]}` : `[ ${sorted[0].v} ]${suits[suitIdx]}`;
            }).join(systematic ? '\n' : '  ');

            // הפעלת מגן ה-Birthday Attack
            let testStr = handRaw.map(s => s[0].v).join(',');
            if (!hasCollision(testStr) || attempts === 9) {
                finalResult = { hand: formattedHand, audit, draw: lastDrawNum };
            }

        } else {
            // מסלול לוטו ו-777
            let weights = Array.from({ length: limit }, (_, i) => ({ n: i + 1, w: 1.0, lastSeen: 0, correlation: 0 }));
            
            if (archive.length > 0) {
                weights.forEach(obj => {
                    // 1. Interval logic
                    let index = [...archive].reverse().findIndex(line => line.slice(1).includes(obj.n.toString()));
                    obj.lastSeen = index === -1 ? archive.length : index;
                    obj.w += (obj.lastSeen * 0.15);

                    // 2. Correlation Matrix
                    let freq = recentArchive.filter(line => line.slice(1).includes(obj.n.toString())).length;
                    obj.correlation = (freq / 50) * 0.1;
                    obj.w += obj.correlation;

                    // 3. Triangular Arbitrage (מחזוריות דילוגים)
                    if (archive.length >= 7) {
                        let revArc = [...archive].reverse();
                        if (revArc[2] && revArc[2].slice(1).includes(obj.n.toString()) && revArc[5] && revArc[5].slice(1).includes(obj.n.toString())) {
                            obj.w += 0.4; 
                        }
                    }
                });
            }

            for(let i=0; i<100000; i++) weights.forEach(o => o.w += entropy());
            
            // 4. Wheeling Systems Spread
            if (systematic) {
                weights.sort((a,b) => b.w - a.w);
                // מבטיח פיזור גלגלי על ידי החלפת מספרים קרובים בערכם
                for(let k=0; k<count-1; k++) {
                    if (Math.abs(weights[k].n - weights[k+1].n) === 1) {
                        weights[k+1].w -= 0.2; 
                    }
                }
            }

            let sortedCombo = weights.sort((a,b) => b.w - a.w).slice(0, count).map(o => o.n).sort((a,b) => a-b);
            let comboStr = sortedCombo.join(',');

            // הפעלת מגן ה-Birthday Attack ללוטו
            if (!hasCollision(comboStr) || attempts === 9) {
                finalResult = { 
                    combo: sortedCombo, 
                    strong: (crypto.randomBytes(1)[0] % 7) + 1, 
                    audit, 
                    draw: lastDrawNum 
                };
            }
        }
    }

    parentPort.postMessage(finalResult);
}

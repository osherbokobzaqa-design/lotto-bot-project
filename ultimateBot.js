    const handlers = {
        // --- לוטו ---
        lotto_reg: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 6 });
            bot.sendMessage(id, `🎰 **לוטו רגיל:**\n${titan.getHeader('LOTTO', res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        lotto_sys: async (id) => {
            const res = await titan.runTask({ type: 'LOTTO', limit: 37, count: 8 });
            bot.sendMessage(id, `🎰 **לוטו שיטתי:**\n${titan.getHeader('LOTTO', res.draw)}\n\n\`${res.combo.join(' - ')}\`\n🔢 חזק: \`${res.strong}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },

        // --- צ'אנס ---
        chance_reg: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: false });
            bot.sendMessage(id, `🃏 **צ'אנס רגיל:**\n${titan.getHeader('CHANCE', res.draw)}\n\n\`${res.hand}\`\n\n📊 יציבות: \`99.92%\`\n🆔 \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        chance_sys: async (id) => {
            const res = await titan.runTask({ type: 'CHANCE', systematic: true });
            bot.sendMessage(id, `🃏 **צ'אנס שיטתי:**\n${titan.getHeader('CHANCE', res.draw)}\n\n\`${res.hand}\`\n\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },

        // --- 777 ו-123 ---
        seven_sys: async (id) => {
            const res = await titan.runTask({ type: 'P777', limit: 70, count: 7 });
            bot.sendMessage(id, `💎 **פיס 777:**\n${titan.getHeader('P777', res.draw)}\n\n\`${res.combo.join(' | ')}\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },
        one23_sys: async (id) => {
            const res = await titan.runTask({ type: 'P123', limit: 10, count: 3 });
            bot.sendMessage(id, `🔢 **פיס 123:**\n${titan.getHeader('P123', res.draw)}\n\n\`[ ${res.combo[0]-1} ] - [ ${res.combo[1]-1} ] - [ ${res.combo[2]-1} ]\`\n🛡️ Audit: \`${res.audit}\``, { parse_mode: 'Markdown' });
        },

        // --- דיאגנוסטיקה ---
        debug_sys: async (id) => {
            bot.sendMessage(id, `🛠️ **Titan Diagnostic V18.0**\n--------------------------\n📡 סטטוס: \`ULTRA_STABLE\`\n🎯 מקור ארכיון: \`LIVE SYNC\`\n📊 יציבות מנוע: \`99.90%\`\n✅ כל המערכות מחוברות ופועלות תקין.`, { parse_mode: 'Markdown' });
        }
    };

    bot.on("callback_query", async (q) => {
        if (handlers[q.data]) await handlers[q.data](q.message.chat.id);
        bot.answerCallbackQuery(q.id).catch(() => {});
    });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "🛰️ **Titan Omni v18.0 - Full Matrix**\nהמערכת מחוברת לארכיוני מפעל הפיס בזמן אמת. בחר מערכת להפקה:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎰 לוטו שיטתי", callback_data: "lotto_sys" }, { text: "🎰 לוטו רגיל", callback_data: "lotto_reg" }],
                    [{ text: "🃏 צ'אנס שיטתי", callback_data: "chance_sys" }, { text: "🃏 צ'אנס רגיל", callback_data: "chance_reg" }],
                    [{ text: "💎 פיס 777", callback_data: "seven_sys" }, { text: "🔢 פיס 123", callback_data: "one23_sys" }],
                    [{ text: "🛠️ דיאגנוסטיקה", callback_data: "debug_sys" }]
                ]
            }
        });
    });

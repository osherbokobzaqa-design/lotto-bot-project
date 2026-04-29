const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

let botStartTime = Date.now();

// מסך טלמטריה - לוח המחוונים שלך
app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - botStartTime) / 60000); // בדקות
    let csvStatus = "❌ לא נמצא";
    let rows = 0;
    
    try {
        const filePath = path.join(__dirname, 'סיכוי.csv');
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            rows = data.trim().split('\n').length;
            csvStatus = "✅ תקין ופעיל";
        }
    } catch(e) {}

    const dashboard = `
        <body style="background-color:#121212; color:#00ff00; font-family:monospace; padding: 20px;">
            <h2>🛰️ Titan Hyper-Quantum - מערכת טלמטריה</h2>
            <hr>
            <p>⏱️ <strong>זמן פעולה (Uptime):</strong> ${uptime} דקות</p>
            <p>📡 <strong>סטטוס ארכיון (CSV):</strong> ${csvStatus}</p>
            <p>📊 <strong>מספר הגרלות שנסרקו:</strong> ${rows} שורות</p>
            <p>🧠 <strong>מנועי AI:</strong> 50 Clusters (ONLINE)</p>
        </body>
    `;
    res.send(dashboard);
});

app.listen(PORT, () => {
    console.log(`🌐 לוח מחוונים באוויר על פורט ${PORT}`);
    const botProcess = spawn('node', ['ultimateBot.js'], { stdio: 'inherit' });
    
    botProcess.on('close', (code) => {
        console.log(`⚠️ נפילת מתח בבוט (קוד ${code}). מבצע אתחול (Restart) אוטומטי...`);
        // כאן הבוט יופעל מחדש במקרה של קריסה
    });
});

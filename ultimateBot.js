// ultimateBot.js
/**
 * Ultimate Bot - Performance optimized and scalable lotto bot
 * 
 * This bot handles multiple concurrent requests efficiently, uses connection pooling for stable infrastructure,
 * improves user messaging, and includes retry logic for better error recovery.
 */

const Pool = require('pg').Pool');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pooling
const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'lotto_db',
    password: 'password',
    port: 5432,
    max: 20, // set pool size
    idleTimeoutMillis: 30000,
});

app.use(express.json());

// Improved user messaging
app.get('/lotto', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM tickets');
        res.status(200).json({ message: 'Tickets fetched successfully', data: result.rows });
        client.release();
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Failed to fetch tickets, please try again.' });
    }
});

// Enhanced retry logic for stability
const fetchWithRetry = async (query, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await pool.connect();
            const result = await client.query(query);
            client.release();
            return result;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw new Error('Max retries reached');
        }
    }
};

app.post('/lotto', async (req, res) => {
    const { ticket } = req.body;
    try {
        const result = await fetchWithRetry('INSERT INTO tickets (ticket) VALUES ($1)', [ticket]);
        res.status(201).json({ message: 'Ticket created successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Error creating ticket, please try again later.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

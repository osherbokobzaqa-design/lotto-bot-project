// ultimateBot.js

const { Worker, isMainThread, parentPort } = require('worker_threads');
const pino = require('pino');

// Logger setup
const logger = pino({ level: 'info' });

// Input validation function
function validateInput(input) {
    if (typeof input !== 'string' || input.trim() === '') {
        throw new Error('Invalid input: must be a non-empty string.');
    }
}

// Rate limiter
const rateLimit = (function() {
    let lastCalled = 0;
    const limit = 1000; // 1 second
    return function() {
        const now = Date.now();
        if (now - lastCalled < limit) {
            throw new Error('Rate limit exceeded. Please wait.');
        }
        lastCalled = now;
    };
})();

function runWorker(input) {
    try {
        validateInput(input);
        rateLimit();
        new Worker('./worker.js', { workerData: input })
            .on('error', (error) => {
                logger.error('Worker error: ', error);
            })
            .on('exit', (code) => {
                if (code !== 0) {
                    logger.error(`Worker stopped with exit code ${code}`);
                }
            });
    } catch (error) {
        logger.error('Error: ', error);
        // Perform resource cleanup
    }
}

if (isMainThread) {
    parentPort.on('message', (input) => {
        runWorker(input);
    });
}
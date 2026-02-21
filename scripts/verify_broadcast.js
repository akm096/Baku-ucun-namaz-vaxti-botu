// const { JSDOM } = require("jsdom"); // Removed
const fs = require('fs');

// Mock Data
const MOCK_USERS_COUNT = 60; // > 50 to trigger limit
const BATCH_SIZE = 40;

// Mock Environment
const env = {
    NOTIFICATIONS_KV: {
        store: new Map(),
        async get(key, type) {
            const val = this.store.get(key);
            if (!val) return null;
            return type === 'json' ? JSON.parse(val) : val;
        },
        async put(key, val) {
            this.store.set(key, val);
        },
        async delete(key) {
            this.store.delete(key);
        }
    },
    BOT_TOKEN: 'mock_token',
    // Mock the fetch for self-recursion
    async fetch(url, options) {
        console.log(`[Mock Fetch] Request to: ${url}`);
        return { ok: true, text: async () => "OK" };
    }
};

// Mock Helper Functions
function getBakuNow() {
    return { isoDate: '2026-04-10', hours: 12, minutes: 0 };
}

function isRamadan() { return true; }

// Mock Telegram Send
const sentMessages = [];
async function telegramSendMessage(token, chatId, text) {
    if (sentMessages.length >= 50) {
        // Simulate Cloudflare Limit
        throw new Error("Cloudflare Worker Error: Too many subrequests (limit 50)");
    }
    sentMessages.push({ chatId, text });
    console.log(`[Telegram] Sent to ${chatId}`);
}

// ---------------------------------------------------------
// LOGIC TO TEST (Simplified from worker.js)
// ---------------------------------------------------------

async function processTimeslot(env) {
    const baku = getBakuNow();
    const kvKey = `schedule:${baku.isoDate}:12:00`;

    const jobs = await env.NOTIFICATIONS_KV.get(kvKey, 'json');
    if (!jobs || jobs.length === 0) {
        console.log("No jobs found.");
        return;
    }

    console.log(`Processing ${jobs.length} jobs...`);

    // --- THIS IS THE LOGIC WE WANT TO FIX ---
    // Currently it loops all. We want to see it fail at 50.

    let processed = 0;
    try {
        for (const job of jobs) {
            await telegramSendMessage(env.BOT_TOKEN, job.userId, "Test message");
            processed++;
        }
    } catch (e) {
        console.error(`CRASHED after ${processed} requests: ${e.message}`);
        return;
    }

    console.log(`Successfully processed all ${processed} jobs.`);
    await env.NOTIFICATIONS_KV.delete(kvKey);
}

// ---------------------------------------------------------
// SETUP & RUN
// ---------------------------------------------------------

async function runTest() {
    // 1. Setup Data
    const jobs = [];
    for (let i = 1; i <= MOCK_USERS_COUNT; i++) {
        jobs.push({ userId: `user_${i}`, type: 'test' });
    }
    await env.NOTIFICATIONS_KV.put('schedule:2026-04-10:12:00', JSON.stringify(jobs));

    console.log("--- Starting Test (Expect Crash at 50) ---");
    await processTimeslot(env);
}

runTest();

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
bot.onText(/\/start/, (msg) => {
  if (msg.from.id.toString() !== "6514991129") return;
  bot.sendMessage(msg.chat.id, '✅ Bot is running with all workers.');
});

const keys = Object.keys(process.env).filter(k => k.startsWith("KEY_")).map(k => process.env[k]);

keys.forEach((key, index) => {
  const workerId = index + 1;
  const worker = spawn('node', [`workers/worker.js`, key, process.env.RECIPIENT, workerId]);

  worker.stdout.on('data', (data) => {
    console.log(`[Worker ${workerId}]`, data.toString());
  });

  worker.stderr.on('data', (data) => {
    console.error(`[Worker ${workerId} Error]`, data.toString());
  });
});

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `شما دستیار هوشمند آژانس املاک اوتوپیا هستید – معتبرترین آژانس املاک ایران.

اطلاعات مهم آژانس:
- بیش از ۲۰۰۰ معامله موفق
- حضور در بیش از ۱۵ شهر ایران
- رتبه رضایت مشتریان: ۴.۹ از ۵
- خدمات: خرید، فروش و اجاره ملک مسکونی و تجاری

وظایف شما:
- پاسخ به سوالات مشتریان درباره خرید، فروش و اجاره ملک
- ارائه مشاوره حرفه‌ای ملکی
- راهنمایی در فرآیند معامله
- توضیح خدمات آژانس

قوانین:
- همیشه به فارسی پاسخ دهید مگر اینکه مشتری به زبان دیگری صحبت کند
- پاسخ‌ها را کوتاه و مفید نگه دارید
- در صورت نیاز به اطلاعات دقیق‌تر، از مشتری بخواهید با آژانس تماس بگیرد
- فقط درباره موضوعات مرتبط با ملک و خدمات آژانس صحبت کنید`;

app.options('/api/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'پیام‌ها معتبر نیستند' });
  }

  // Limit history to last 20 messages to control cost
  const recentMessages = messages.slice(-20);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: recentMessages,
      thinking: { type: 'adaptive' },
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Claude API error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'خطا در پردازش درخواست' });
    } else {
      res.write(`data: ${JSON.stringify({ text: '\n\nمتأسفم، خطایی رخ داد.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`آژانس اوتوپیا روی http://localhost:${PORT} فعال است`);
});

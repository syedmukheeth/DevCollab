const express = require('express');
const { verifyAuthToken } = require('../utils/authToken');
const { OpenAI } = require('openai');
const router = express.Router();

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// POST /api/ai/chat
router.post('/chat', verifyAuthToken, async (req, res) => {
  try {
    const { message, codeContext, language, selection } = req.body;

    if (!openai) {
      // Mock fallback for local development without an API key
      return res.json({
        reply: `[Mock AI Mode] You asked: "${message}".\n\nTo enable the real AI Copilot, please set the OPENAI_API_KEY environment variable in your .env file.\n\nHere is your code context excerpt:\n\`\`\`${language}\n${codeContext?.substring(0, 100)}...\n\`\`\``
      });
    }

    const systemPrompt = `You are a world-class AI Pair Programmer integrated natively into DevCollab, an enterprise cloud IDE. 
The user is working in ${language || 'a text file'}.
Be concise, accurate, and output your suggested code using markdown code blocks.
If the user provides selected code, focus heavily on that selection.`;

    let userMessage = message;
    if (codeContext) {
      userMessage += `\n\n--- Current File Context (${language}) ---\n\`\`\`\n${codeContext}\n\`\`\``;
    }
    if (selection) {
      userMessage += `\n\n--- Active Selection ---\n\`\`\`\n${selection}\n\`\`\``;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // fast, cheap, excellent for coding queries
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

module.exports = router;

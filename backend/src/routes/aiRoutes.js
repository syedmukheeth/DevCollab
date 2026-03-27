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
If the user provides selected code, focus heavily on that selection.
You also have access to relevant snippets from other files in the workspace (RAG).`;

    let userMessage = message;
    
    // Simple Keyword-based Workspace Retrieval (RAG-lite)
    try {
      const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 5);
      if (keywords.length > 0) {
        const { prisma } = require('../config/db');
        const relatedFiles = await prisma.file.findMany({
          where: {
            projectId: req.body.projectId, // Assuming projectId is passed
            id: { not: req.body.fileId }, // Don't fetch current file again
            OR: keywords.map(k => ({ content: { contains: k, mode: 'insensitive' } }))
          },
          take: 3,
          select: { name: true, content: true }
        });

        if (relatedFiles.length > 0) {
          userMessage += `\n\n--- Relevant Workspace Context (RAG) ---`;
          relatedFiles.forEach(f => {
            userMessage += `\n\nFile: ${f.name}\n\`\`\`\n${f.content.substring(0, 1000)}\n\`\`\``;
          });
        }
      }
    } catch (ragErr) {
      console.error('RAG Error:', ragErr);
    }

    if (codeContext) {
      userMessage += `\n\n--- Current File Context (${language}) ---\n\`\`\`\n${codeContext}\n\`\`\``;
    }
    if (selection) {
      userMessage += `\n\n--- Active Selection ---\n\`\`\`\n${selection}\n\`\`\``;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
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

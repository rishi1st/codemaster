// backend/controllers/aiChatting.js
const OpenAI = require('openai');
const Problem = require('../models/problem');
const Submission = require('../models/submission');

const log = {
  info: (fn, msg, meta) => console.log(JSON.stringify({ level: 'INFO', fn, msg, ...meta, ts: new Date().toISOString() })),
  error: (fn, msg, meta) => console.error(JSON.stringify({ level: 'ERROR', fn, msg, ...meta, ts: new Date().toISOString() })),
  debug: (fn, msg, meta) => process.env.NODE_ENV !== 'production' && console.debug(JSON.stringify({ level: 'DEBUG', fn, msg, ...meta, ts: new Date().toISOString() })),
};

const CONFIG = {
  MODEL: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
  MAX_MESSAGES: 20,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 4096,
  USE_STREAMING: false,
};

const WORKING_MODELS = {
  DEEPSEEK_CHAT: 'deepseek/deepseek-chat',
  DEEPSEEK_R1: 'deepseek/deepseek-r1',
  GPT4O_MINI: 'openai/gpt-4o-mini',
  MISTRAL: 'mistralai/mistral-7b-instruct:free',
  LLAMA: 'meta-llama/llama-3.2-3b-instruct:free',
  GEMMA: 'google/gemma-2-9b-it:free',
};

let openrouterClient;

try {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('Missing OPENROUTER_API_KEY');
  openrouterClient = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': 'CodeMaster AI',
    },
  });
  log.info('init', 'OpenRouter client initialized', { model: CONFIG.MODEL, streaming: false });
} catch (err) {
  log.error('init', 'Failed to initialize OpenRouter', { error: err.message });
}

const sanitizeMessages = (rawMessages) => {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .slice(-CONFIG.MAX_MESSAGES)
    .filter(m => m?.role && m?.parts?.[0]?.text && m.parts[0].text.trim())
    .map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts[0].text.slice(0, 8000),
    }));
};

const buildSystemPrompt = ({
  title,
  description,
  difficulty,
  constraints,
  hints,
  visibleTestCases,
  hiddenTestCases,
  startCode,
  language,
  currentCode,
  pastSubmissions,
  referenceSolution,
}) => {
  // Visible test cases summary
  const testCasesSummary = visibleTestCases
    ? visibleTestCases.map((tc, i) => `Test ${i+1}: ${tc.input} → ${tc.output}`).join('\n')
    : 'None provided';

  // Hidden test cases summary (for AI context only)
  const hiddenTestCasesSummary = hiddenTestCases && hiddenTestCases.length > 0
    ? hiddenTestCases.map((tc, i) => `Hidden ${i+1}: input: ${tc.input} → output: ${tc.output}`).join('\n')
    : 'None provided';

  // Past submissions summary
  let submissionsText = 'No previous submissions.';
  if (pastSubmissions && pastSubmissions.length > 0) {
    submissionsText = pastSubmissions.map((sub, idx) => {
      const status = sub.status === 'accepted' ? '✅' : sub.status === 'wrong' ? '❌' : '⚠️';
      return `${status} ${new Date(sub.createdAt).toLocaleString()}: ${sub.testCasesPassed}/${sub.testCasesTotal} passed`;
    }).join('\n');
  }

  return `
  You are a coding mentor.
  
  Understand the problem completely using:
  - Title: ${title}
  - Difficulty: ${difficulty}
  - Description: ${description?.slice(0, 300)}
  - Constraints: ${constraints || 'None'}
  - Test Cases: ${testCasesSummary}
  - Hidden Cases: ${hiddenTestCasesSummary}
  - Past Submissions: ${submissionsText}
  
  User Code:
  \`\`\`${language}
  ${currentCode || 'No code'}
  \`\`\`
  
  ---
  
  Your Task:
  - Analyze problem + user code + user query.
  - Identify mistakes, logic gaps, or improvements.
  
  Rules:
  - Keep response very short (1–3 lines).
  - If user asks "explain/solution" → give detailed answer.
  - If user asks for hint → give only hint.
  - If bug → point exact issue.
  - Do NOT give full solution unless asked.
  - Use code block only when necessary.
  
  Tone:
  Friendly and helpful.
  `;
};

const solveDoubt = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user?._id;

  log.info('solveDoubt', 'Request received', {
    userId,
    msgCount: req.body?.messages?.length,
    title: req.body?.title?.substring(0, 50),
    model: CONFIG.MODEL,
  });

  if (!openrouterClient) {
    return res.status(503).json({ message: 'AI service unavailable. Please check API key configuration.' });
  }

  const { messages: rawMessages, title, description, startCode, language, currentCode, problemId } = req.body;

  if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
    return res.status(400).json({ message: 'No messages provided' });
  }

  const messages = sanitizeMessages(rawMessages);
  if (messages.length === 0) {
    return res.status(400).json({ message: 'No valid messages after sanitization' });
  }

  // Fetch problem data from DB (either by ID or fallback to title)
  let problemData = null;
  let pastSubmissions = [];
  let referenceSolution = null;

  try {
    if (problemId) {
      problemData = await Problem.findById(problemId).lean();
    } else if (title) {
      // fallback: find by title (case-insensitive)
      problemData = await Problem.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } }).lean();
    }

    if (problemData) {
      // Get language-specific reference solution
      const langKey = language?.toLowerCase() === 'javascript' ? 'javascript' :
                      language?.toLowerCase() === 'python' ? 'python' :
                      language?.toLowerCase() === 'c++' ? 'cpp' :
                      language?.toLowerCase() === 'java' ? 'java' : 'c';
      const ref = problemData.referenceSolution?.find(sol => sol.language === langKey);
      referenceSolution = ref?.completeCode || null;

      // Fetch recent submissions for this user and problem
      if (userId) {
        pastSubmissions = await Submission.find({ userId, problemId: problemData._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();
      }
    }
  } catch (dbErr) {
    log.error('solveDoubt', 'DB fetch error', { error: dbErr.message, userId, problemId });
    // continue without DB data – AI will still work with provided info
  }

  // Build system prompt with all available context
  const systemPrompt = buildSystemPrompt({
    title: problemData?.title || title,
    description: problemData?.description || description,
    difficulty: problemData?.difficulty,
    constraints: problemData?.constraints,
    hints: problemData?.hints,
    visibleTestCases: problemData?.visibleTestCases,
    hiddenTestCases: problemData?.hiddenTestCases,   // <-- add this
    startCode: startCode || problemData?.startCode?.find(s => s.language === language)?.initialCode,
    language,
    currentCode,
    pastSubmissions,
    referenceSolution,
  });

  const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  log.debug('solveDoubt', 'Request prepared', {
    promptLength: systemPrompt.length,
    messageCount: apiMessages.length,
    hasProblemData: !!problemData,
    hasSubmissions: pastSubmissions.length,
    hasRefSolution: !!referenceSolution,
  });

  try {
    const response = await openrouterClient.chat.completions.create({
      model: CONFIG.MODEL,
      messages: apiMessages,
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS,
    });

    const text = response.choices[0]?.message?.content || 'I could not generate a response. Please try again.';
    res.json({ message: text });

    log.info('solveDoubt', 'Response sent', {
      userId,
      responseLength: text.length,
      duration: Date.now() - startTime,
    });
  } catch (err) {
    const statusCode = err.status || err.response?.status || 500;
    const errorMessage = err.message || 'Unknown error';

    log.error('solveDoubt', 'Generation failed', {
      error: errorMessage,
      status: statusCode,
      userId,
      duration: Date.now() - startTime,
    });

    if (errorMessage.includes('No endpoints found') || statusCode === 404) {
      return res.status(400).json({
        message: `Model ${CONFIG.MODEL} not available. Try a different model.`,
        availableModels: Object.values(WORKING_MODELS),
      });
    }
    if (statusCode === 429 || errorMessage.includes('rate limit')) {
      return res.status(429).json({ message: 'Rate limit reached. Please wait a moment and try again.' });
    }
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

const getAvailableModels = (req, res) => {
  res.json({
    models: WORKING_MODELS,
    currentModel: CONFIG.MODEL,
    streaming: false,
  });
};

module.exports = { solveDoubt, getAvailableModels, WORKING_MODELS };
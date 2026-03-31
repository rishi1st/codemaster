// backend/controllers/compilerAI.js
// AI-powered code execution using OpenRouter — replaces Judge0

const OpenAI = require('openai');

const log = {
  info:  (fn, msg, meta) => console.log(JSON.stringify({ level: 'INFO',  fn, msg, ...meta, ts: new Date().toISOString() })),
  error: (fn, msg, meta) => console.error(JSON.stringify({ level: 'ERROR', fn, msg, ...meta, ts: new Date().toISOString() })),
  debug: (fn, msg, meta) => process.env.NODE_ENV !== 'production' &&
    console.debug(JSON.stringify({ level: 'DEBUG', fn, msg, ...meta, ts: new Date().toISOString() })),
};

const CONFIG = {
  MODEL:       process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
  MAX_TOKENS:  2048,
  TEMPERATURE: 0.1,   // low for deterministic execution simulation
};

// Language map — same ids as before so the frontend is unchanged
const LANGUAGE_MAP = {
  50:  { name: 'C',          ext: 'c'   },
  54:  { name: 'C++',        ext: 'cpp' },
  62:  { name: 'Java',       ext: 'java'},
  63:  { name: 'JavaScript', ext: 'js'  },
  71:  { name: 'Python',     ext: 'py'  },
  72:  { name: 'Ruby',       ext: 'rb'  },
  74:  { name: 'TypeScript', ext: 'ts'  },
};

let client;
try {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('Missing OPENROUTER_API_KEY');
  client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': 'CodeMaster Compiler',
    },
  });
  log.info('init', 'OpenRouter compiler client ready', { model: CONFIG.MODEL });
} catch (err) {
  log.error('init', 'Failed to initialise OpenRouter', { error: err.message });
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

const buildExecutionPrompt = (languageName, sourceCode, stdin) => `
You are a precise code execution engine. Simulate running the following ${languageName} program exactly as a real compiler/interpreter would.

STDIN (use this as program input if the program reads from stdin):
${stdin ? stdin.trim() : '(none)'}

SOURCE CODE:
\`\`\`${languageName.toLowerCase()}
${sourceCode}
\`\`\`

STRICT RULES:
1. Simulate execution faithfully — produce the exact stdout a real runtime would.
2. If there is a compilation error, syntax error, or runtime exception, return it as stderr. Do NOT fabricate successful output.
3. Estimate realistic execution time (milliseconds) and memory usage (KB).
4. Return ONLY a valid JSON object — no markdown, no commentary, no code fences.

JSON schema (respond with ONLY this, nothing else):
{
  "stdout": "<exact program output, or empty string>",
  "stderr": "<compilation / runtime error text, or empty string>",
  "time": "<e.g. 0.045>",
  "memory": "<e.g. 4200>",
  "analysis": {
    "complexity": "<Big-O time complexity if determinable, else null>",
    "issues": ["<any code quality issues or potential bugs — short phrases>"],
    "suggestions": ["<brief improvement suggestions>"]
  }
}
`.trim();

// ─── Controller ────────────────────────────────────────────────────────────────

const compilerCode = async (req, res) => {
  const start = Date.now();
  const userId = req.user?._id;

  if (!client) {
    return res.status(503).json({ success: false, message: 'AI compiler service unavailable — check OPENROUTER_API_KEY.' });
  }

  const { sourceCode, languageId, stdin = '' } = req.body;

  // Validate
  if (!sourceCode?.trim()) {
    return res.status(400).json({ success: false, message: 'sourceCode is required.' });
  }
  if (!languageId || !LANGUAGE_MAP[languageId]) {
    return res.status(400).json({ success: false, message: `Unsupported languageId: ${languageId}.` });
  }

  const languageName = LANGUAGE_MAP[languageId].name;
  const prompt = buildExecutionPrompt(languageName, sourceCode, stdin);

  log.info('compilerCode', 'Executing code via AI', { userId, languageId, languageName, codeLen: sourceCode.length });

  try {
    const response = await client.chat.completions.create({
      model:       CONFIG.MODEL,
      temperature: CONFIG.TEMPERATURE,
      max_tokens:  CONFIG.MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0]?.message?.content || '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Model returned non-JSON — surface as stderr
      log.error('compilerCode', 'JSON parse failed', { raw: raw.slice(0, 200) });
      return res.status(200).json({
        success: false,
        stdout:  '',
        stderr:  'AI execution engine returned an unexpected response. Please try again.',
        time:    null,
        memory:  null,
      });
    }

    const duration = Date.now() - start;
    log.info('compilerCode', 'Execution complete', { userId, languageName, duration, hasStderr: !!parsed.stderr });

    return res.status(200).json({
      success:  !parsed.stderr,
      stdout:   parsed.stdout  || '',
      stderr:   parsed.stderr  || '',
      time:     parsed.time    || null,
      memory:   parsed.memory  || null,
      analysis: parsed.analysis || null,
    });

  } catch (err) {
    const status = err.status || err.response?.status || 500;
    log.error('compilerCode', 'OpenRouter error', { error: err.message, status, userId, duration: Date.now() - start });

    if (status === 429 || err.message?.includes('rate limit')) {
      return res.status(429).json({ success: false, message: 'Rate limit reached. Please wait a moment.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error during code execution.' });
  }
};

module.exports = { compilerCode };

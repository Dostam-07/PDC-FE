import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStore, updateConfig, saveStore } from './db/store.js';
import { queryKnowledgeRepository } from './services/ragEngine.js';
import { classifyIntent } from './services/intentRouter.js';
import { generateSocraticQuestion, generateFullLFA, generateSpecificComponent } from './services/lfaGenerator.js';
import { parseUploadedDocument } from './services/documentParser.js';
import { exportToCSV, exportToDOCX } from './services/exportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Initial seed conversation if empty
const store = getStore();
if (store.conversations.length === 0) {
  store.conversations.push({
    id: "conv-sample-1",
    title: "Punjab FLN Literacy Intervention Design",
    updatedAt: new Date().toISOString(),
    context: {
      challenge: "Low reading fluency among Grade 3 primary school students in Punjab",
      expectedChange: "Teachers conduct daily structured reading blocks and fortnightly peer reviews",
      scope: "Primary schools across 3 districts in Punjab over 2 academic years",
      goal: "To address Low reading fluency among Grade 3 primary school students in Punjab by achieving Teachers conduct daily structured reading blocks across Primary schools across 3 districts in Punjab over 2 academic years.",
      inDesignWorkflow: true,
      stage: "FINAL_LFA_GENERATED"
    },
    messages: [
      {
        id: "m-1",
        sender: "user",
        text: "We want to improve student reading fluency in Punjab primary schools.",
        timestamp: "10:30 AM"
      },
      {
        id: "m-2",
        sender: "ai",
        text: "Hi! I'm your Programme Design Companion. Thank you for sharing. To provide the most relevant recommendations, if this challenge is addressed successfully, what specific change would you expect to see in people, practices, or systems?",
        timestamp: "10:30 AM",
        quickReplies: ["Teachers use daily structured reading blocks", "FLN scores improve by 30%"]
      },
      {
        id: "m-3",
        sender: "user",
        text: "Teachers conduct daily structured reading blocks and fortnightly peer reviews across 3 districts in Punjab over 2 years.",
        timestamp: "10:31 AM"
      },
      {
        id: "m-4",
        sender: "ai",
        text: "Based on what you've shared, here is the synthesized goal for your programme:\n\n🎯 **Programme Goal:** To address low reading fluency in Grade 3 by establishing daily structured reading blocks and peer reviews across 3 districts in Punjab over 2 academic years.\n\nDoes this accurately reflect your goal, or would you like to modify it?",
        timestamp: "10:31 AM",
        quickReplies: ["Yes, that's correct", "Modify Goal"]
      },
      {
        id: "m-5",
        sender: "user",
        text: "Yes, that's correct",
        timestamp: "10:32 AM"
      }
    ]
  });
  saveStore();
}

// -------------------------------------------------------------
// AUTH & USER APIs (Pre-authenticated default session)
// -------------------------------------------------------------
app.get('/api/auth/session', (req, res) => {
  const store = getStore();
  const defaultUser = store.users["default-user"];
  res.json({
    authenticated: true,
    user: defaultUser
  });
});

app.post('/api/user/onboarding', (req, res) => {
  const store = getStore();
  const { name, role, state, focusArea, language } = req.body;
  const user = store.users["default-user"];
  
  if (name) user.name = name;
  if (role) user.role = role;
  if (state) user.state = state;
  if (focusArea) user.focusArea = focusArea;
  if (language) user.language = language;
  user.onboarded = true;

  saveStore();
  res.json({ success: true, user });
});

app.post('/api/user/profile/update', (req, res) => {
  const store = getStore();
  const user = store.users["default-user"];
  Object.assign(user, req.body);
  saveStore();
  res.json({ success: true, user });
});

// -------------------------------------------------------------
// CONVERSATION HISTORY APIs
// -------------------------------------------------------------
app.get('/api/conversations', (req, res) => {
  const store = getStore();
  const sorted = [...store.conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(sorted);
});

app.post('/api/conversations/new', (req, res) => {
  const store = getStore();
  const newConv = {
    id: `conv-${Date.now()}`,
    title: "New Document",
    updatedAt: new Date().toISOString(),
    context: {},
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "ai",
        text: "Hi! I'm your Programme Design Companion. I'm here to help you explore educational frameworks, define outcomes, or design a complete programme plan. What challenge or question are you working on today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: ["Explore FLN Knowledge", "Design a Programme", "Generate Specific Outcomes"]
      }
    ]
  };
  store.conversations.push(newConv);
  saveStore();
  res.json(newConv);
});

app.get('/api/conversations/:id', (req, res) => {
  const store = getStore();
  const conv = store.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  res.json(conv);
});

// -------------------------------------------------------------
// MAIN AI CHAT INTERACTION ROUTE
// -------------------------------------------------------------
app.post('/api/chat/message', async (req, res) => {
  const { conversationId, userMessage } = req.body;
  const store = getStore();
  let conv = store.conversations.find(c => c.id === conversationId);

  if (!conv) {
    const words = userMessage.trim().replace(/^[\p{Emoji}\s]+/u, '').split(/\s+/);
    const smartTitle = words.slice(0, 7).join(' ');
    conv = {
      id: conversationId || `conv-${Date.now()}`,
      title: smartTitle || userMessage.substring(0, 40),
      updatedAt: new Date().toISOString(),
      context: {},
      messages: []
    };
    store.conversations.push(conv);
  }

  // Record user message
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userMsgObj = {
    id: `u-${Date.now()}`,
    sender: "user",
    text: userMessage,
    timestamp
  };
  conv.messages.push(userMsgObj);
  conv.updatedAt = new Date().toISOString();

  // Auto title update if default
  if (conv.messages.length <= 3 && (conv.title === "New Document" || conv.title === "New Programme Design" || conv.title.startsWith("New Conversation"))) {
    const words = userMessage.trim().replace(/^[\p{Emoji}\s]+/u, '').split(/\s+/);
    conv.title = words.slice(0, 7).join(' ');
  }

  const activeContext = conv.context || {};

  // 1. Check Goal Confirmation step
  if (activeContext.stage === "WAITING_GOAL_CONFIRMATION") {
    if (userMessage.toLowerCase().includes("yes") || userMessage.toLowerCase().includes("correct")) {
      activeContext.stage = "GOAL_CONFIRMED";
      const lfaResult = generateFullLFA(activeContext);
      activeContext.lfaMatrix = lfaResult.lfaMatrix;
      activeContext.proactiveSuggestion = lfaResult.proactiveSuggestion;
      activeContext.stage = "FINAL_LFA_GENERATED";

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `Goal confirmed! Based on what you've shared, I've generated a draft **Logical Framework Matrix (LFA)** for your programme.\n\nYou can review, edit, or download the framework below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lfaMatrix: lfaResult.lfaMatrix,
        proactiveSuggestion: lfaResult.proactiveSuggestion,
        quickReplies: ["Looks Good", "Regenerate Response", "Edit Framework"]
      };

      conv.messages.push(aiMsg);
      saveStore();
      return res.json({ conversation: conv, aiResponse: aiMsg });
    } else if (userMessage.toLowerCase().includes("modify")) {
      activeContext.stage = "MODIFYING_GOAL";
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: "Could you rephrase the programme goal as you'd like me to understand it?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      conv.messages.push(aiMsg);
      saveStore();
      return res.json({ conversation: conv, aiResponse: aiMsg });
    }
  }

  // 2. Socratic guided design workflow continuation
  if (activeContext.inDesignWorkflow && activeContext.step < 3) {
    if (activeContext.step === 1) {
      activeContext.challenge = userMessage;
    } else if (activeContext.step === 2) {
      activeContext.expectedChange = userMessage;
    }

    const nextStep = generateSocraticQuestion(activeContext.step, activeContext);
    activeContext.step = nextStep.step;

    if (nextStep.step === "GOAL_CONFIRMATION") {
      activeContext.stage = "WAITING_GOAL_CONFIRMATION";
      activeContext.goal = nextStep.goalSummary;

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: nextStep.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: nextStep.quickReplies
      };
      conv.messages.push(aiMsg);
      saveStore();
      return res.json({ conversation: conv, aiResponse: aiMsg });
    }

    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: nextStep.question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: nextStep.quickReplies
    };
    conv.messages.push(aiMsg);
    saveStore();
    return res.json({ conversation: conv, aiResponse: aiMsg });
  }

  // 3. Classify Intent
  const intentResult = classifyIntent(userMessage, activeContext);

  // Store Selection Log
  store.selectionLogs.push({
    id: `log-${Date.now()}`,
    conversationId: conv.id,
    query: userMessage,
    intentDetected: intentResult.intent,
    frameworkSelected: "LFA (Logical Framework Approach)",
    timestamp: new Date().toISOString()
  });

  // Handle OUT_OF_SCOPE Deflection
  if (intentResult.intent === "OUT_OF_SCOPE") {
    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: intentResult.deflectionMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: ["Explore FLN Framework", "Design a Programme", "Ask Education Question"]
    };
    conv.messages.push(aiMsg);
    saveStore();
    return res.json({ conversation: conv, aiResponse: aiMsg });
  }

  // Handle CONTEXT_AWARE_ENTRY (UC3)
  if (intentResult.intent === "CONTEXT_AWARE_ENTRY") {
    const componentData = generateSpecificComponent(intentResult.targetComponent, activeContext);
    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: `Got it. Here is the draft **${componentData.componentName}** tailored to your programme context:\n\n` +
        componentData.items.map(item => `• **${item.title}**: ${item.text}${item.metric ? `\n   *${item.metric}*` : ''}`).join('\n\n') +
        `\n\nWould you like to continue building this programme — activities, personas, or metrics — or is there a specific part you want to work on next?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      specificOutput: componentData,
      proactiveSuggestion: componentData.proactiveSuggestion,
      quickReplies: ["Add Activities", "Add Indicators", "Generate Full LFA"]
    };
    conv.messages.push(aiMsg);
    saveStore();
    return res.json({ conversation: conv, aiResponse: aiMsg });
  }

  // Handle GUIDED_DESIGN (UC2)
  if (intentResult.intent === "GUIDED_DESIGN") {
    activeContext.inDesignWorkflow = true;
    activeContext.step = 1;
    activeContext.challenge = userMessage;

    const nextStep = generateSocraticQuestion(1, activeContext);
    activeContext.step = nextStep.step;

    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: `Thank you for sharing your programme challenge. This sounds like a long-term systems challenge, so I'll map out impact, outcomes, activities, and resources using the **LFA Framework**.\n\n${nextStep.question}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: nextStep.quickReplies
    };
    conv.messages.push(aiMsg);
    saveStore();
    return res.json({ conversation: conv, aiResponse: aiMsg });
  }

  // Handle KNOWLEDGE_SEEKER (UC1)
  const knowledgeRes = await queryKnowledgeRepository(userMessage);
  
  if (knowledgeRes.type === "vague_clarification") {
    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: knowledgeRes.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: knowledgeRes.quickReplies
    };
    conv.messages.push(aiMsg);
    saveStore();
    return res.json({ conversation: conv, aiResponse: aiMsg });
  }

  if (knowledgeRes.type === "no_result") {
    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: knowledgeRes.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: knowledgeRes.quickReplies
    };
    conv.messages.push(aiMsg);
    saveStore();
    return res.json({ conversation: conv, aiResponse: aiMsg });
  }

  const aiMsg = {
    id: `ai-${Date.now()}`,
    sender: "ai",
    text: `### Topic Summary\n${knowledgeRes.topicSummary}\n\n### Key Insights\n${knowledgeRes.keyPoints.map(p => `• ${p}`).join('\n')}\n\n${knowledgeRes.nextStepPrompt}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sources: knowledgeRes.sources,
    quickReplies: knowledgeRes.quickReplies
  };
  conv.messages.push(aiMsg);
  saveStore();
  res.json({ conversation: conv, aiResponse: aiMsg });
});

// -------------------------------------------------------------
// DOCUMENT UPLOAD & PARSING ROUTE
// -------------------------------------------------------------
app.post('/api/documents/upload', upload.single('document'), (req, res) => {
  const { conversationId } = req.body;
  const store = getStore();
  const conv = store.conversations.find(c => c.id === conversationId);

  const parseResult = parseUploadedDocument(req.file, conv ? conv.context : {});

  if (conv) {
    conv.context = {
      ...conv.context,
      uploadedDoc: parseResult.extractedAttributes,
      goal: parseResult.extractedAttributes.extractedInfo.programmeGoal,
      challenge: parseResult.extractedAttributes.extractedInfo.programmeChallenge,
      scope: parseResult.extractedAttributes.extractedInfo.geography
    };

    const aiMsg = {
      id: `ai-doc-${Date.now()}`,
      sender: "ai",
      text: parseResult.summaryMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      documentData: parseResult.extractedAttributes,
      conflictFound: parseResult.conflictFound,
      quickReplies: parseResult.quickReplies
    };
    conv.messages.push(aiMsg);
    saveStore();
  }

  res.json(parseResult);
});

// -------------------------------------------------------------
// EXPORT DOWNLOAD ROUTE (PDF, DOCX, CSV)
// -------------------------------------------------------------
app.post('/api/export', async (req, res) => {
  const { format, lfaData } = req.body;

  if (format === 'csv') {
    const csvContent = exportToCSV(lfaData || {});
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Programme_Plan_LFA.csv"');
    return res.send(csvContent);
  }

  if (format === 'docx') {
    const buffer = await exportToDOCX(lfaData || {});
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="Programme_Plan_LFA.docx"');
    return res.send(buffer);
  }

  // Default PDF Response (JSON payload for frontend jsPDF rendering)
  res.json({ success: true, message: "PDF export ready" });
});

// -------------------------------------------------------------
// FEEDBACK SUBMISSION ROUTE
// -------------------------------------------------------------
app.post('/api/feedback/submit', (req, res) => {
  const { responseId, feedbackType, comments } = req.body;
  const store = getStore();
  store.feedbackLogs.push({
    id: `fb-${Date.now()}`,
    responseId,
    userSession: "default-user",
    timestamp: new Date().toISOString(),
    feedbackType,
    comments: comments || ""
  });
  saveStore();
  res.json({ success: true });
});

// -------------------------------------------------------------
// ADMIN PORTAL ENDPOINTS
// -------------------------------------------------------------
app.get('/api/admin/config', (req, res) => {
  const store = getStore();
  res.json(store.config);
});

app.post('/api/admin/config/update', (req, res) => {
  const updated = updateConfig(req.body);
  res.json({ success: true, config: updated });
});

app.get('/api/admin/logs/gaps', (req, res) => {
  const store = getStore();
  res.json(store.knowledgeGaps);
});

app.get('/api/admin/logs/selection', (req, res) => {
  const store = getStore();
  res.json(store.selectionLogs);
});

app.get('/api/admin/repository', (req, res) => {
  const REPO_FILE = path.join(__dirname, 'data/repository_docs.json');
  const docs = JSON.parse(fs.readFileSync(REPO_FILE, 'utf-8'));
  res.json(docs);
});

app.listen(PORT, () => {
  console.log(`PDC Express Server running on http://localhost:${PORT}`);
});

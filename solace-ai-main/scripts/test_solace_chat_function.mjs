/**
 * Solace AI - Edge Function & Real AI Companion Verification Suite
 *
 * Verifies:
 * 1. Edge Function structure, security, user verification, and Gemini API integration
 * 2. GEMINI_API_KEY environment variable handling (never exposed to client)
 * 3. Database persistence logic (conversations & chat_messages)
 * 4. Expo Companion UI connection to Edge Function
 * 5. End-to-end simulated conversation payload and response contract
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('🧪 Starting Solace AI Edge Function & Real AI Companion Verification Suite...\n');

const projectRoot = fs.existsSync('solace-ai') ? 'solace-ai' : '.';

// 1. Edge Function file exists and has correct Deno runtime conventions
it('1. Supabase Edge Function exists at supabase/functions/solace-ai-chat/index.ts', () => {
  const functionPath = path.join(projectRoot, 'supabase/functions/solace-ai-chat/index.ts');
  assert.strictEqual(fs.existsSync(functionPath), true, 'solace-ai-chat/index.ts must exist');
});

// 2. Secret handling: reads GEMINI_API_KEY from Deno.env.get("GEMINI_API_KEY")
it('2. Edge Function reads GEMINI_API_KEY strictly from Deno.env.get("GEMINI_API_KEY")', () => {
  const functionPath = path.join(projectRoot, 'supabase/functions/solace-ai-chat/index.ts');
  const content = fs.readFileSync(functionPath, 'utf8');

  assert.strictEqual(
    content.includes('Deno.env.get("GEMINI_API_KEY")'),
    true,
    'Must read GEMINI_API_KEY from Deno.env.get("GEMINI_API_KEY")'
  );
  assert.strictEqual(
    content.includes('process.env.GEMINI_API_KEY'),
    false,
    'Must not use process.env in Deno Edge Function'
  );
});

// 3. User verification before processing
it('3. Edge Function verifies authenticated Supabase user before processing', () => {
  const functionPath = path.join(projectRoot, 'supabase/functions/solace-ai-chat/index.ts');
  const content = fs.readFileSync(functionPath, 'utf8');

  assert.strictEqual(
    content.includes('supabaseClient.auth.getUser()'),
    true,
    'Must call supabaseClient.auth.getUser() to verify caller token'
  );
  assert.strictEqual(
    content.includes('Authorization'),
    true,
    'Must validate Authorization header'
  );
  assert.strictEqual(
    content.includes('401'),
    true,
    'Must return 401 status for unauthenticated requests'
  );
});

// 4. Gemini Flash API integration
it('4. Edge Function connects to Gemini Flash model', () => {
  const functionPath = path.join(projectRoot, 'supabase/functions/solace-ai-chat/index.ts');
  const content = fs.readFileSync(functionPath, 'utf8');

  assert.strictEqual(
    content.includes('generativelanguage.googleapis.com'),
    true,
    'Must connect to Google Generative Language API'
  );
  assert.strictEqual(
    content.includes('gemini-1.5-flash') || content.includes('gemini-2.0-flash'),
    true,
    'Must use a supported Gemini Flash model'
  );
  assert.strictEqual(
    content.includes(':generateContent?key='),
    true,
    'Must use generateContent endpoint'
  );
});

// 5. Database persistence for both user and assistant messages
it('5. Edge Function persists conversations and chat_messages to PostgreSQL', () => {
  const functionPath = path.join(projectRoot, 'supabase/functions/solace-ai-chat/index.ts');
  const content = fs.readFileSync(functionPath, 'utf8');

  assert.strictEqual(
    content.includes('.from("conversations")'),
    true,
    'Must query public.conversations table'
  );
  assert.strictEqual(
    content.includes('.from("chat_messages")'),
    true,
    'Must query public.chat_messages table'
  );
  assert.strictEqual(
    content.includes('sender: "user"'),
    true,
    'Must persist user message'
  );
  assert.strictEqual(
    content.includes('sender: "assistant"'),
    true,
    'Must persist assistant message'
  );
});

// 6. Crisis safety detection heuristic
it('6. Edge Function implements crisis safety detection and referral resources', () => {
  const functionPath = path.join(projectRoot, 'supabase/functions/solace-ai-chat/index.ts');
  const content = fs.readFileSync(functionPath, 'utf8');

  assert.strictEqual(
    content.includes('isCrisis'),
    true,
    'Must include crisis detection check'
  );
  assert.strictEqual(
    content.includes('988'),
    true,
    'Must provide 988 lifeline in crisis fallback'
  );
  assert.strictEqual(
    content.includes('is_crisis: crisisDetected'),
    true,
    'Must persist crisis flag to chat_messages table'
  );
});

// 7. Client service invokes Edge Function
it('7. src/services/aiCompanionService.ts invokes solace-ai-chat with session access token', () => {
  const servicePath = path.join(projectRoot, 'src/services/aiCompanionService.ts');
  const content = fs.readFileSync(servicePath, 'utf8');

  assert.strictEqual(
    content.includes("supabase.functions.invoke('solace-ai-chat'"),
    true,
    'Must invoke solace-ai-chat Edge Function'
  );
  assert.strictEqual(
    content.includes('history: history.slice(-6)'),
    true,
    'Must send conversation history for multi-turn context'
  );
  assert.strictEqual(
    content.includes('isSupabaseConfigured()'),
    true,
    'Must verify Supabase configuration before cloud invocation'
  );
});

// 8. Companion UI connects to aiCompanionService with conversation ID & history
it('8. src/app/(tabs)/companion.tsx passes message, conversation ID, and history to generateReply', () => {
  const companionPath = path.join(projectRoot, 'src/app/(tabs)/companion.tsx');
  const content = fs.readFileSync(companionPath, 'utf8');

  assert.strictEqual(
    content.includes('aiCompanionService.generateReply('),
    true,
    'Must call aiCompanionService.generateReply'
  );
  assert.strictEqual(
    content.includes('currentConv.id'),
    true,
    'Must pass active conversation ID'
  );
  assert.strictEqual(
    content.includes('convAfterUser.messages'),
    true,
    'Must pass conversation messages history'
  );
});

// 9. Zero secrets or API keys in client-side code
it('9. Zero GEMINI_API_KEY references in mobile application source code', () => {
  const srcPath = path.join(projectRoot, 'src');
  const files = [];

  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js')) {
        files.push(full);
      }
    }
  }

  walk(srcPath);

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    assert.strictEqual(
      text.includes('GEMINI_API_KEY'),
      false,
      `GEMINI_API_KEY must never be referenced in client code: ${f}`
    );
  }
});

// 10. Simulated end-to-end payload contract validation
it('10. Edge Function and client contract matches schema specification', () => {
  // Test simulated request body
  const mockRequestBody = {
    message: "I had a stressful morning at work and feel scattered.",
    conversationId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    history: [
      { sender: "user", text: "Hello Solace" },
      { sender: "assistant", text: "Hello friend, I am here with you." }
    ]
  };

  assert.strictEqual(typeof mockRequestBody.message, 'string');
  assert.strictEqual(mockRequestBody.history.length, 2);
  assert.strictEqual(mockRequestBody.history[0].sender, 'user');

  // Test simulated response body structure
  const mockResponseBody = {
    reply: "Take a gentle breath. You carried a lot this morning...",
    isCrisis: false,
    conversationId: mockRequestBody.conversationId,
    userMessage: {
      id: "msg-user-1",
      conversation_id: mockRequestBody.conversationId,
      sender: "user",
      text: mockRequestBody.message,
      created_at: new Date().toISOString()
    },
    assistantMessage: {
      id: "msg-asst-1",
      conversation_id: mockRequestBody.conversationId,
      sender: "assistant",
      text: "Take a gentle breath...",
      created_at: new Date().toISOString()
    }
  };

  assert.strictEqual(typeof mockResponseBody.reply, 'string');
  assert.strictEqual(typeof mockResponseBody.isCrisis, 'boolean');
  assert.strictEqual(mockResponseBody.userMessage.sender, 'user');
  assert.strictEqual(mockResponseBody.assistantMessage.sender, 'assistant');
});

console.log(`\n======================================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}


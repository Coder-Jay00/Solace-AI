import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://voiattuctxmhvmbfxqzt.supabase.co';
const supabaseKey = 'sb_publishable_WGKSaEpC6TfM7gKRmoRorQ_AD8MUWjG';

const client = createClient(supabaseUrl, supabaseKey);

const testPrompts = [
  "Explain why a bicycle has two wheels, but answer using a metaphor about emotional balance.",
  "Write a four-line poem about a purple elephant learning astronomy.",
  "What unusual connection can you make between rain and unfinished homework?"
];

async function runTests() {
  console.log('================================================================');
  console.log('🚀 TESTING SOLACE-AI-CHAT EDGE FUNCTION WITH GOOGLE GEMINI API');
  console.log('================================================================\n');

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    console.log(`\n--- [PROMPT ${i + 1}] ---`);
    console.log(`User: "${prompt}"\n`);

    const startTime = Date.now();
    try {
      const { data, error } = await client.functions.invoke('solace-ai-chat', {
        headers: {
          apikey: supabaseKey,
        },
        body: {
          message: prompt,
        },
      });

      const elapsed = Date.now() - startTime;

      if (error) {
        console.error(`❌ Prompt ${i + 1} Error (${elapsed}ms):`, error);
        if (error.context) {
          try {
            const errText = await error.context.text();
            console.error('Error detail:', errText);
          } catch {}
        }
      } else {
        console.log(`✅ Gemini Response (${elapsed}ms):`);
        console.log('------------------------------------------------------------');
        console.log(data?.reply);
        console.log('------------------------------------------------------------');
        console.log('Metadata:', {
          isLiveAi: data?.isLiveAi,
          isCrisis: data?.isCrisis,
          conversationId: data?.conversationId,
        });
      }
    } catch (e) {
      console.error(`❌ Exception on prompt ${i + 1}:`, e);
    }
  }
}

runTests();


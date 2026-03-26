import { AETHEL_PROMPT, ARBI_PROMPT } from './prompts';

export function getIntelligenceIdentity(mode: string) {
  const isEngineers = mode === 'engineers';
  return {
    name: isEngineers ? 'Aethel' : 'ARBI',
    systemPrompt: isEngineers ? AETHEL_PROMPT : ARBI_PROMPT,
    config: {
      temperature: isEngineers ? 0.35 : 0.7, // Aethel is precise; ARBI is creative
      top_p: isEngineers ? 0.9 : 1.0,
    }
  };
}

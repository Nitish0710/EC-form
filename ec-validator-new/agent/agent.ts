import { Agent } from '@vercel/eve';

export const agent = new Agent({
  name: 'ec-validator',
  instructions: './instructions.md',
  
  model: {
    provider: 'anthropic',
    name: 'claude-sonnet-4.5',
    temperature: 0.1,
  },
  
  sandbox: {
    runtime: 'node24',
    filesystem: true,
  },
  
  channels: ['api'],
  
  skills: [
    './skills/completeness-checklist.md',
    './skills/fema-rules.md',
  ],
  
  subagents: [
    './subagents/extractor',
    './subagents/validator',
    './subagents/feedback',
  ],
  
  tools: [
    './tools/fetch_pdf',
    './tools/rasterize_pdf',
    './tools/write_output_version',
    './tools/append_feedback',
  ],
  
  durable: true,
});

export default agent;

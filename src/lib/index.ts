// Components
export { ClippyAgent, ClippyProvider, ClippyBalloon } from './components/index.js';

// Hook
export { useClippy } from './use-clippy.svelte.js';

// Engine (for advanced usage)
export { Agent, type AgentState } from './engine/agent.js';
export { loadAgent } from './engine/loader.js';

// Context key
export { CLIPPY_KEY } from './context-key.js';

// Types
export type { AgentConfig, AgentName, AgentFrame, AgentAnimation } from './types.js';
export { AGENT_NAMES } from './types.js';

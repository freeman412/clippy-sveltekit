import { getContext } from 'svelte';
import type { Agent } from './engine/agent.js';
import { CLIPPY_KEY } from './context-key.js';

interface ClippyContext {
	readonly agent: Agent | null;
}

/**
 * Get the Clippy agent instance from the nearest ClippyProvider.
 * Returns a reactive object — `ctx.agent` will update when the agent loads.
 */
export function useClippy(): ClippyContext {
	return getContext<ClippyContext>(CLIPPY_KEY);
}

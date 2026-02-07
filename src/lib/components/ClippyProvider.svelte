<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { AgentName } from '../types.js';
	import type { Agent } from '../engine/agent.js';
	import { CLIPPY_KEY } from '../context-key.js';
	import ClippyAgent from './ClippyAgent.svelte';

	let {
		agentName = 'Clippy' as AgentName,
		children
	}: {
		agentName?: AgentName;
		children: Snippet;
	} = $props();

	let agentInstance: Agent | null = $state(null);

	setContext(CLIPPY_KEY, {
		get agent() {
			return agentInstance;
		}
	});

	function handleReady(agent: Agent) {
		agentInstance = agent;
		agent.show();
	}
</script>

{@render children()}
<ClippyAgent {agentName} onReady={handleReady} />

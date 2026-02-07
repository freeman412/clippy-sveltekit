<script lang="ts">
	import { ClippyAgent } from '$lib/components/index.js';
	import { type Agent } from '$lib/engine/agent.js';
	import { AGENT_NAMES, type AgentName } from '$lib/types.js';

	let agent = $state<Agent | null>(null);
	let selectedAgent = $state<AgentName>('Clippy');
	let speechText = $state('Hello! I see you\'re building a Svelte app. Would you like help with that?');
	let animationList = $state<string[]>([]);
	let currentKey = $state(0);

	function handleReady(a: Agent) {
		agent = a;
		animationList = a.animations();
		a.show();
		a.speak('Hello! Double-click me for a random animation, or try the controls below.');
	}

	function switchAgent(name: AgentName) {
		agent?.destroy();
		agent = null;
		selectedAgent = name;
		currentKey++;
	}
</script>

<div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 1rem;">
	<h1>clippy-sveltekit</h1>
	<p>Modern Svelte 5 port of Microsoft Office assistants.</p>

	<hr style="margin: 1.5rem 0;" />

	<h2>Agent</h2>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
		{#each AGENT_NAMES as name}
			<button
				style="padding: 0.4rem 0.8rem; border: 1px solid {name === selectedAgent ? '#0078d4' : '#ccc'}; background: {name === selectedAgent ? '#0078d4' : '#fff'}; color: {name === selectedAgent ? '#fff' : '#000'}; border-radius: 4px; cursor: pointer;"
				onclick={() => switchAgent(name)}
			>
				{name}
			</button>
		{/each}
	</div>

	<h2>Speech</h2>
	<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
		<input
			type="text"
			bind:value={speechText}
			style="flex: 1; padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px;"
		/>
		<button
			style="padding: 0.4rem 0.8rem; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;"
			onclick={() => agent?.speak(speechText)}
		>
			Speak
		</button>
	</div>

	<h2>Animations</h2>
	<div style="display: flex; gap: 0.25rem; flex-wrap: wrap; margin-bottom: 1rem;">
		{#each animationList as anim}
			<button
				style="padding: 0.25rem 0.5rem; border: 1px solid #ccc; background: #f9f9f9; border-radius: 3px; font-size: 0.8rem; cursor: pointer;"
				onclick={() => agent?.play(anim)}
			>
				{anim}
			</button>
		{/each}
	</div>

	<h2>Actions</h2>
	<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
		<button
			style="padding: 0.4rem 0.8rem; background: #107c10; color: white; border: none; border-radius: 4px; cursor: pointer;"
			onclick={() => agent?.show()}
		>
			Show
		</button>
		<button
			style="padding: 0.4rem 0.8rem; background: #d83b01; color: white; border: none; border-radius: 4px; cursor: pointer;"
			onclick={() => agent?.hide()}
		>
			Hide
		</button>
		<button
			style="padding: 0.4rem 0.8rem; background: #5c2d91; color: white; border: none; border-radius: 4px; cursor: pointer;"
			onclick={() => agent?.animate()}
		>
			Random Animation
		</button>
		<button
			style="padding: 0.4rem 0.8rem; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;"
			onclick={() => agent?.moveTo(Math.random() * (window.innerWidth - 200), Math.random() * (window.innerHeight - 200))}
		>
			Move Random
		</button>
		<button
			style="padding: 0.4rem 0.8rem; background: #767676; color: white; border: none; border-radius: 4px; cursor: pointer;"
			onclick={() => agent?.stop()}
		>
			Stop
		</button>
	</div>
</div>

{#key currentKey}
	<ClippyAgent agentName={selectedAgent} onReady={handleReady} />
{/key}

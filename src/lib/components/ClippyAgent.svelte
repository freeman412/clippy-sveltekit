<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { AgentName } from '../types.js';
	import { Agent, type AgentState } from '../engine/agent.js';
	import { loadAgent } from '../engine/loader.js';
	import ClippyBalloon from './ClippyBalloon.svelte';

	let {
		agentName = 'Clippy' as AgentName,
		onReady,
		initialPosition,
		class: className = ''
	}: {
		agentName?: AgentName;
		onReady?: (agent: Agent) => void;
		initialPosition?: { x: number; y: number };
		class?: string;
	} = $props();

	let agent: Agent | null = $state(null);
	let spriteUrl = $state('');
	let agentState: AgentState = $state({
		x: 0,
		y: 0,
		visible: false,
		overlays: [],
		dragging: false,
		balloon: {
			visible: false,
			text: '',
			displayedText: '',
			side: 'top-right',
			x: 0,
			y: 0,
			hold: false
		},
		width: 0,
		height: 0,
		currentAnimation: null
	});
	let loading = $state(true);
	let error: string | null = $state(null);

	onMount(async () => {
		try {
			const assets = await loadAgent(agentName);
			spriteUrl = assets.spriteUrl;

			agent = new Agent(
				assets.config,
				(newState) => {
					agentState = newState;
				},
				initialPosition
			);

			loading = false;
			onReady?.(agent);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load agent';
			loading = false;
		}
	});

	onDestroy(() => {
		agent?.destroy();
	});

	// Drag handlers
	function handlePointerDown(e: PointerEvent) {
		if (!agent || e.button !== 0) return;
		agent.startDrag(e.clientX, e.clientY);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!agent || !agentState.dragging) return;
		agent.updateDrag(e.clientX, e.clientY);
	}

	function handlePointerUp(_e: PointerEvent) {
		if (!agent) return;
		agent.endDrag();
	}

	function handleDoubleClick() {
		agent?.animate();
	}
</script>

{#if !loading && !error && agentState.visible}
	<!-- Balloon -->
	<ClippyBalloon state={agentState.balloon} />

	<!-- Agent sprite -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="clippy-agent {className}"
		style="
			left: {agentState.x}px;
			top: {agentState.y}px;
			width: {agentState.width}px;
			height: {agentState.height}px;
			cursor: {agentState.dragging ? 'grabbing' : 'grab'};
		"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		ondblclick={handleDoubleClick}
		role="presentation"
	>
		{#each agentState.overlays as bgPos, i}
			{#if bgPos !== null}
				<div
					class="clippy-overlay"
					style="
						width: {agentState.width}px;
						height: {agentState.height}px;
						background-image: url({spriteUrl});
						background-position: {bgPos};
					"
				></div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.clippy-agent {
		position: fixed;
		z-index: 10000;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}

	.clippy-overlay {
		position: absolute;
		top: 0;
		left: 0;
		background-repeat: no-repeat;
		pointer-events: none;
	}
</style>

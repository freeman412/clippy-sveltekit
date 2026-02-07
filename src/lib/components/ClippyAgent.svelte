<script lang="ts">
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import type { AgentName } from '../types.js';
	import { Agent, type AgentState } from '../engine/agent.js';
	import { loadAgent } from '../engine/loader.js';
	import ClippyBalloon from './ClippyBalloon.svelte';

	let {
		agentName = 'Clippy' as AgentName,
		onReady,
		initialPosition,
		panel,
		onPanelToggle,
		class: className = ''
	}: {
		agentName?: AgentName;
		onReady?: (agent: Agent) => void;
		initialPosition?: { x: number; y: number };
		panel?: Snippet<[{ agent: Agent; close: () => void }]>;
		onPanelToggle?: (open: boolean) => void;
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
		currentAnimation: null,
		panelOpen: false
	});
	let loading = $state(true);
	let error: string | null = $state(null);

	// Panel positioning: anchored above (or below) Clippy
	const PANEL_WIDTH = 340;
	const PANEL_HEIGHT_EST = 340;
	const GAP = 8;

	let panelPosition = $derived.by(() => {
		const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
		const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

		// Center panel horizontally on agent
		let x = agentState.x + agentState.width / 2 - PANEL_WIDTH / 2;
		// Position above agent by default
		let y = agentState.y - PANEL_HEIGHT_EST - GAP;

		// Clamp horizontal to viewport
		if (x + PANEL_WIDTH > vw - 8) x = vw - PANEL_WIDTH - 8;
		if (x < 8) x = 8;

		// If not enough room above, position below
		if (y < 8) {
			y = agentState.y + agentState.height + GAP;
		}

		return { x, y };
	});

	onMount(async () => {
		try {
			const assets = await loadAgent(agentName);
			spriteUrl = assets.spriteUrl;

			agent = new Agent(
				assets.config,
				(newState) => {
					const panelChanged = newState.panelOpen !== agentState.panelOpen;
					agentState = newState;
					if (panelChanged) {
						onPanelToggle?.(newState.panelOpen);
					}
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
		if (clickTimeout) clearTimeout(clickTimeout);
	});

	// Click vs drag detection
	let pointerStartX = 0;
	let pointerStartY = 0;
	let didDrag = false;
	let clickTimeout: ReturnType<typeof setTimeout> | null = null;

	function handlePointerDown(e: PointerEvent) {
		if (!agent || e.button !== 0) return;
		pointerStartX = e.clientX;
		pointerStartY = e.clientY;
		didDrag = false;
		// Cancel pending single-click (for double-click detection)
		if (clickTimeout) {
			clearTimeout(clickTimeout);
			clickTimeout = null;
		}
		agent.startDrag(e.clientX, e.clientY);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!agent || !agentState.dragging) return;
		const dx = e.clientX - pointerStartX;
		const dy = e.clientY - pointerStartY;
		if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
			didDrag = true;
		}
		agent.updateDrag(e.clientX, e.clientY);
	}

	function handlePointerUp(_e: PointerEvent) {
		if (!agent) return;
		agent.endDrag();
		if (!didDrag) {
			// Debounce: wait 250ms for potential double-click
			clickTimeout = setTimeout(() => {
				clickTimeout = null;
				agent?.togglePanel();
			}, 250);
		}
	}

	function handleDoubleClick() {
		// Cancel the pending single-click toggle
		if (clickTimeout) {
			clearTimeout(clickTimeout);
			clickTimeout = null;
		}
		agent?.animate();
	}

	function handlePanelClose() {
		agent?.closePanel();
	}
</script>

{#if !loading && !error && agentState.visible}
	<!-- Balloon: hidden when panel is open -->
	{#if !agentState.panelOpen}
		<ClippyBalloon state={agentState.balloon} />
	{/if}

	<!-- Interactive panel container -->
	{#if agentState.panelOpen && panel && agent}
		<div
			class="clippy-panel-container"
			style="left: {panelPosition.x}px; top: {panelPosition.y}px;"
		>
			{@render panel({ agent, close: handlePanelClose })}
		</div>
	{/if}

	<!-- Agent sprite: uses transform for GPU-composited positioning -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="clippy-agent {className}"
		style="
			transform: translate({agentState.x}px, {agentState.y}px);
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
		left: 0;
		top: 0;
		z-index: 10000;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
		will-change: transform;
	}

	.clippy-overlay {
		position: absolute;
		top: 0;
		left: 0;
		background-repeat: no-repeat;
		pointer-events: none;
	}

	.clippy-panel-container {
		position: fixed;
		z-index: 10002;
		pointer-events: auto;
	}
</style>

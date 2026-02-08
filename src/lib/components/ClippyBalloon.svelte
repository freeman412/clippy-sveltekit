<script lang="ts">
	import type { BalloonState } from '../engine/balloon.js';

	let { state }: { state: BalloonState } = $props();
</script>

{#if state.visible}
	<div
		class="clippy-balloon clippy-{state.side}"
		style="left: {state.x}px; top: {state.y}px;"
	>
		<div class="clippy-tip"></div>
		<div class="clippy-content">{state.displayedText}</div>
	</div>
{/if}

<style>
	.clippy-balloon {
		position: fixed;
		z-index: 10001;
		max-width: 200px;
		min-width: 120px;
		background: var(--clippy-balloon-bg, #ffc);
		color: var(--clippy-balloon-color, #000);
		border: 1px solid var(--clippy-balloon-border, #000);
		border-radius: var(--clippy-balloon-radius, 5px);
		padding: 8px;
		font-family: var(--clippy-balloon-font, 'Microsoft Sans Serif', 'Segoe UI', Tahoma, sans-serif);
		font-size: 10pt;
		line-height: 1.4;
		box-shadow: var(--clippy-balloon-shadow, 2px 2px 4px rgba(0, 0, 0, 0.3));
		pointer-events: auto;
	}

	.clippy-content {
		word-wrap: break-word;
	}

	.clippy-tip {
		position: absolute;
		width: 10px;
		height: 10px;
		background: var(--clippy-balloon-bg, #ffc);
		border-bottom: 1px solid var(--clippy-balloon-border, #000);
		border-right: 1px solid var(--clippy-balloon-border, #000);
	}

	/* Top positions: transform shifts balloon up by its own height
	   so the tip at the bottom points at the agent's top edge */
	.clippy-top-right,
	.clippy-top-left {
		transform: translateY(-100%);
	}

	.clippy-top-right .clippy-tip,
	.clippy-top-left .clippy-tip {
		bottom: -4px;
		transform: rotate(45deg);
	}

	.clippy-top-right .clippy-tip {
		left: 20px;
	}

	.clippy-top-left .clippy-tip {
		right: 20px;
	}

	.clippy-bottom-right .clippy-tip,
	.clippy-bottom-left .clippy-tip {
		top: -6px;
		transform: rotate(-135deg);
	}

	.clippy-bottom-right .clippy-tip {
		left: 20px;
	}

	.clippy-bottom-left .clippy-tip {
		right: 20px;
	}
</style>

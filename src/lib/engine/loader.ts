import type { AgentConfig, AgentName } from '../types.js';

export interface AgentAssets {
	config: AgentConfig;
	spriteUrl: string;
}

/**
 * Dynamically load an agent's config and sprite sheet.
 * Uses dynamic import() for code splitting — only the requested agent is loaded.
 */
export async function loadAgent(name: AgentName): Promise<AgentAssets> {
	const agentModule = await importAgentConfig(name);
	const spriteUrl = await importAgentSprite(name);

	return {
		config: agentModule.agent,
		spriteUrl
	};
}

async function importAgentConfig(name: AgentName): Promise<{ agent: AgentConfig }> {
	switch (name) {
		case 'Bonzi':
			return import('../agents/Bonzi/agent.js');
		case 'Clippy':
			return import('../agents/Clippy/agent.js');
		case 'F1':
			return import('../agents/F1/agent.js');
		case 'Genie':
			return import('../agents/Genie/agent.js');
		case 'Genius':
			return import('../agents/Genius/agent.js');
		case 'Links':
			return import('../agents/Links/agent.js');
		case 'Merlin':
			return import('../agents/Merlin/agent.js');
		case 'Peedy':
			return import('../agents/Peedy/agent.js');
		case 'Rocky':
			return import('../agents/Rocky/agent.js');
		case 'Rover':
			return import('../agents/Rover/agent.js');
		default:
			throw new Error(`Unknown agent: ${name}`);
	}
}

async function importAgentSprite(name: AgentName): Promise<string> {
	let module: { default: string };
	switch (name) {
		case 'Bonzi':
			module = await import('../agents/Bonzi/map.png');
			break;
		case 'Clippy':
			module = await import('../agents/Clippy/map.png');
			break;
		case 'F1':
			module = await import('../agents/F1/map.png');
			break;
		case 'Genie':
			module = await import('../agents/Genie/map.png');
			break;
		case 'Genius':
			module = await import('../agents/Genius/map.png');
			break;
		case 'Links':
			module = await import('../agents/Links/map.png');
			break;
		case 'Merlin':
			module = await import('../agents/Merlin/map.png');
			break;
		case 'Peedy':
			module = await import('../agents/Peedy/map.png');
			break;
		case 'Rocky':
			module = await import('../agents/Rocky/map.png');
			break;
		case 'Rover':
			module = await import('../agents/Rover/map.png');
			break;
		default:
			throw new Error(`Unknown agent: ${name}`);
	}
	return module.default;
}

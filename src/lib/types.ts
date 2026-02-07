/** Sprite coordinate [x, y] into the sprite sheet */
export type SpriteCoord = [number, number];

/** A single frame of animation */
export interface AgentFrame {
	/** Duration in milliseconds to display this frame */
	duration: number;
	/** Sprite sheet coordinates per overlay layer */
	images?: SpriteCoord[];
	/** Sound ID to play on this frame */
	sound?: string;
	/** Frame index to jump to when exiting early */
	exitBranch?: number;
	/** Probabilistic branching at this frame */
	branching?: {
		branches: Array<{
			frameIndex: number;
			weight: number;
		}>;
	};
}

/** A named animation sequence */
export interface AgentAnimation {
	frames: AgentFrame[];
	useExitBranching?: boolean;
}

/** Full agent configuration */
export interface AgentConfig {
	overlayCount: number;
	framesize: [number, number];
	sounds: string[];
	animations: Record<string, AgentAnimation>;
}

/** Agent names that have bundled data */
export type AgentName =
	| 'Bonzi'
	| 'Clippy'
	| 'F1'
	| 'Genie'
	| 'Genius'
	| 'Links'
	| 'Merlin'
	| 'Peedy'
	| 'Rocky'
	| 'Rover';

export const AGENT_NAMES: AgentName[] = [
	'Bonzi',
	'Clippy',
	'F1',
	'Genie',
	'Genius',
	'Links',
	'Merlin',
	'Peedy',
	'Rocky',
	'Rover'
];

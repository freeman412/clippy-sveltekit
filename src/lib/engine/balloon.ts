export type BalloonSide = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface BalloonState {
	visible: boolean;
	text: string;
	displayedText: string;
	side: BalloonSide;
	x: number;
	y: number;
	hold: boolean;
}

export interface BalloonOptions {
	/** Agent position and size for positioning */
	agentX: number;
	agentY: number;
	agentWidth: number;
	agentHeight: number;
}

const BALLOON_WIDTH = 200;
const BALLOON_HEIGHT_EST = 80;
const BALLOON_MARGIN = 15;
const WORD_DELAY = 200;
const CLOSE_DELAY = 2000;

export class Balloon {
	private state: BalloonState = {
		visible: false,
		text: '',
		displayedText: '',
		side: 'top-right',
		x: 0,
		y: 0,
		hold: false
	};

	private wordTimer: ReturnType<typeof setTimeout> | null = null;
	private closeTimer: ReturnType<typeof setTimeout> | null = null;
	private words: string[] = [];
	private wordIndex = 0;
	private onChange: (state: BalloonState) => void;
	private onComplete: (() => void) | null = null;

	constructor(onChange: (state: BalloonState) => void) {
		this.onChange = onChange;
	}

	speak(text: string, hold: boolean, opts: BalloonOptions, onComplete?: () => void) {
		this.close();

		const side = this.bestSide(opts);
		const pos = this.position(side, opts);

		this.state = {
			visible: true,
			text,
			displayedText: '',
			side,
			x: pos.x,
			y: pos.y,
			hold
		};
		this.onComplete = onComplete ?? null;

		// Animate words
		this.words = text.split(/\s+/);
		this.wordIndex = 0;
		this.showNextWord();
	}

	close() {
		if (this.wordTimer) clearTimeout(this.wordTimer);
		if (this.closeTimer) clearTimeout(this.closeTimer);
		this.wordTimer = null;
		this.closeTimer = null;

		this.state = { ...this.state, visible: false, text: '', displayedText: '' };
		this.onChange(this.state);

		const cb = this.onComplete;
		this.onComplete = null;
		cb?.();
	}

	reposition(opts: BalloonOptions) {
		if (!this.state.visible) return;
		const side = this.bestSide(opts);
		const pos = this.position(side, opts);
		this.state = { ...this.state, side, x: pos.x, y: pos.y };
		this.onChange(this.state);
	}

	getState(): BalloonState {
		return this.state;
	}

	private showNextWord() {
		if (this.wordIndex >= this.words.length) {
			this.onChange(this.state);
			if (!this.state.hold) {
				this.closeTimer = setTimeout(() => this.close(), CLOSE_DELAY);
			}
			return;
		}

		this.state.displayedText += (this.wordIndex > 0 ? ' ' : '') + this.words[this.wordIndex];
		this.wordIndex++;
		this.onChange(this.state);

		this.wordTimer = setTimeout(() => this.showNextWord(), WORD_DELAY);
	}

	private bestSide(opts: BalloonOptions): BalloonSide {
		const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
		const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

		const sides: BalloonSide[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

		for (const side of sides) {
			const pos = this.position(side, opts);
			if (
				pos.x >= 0 &&
				pos.y >= 0 &&
				pos.x + BALLOON_WIDTH <= vw &&
				pos.y + BALLOON_HEIGHT_EST <= vh
			) {
				return side;
			}
		}

		return 'top-right';
	}

	private position(side: BalloonSide, opts: BalloonOptions): { x: number; y: number } {
		const { agentX, agentY, agentWidth, agentHeight } = opts;
		const centerX = agentX + agentWidth / 2;

		switch (side) {
			case 'top-right':
				return {
					x: centerX - 20,
					y: agentY - BALLOON_HEIGHT_EST - 5
				};
			case 'top-left':
				return {
					x: centerX - BALLOON_WIDTH + 20,
					y: agentY - BALLOON_HEIGHT_EST - 5
				};
			case 'bottom-right':
				return {
					x: centerX - 20,
					y: agentY + agentHeight + 8
				};
			case 'bottom-left':
				return {
					x: centerX - BALLOON_WIDTH + 20,
					y: agentY + agentHeight + 8
				};
		}
	}
}

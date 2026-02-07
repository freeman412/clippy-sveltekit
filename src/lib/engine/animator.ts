import type { AgentConfig, AgentAnimation, AgentFrame, SpriteCoord } from '../types.js';

export interface AnimatorState {
	/** Current background-position values per overlay, or null if hidden */
	overlays: (string | null)[];
	/** Whether currently animating */
	playing: boolean;
	/** Current animation name */
	currentAnimation: string | null;
}

export type AnimatorUpdateCallback = (state: AnimatorState) => void;
export type SoundPlayCallback = (soundId: string) => void;

export class Animator {
	private config: AgentConfig;
	private currentAnimation: AgentAnimation | null = null;
	private currentAnimationName: string | null = null;
	private currentFrameIndex = 0;
	private exiting = false;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private onUpdate: AnimatorUpdateCallback;
	private onSound: SoundPlayCallback | null;
	private onComplete: (() => void) | null = null;
	private paused = false;

	constructor(
		config: AgentConfig,
		onUpdate: AnimatorUpdateCallback,
		onSound?: SoundPlayCallback
	) {
		this.config = config;
		this.onUpdate = onUpdate;
		this.onSound = onSound ?? null;
	}

	animations(): string[] {
		return Object.keys(this.config.animations);
	}

	hasAnimation(name: string): boolean {
		return name in this.config.animations;
	}

	play(animationName: string, onComplete?: () => void): boolean {
		const anim = this.config.animations[animationName];
		if (!anim) return false;

		this.stop();
		this.currentAnimation = anim;
		this.currentAnimationName = animationName;
		this.currentFrameIndex = 0;
		this.exiting = false;
		this.onComplete = onComplete ?? null;

		this.step();
		return true;
	}

	stop() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.currentAnimation = null;
		this.currentAnimationName = null;
		this.exiting = false;
		this.paused = false;
	}

	exitAnimation() {
		this.exiting = true;
	}

	pause() {
		this.paused = true;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	resume() {
		if (this.paused) {
			this.paused = false;
			this.step();
		}
	}

	private step() {
		if (this.paused || !this.currentAnimation) return;

		const frames = this.currentAnimation.frames;
		const frame = frames[this.currentFrameIndex];

		if (!frame) {
			this.finished();
			return;
		}

		// Draw the frame
		this.draw(frame);

		// Play sound if any
		if (frame.sound && this.onSound) {
			this.onSound(frame.sound);
		}

		// Schedule next frame
		this.timer = setTimeout(() => {
			this.nextFrame();
		}, frame.duration);
	}

	private nextFrame() {
		if (!this.currentAnimation) return;

		const frames = this.currentAnimation.frames;
		const frame = frames[this.currentFrameIndex];

		// Determine next frame index
		let nextIndex: number | null = null;

		if (this.exiting && frame.exitBranch !== undefined) {
			nextIndex = frame.exitBranch;
		} else if (frame.branching) {
			const rnd = Math.random() * 100;
			let total = 0;
			for (const branch of frame.branching.branches) {
				total += branch.weight;
				if (rnd <= total) {
					nextIndex = branch.frameIndex;
					break;
				}
			}
		}

		if (nextIndex === null) {
			nextIndex = this.currentFrameIndex + 1;
		}

		if (nextIndex >= frames.length) {
			this.finished();
			return;
		}

		this.currentFrameIndex = nextIndex;
		this.step();
	}

	private draw(frame: AgentFrame) {
		const overlays: (string | null)[] = [];
		const images = frame.images ?? [];

		for (let i = 0; i < this.config.overlayCount; i++) {
			if (i < images.length) {
				const [x, y] = images[i];
				overlays.push(`${-x}px ${-y}px`);
			} else {
				overlays.push(null);
			}
		}

		this.onUpdate({
			overlays,
			playing: true,
			currentAnimation: this.currentAnimationName
		});
	}

	private finished() {
		const cb = this.onComplete;
		this.onComplete = null;

		this.onUpdate({
			overlays: this.getDefaultOverlays(),
			playing: false,
			currentAnimation: null
		});

		cb?.();
	}

	private getDefaultOverlays(): (string | null)[] {
		// Show the first frame of the first animation (neutral pose)
		const firstAnim = Object.values(this.config.animations)[0];
		if (firstAnim?.frames[0]?.images) {
			return firstAnim.frames[0].images.map(([x, y]) => `${-x}px ${-y}px`);
		}
		return Array(this.config.overlayCount).fill('0px 0px');
	}
}

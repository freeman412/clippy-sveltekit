import type { AgentConfig } from '../types.js';
import { Animator, type AnimatorState } from './animator.js';
import { Balloon, type BalloonState, type BalloonOptions } from './balloon.js';
import { Queue } from './queue.js';

export interface AgentState {
	/** Agent position */
	x: number;
	y: number;
	/** Agent visibility */
	visible: boolean;
	/** Sprite overlay background-position values */
	overlays: (string | null)[];
	/** Whether currently dragging */
	dragging: boolean;
	/** Balloon state */
	balloon: BalloonState;
	/** Frame dimensions */
	width: number;
	height: number;
	/** Currently playing animation name */
	currentAnimation: string | null;
}

export type AgentStateCallback = (state: AgentState) => void;

export class Agent {
	private config: AgentConfig;
	private animator: Animator;
	private balloon: Balloon;
	private queue: Queue;

	private x: number;
	private y: number;
	private visible = false;
	private dragging = false;
	private currentAnimation: string | null = null;

	private dragOffsetX = 0;
	private dragOffsetY = 0;

	private onStateChange: AgentStateCallback;
	private sounds: Map<string, HTMLAudioElement> = new Map();

	constructor(
		config: AgentConfig,
		onStateChange: AgentStateCallback,
		initialPosition?: { x: number; y: number }
	) {
		this.config = config;
		this.onStateChange = onStateChange;

		if (initialPosition) {
			this.x = initialPosition.x;
			this.y = initialPosition.y;
		} else {
			// Position at bottom-right by default
			this.x = typeof window !== 'undefined' ? window.innerWidth - config.framesize[0] - 40 : 200;
			this.y = typeof window !== 'undefined' ? window.innerHeight - config.framesize[1] - 40 : 200;
		}

		this.animator = new Animator(
			config,
			(animState) => this.handleAnimatorUpdate(animState),
			(soundId) => this.playSound(soundId)
		);

		this.balloon = new Balloon((balloonState) => {
			this.emitState();
		});

		this.queue = new Queue();
		this.queue.onEmpty(() => this.idleAnimation());
	}

	// ─── Public API ───

	/** Show the agent with an entrance animation */
	show(fast = false) {
		this.visible = true;
		this.emitState();

		if (fast) {
			this.animator.play('Show');
			return;
		}

		this.queue.enqueue((done) => {
			if (this.animator.hasAnimation('Show')) {
				this.animator.play('Show', done);
			} else {
				done();
			}
		});
	}

	/** Hide the agent */
	hide(fast = false, callback?: () => void) {
		if (fast) {
			this.visible = false;
			this.emitState();
			callback?.();
			return;
		}

		this.queue.enqueue((done) => {
			if (this.animator.hasAnimation('Hide')) {
				this.animator.play('Hide', () => {
					this.visible = false;
					this.emitState();
					done();
					callback?.();
				});
			} else {
				this.visible = false;
				this.emitState();
				done();
				callback?.();
			}
		});
	}

	/** Play a named animation */
	play(animationName: string, timeout?: number, callback?: () => void) {
		this.queue.enqueue((done) => {
			let completed = false;
			const finish = () => {
				if (completed) return;
				completed = true;
				callback?.();
				done();
			};

			if (timeout) {
				setTimeout(() => {
					this.animator.exitAnimation();
				}, timeout);
			}

			if (!this.animator.play(animationName, finish)) {
				finish();
			}
		});
	}

	/** Play a random non-idle animation */
	animate() {
		const anims = this.animator.animations().filter(
			(a) => !a.startsWith('Idle') && a !== 'Show' && a !== 'Hide'
		);
		if (anims.length === 0) return;
		const name = anims[Math.floor(Math.random() * anims.length)];
		this.play(name);
	}

	/** Show speech balloon */
	speak(text: string, hold = false) {
		this.queue.enqueue((done) => {
			this.balloon.speak(text, hold, this.balloonOptions(), hold ? done : undefined);
			if (!hold) {
				// Non-hold: complete immediately, balloon auto-closes
				done();
			}
		});
	}

	/** Close the speech balloon */
	closeBalloon() {
		this.balloon.close();
	}

	/** Animate movement to coordinates */
	moveTo(targetX: number, targetY: number, duration = 1000) {
		this.queue.enqueue((done) => {
			const startX = this.x;
			const startY = this.y;
			const startTime = performance.now();

			// Pick a movement direction animation
			const dir = this.getDirection(targetX, targetY);
			const moveAnim = `Move${dir}`;
			if (this.animator.hasAnimation(moveAnim)) {
				this.animator.play(moveAnim);
			}

			const animate = (now: number) => {
				const elapsed = now - startTime;
				const t = Math.min(elapsed / duration, 1);
				// Ease in-out
				const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

				this.x = startX + (targetX - startX) * ease;
				this.y = startY + (targetY - startY) * ease;
				this.emitState();

				if (t < 1) {
					requestAnimationFrame(animate);
				} else {
					this.animator.exitAnimation();
					done();
				}
			};

			requestAnimationFrame(animate);
		});
	}

	/** Point/look toward coordinates */
	gestureAt(x: number, y: number) {
		const dir = this.getDirection(x, y);
		const gestureAnim = `Gesture${dir}`;
		const lookAnim = `Look${dir}`;

		if (this.animator.hasAnimation(gestureAnim)) {
			this.play(gestureAnim);
		} else if (this.animator.hasAnimation(lookAnim)) {
			this.play(lookAnim);
		}
	}

	/** Stop all queued actions */
	stop() {
		this.queue.clear();
		this.animator.stop();
		this.balloon.close();
	}

	/** Stop only the current action */
	stopCurrent() {
		this.animator.exitAnimation();
	}

	/** Queue a pause */
	delay(ms: number) {
		this.queue.enqueue((done) => {
			setTimeout(done, ms);
		});
	}

	/** Get list of available animations */
	animations(): string[] {
		return this.animator.animations();
	}

	/** Check if a specific animation exists */
	hasAnimation(name: string): boolean {
		return this.animator.hasAnimation(name);
	}

	/** Pause animation */
	pause() {
		this.animator.pause();
	}

	/** Resume animation */
	resume() {
		this.animator.resume();
	}

	/** Set position directly */
	setPosition(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.emitState();
	}

	/** Get current position */
	getPosition(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}

	/** Get frame dimensions */
	getSize(): { width: number; height: number } {
		return { width: this.config.framesize[0], height: this.config.framesize[1] };
	}

	// ─── Drag Support ───

	startDrag(clientX: number, clientY: number) {
		this.dragging = true;
		this.dragOffsetX = clientX - this.x;
		this.dragOffsetY = clientY - this.y;
		this.animator.pause();
		this.emitState();
	}

	updateDrag(clientX: number, clientY: number) {
		if (!this.dragging) return;
		this.x = clientX - this.dragOffsetX;
		this.y = clientY - this.dragOffsetY;
		this.balloon.reposition(this.balloonOptions());
		this.emitState();
	}

	endDrag() {
		if (!this.dragging) return;
		this.dragging = false;
		this.animator.resume();
		this.emitState();
	}

	// ─── Sound Support ───

	loadSounds(soundMap: Record<string, string>) {
		for (const [id, dataUri] of Object.entries(soundMap)) {
			try {
				const audio = new Audio(dataUri);
				this.sounds.set(id, audio);
			} catch {
				// Ignore sound load failures
			}
		}
	}

	// ─── Cleanup ───

	destroy() {
		this.stop();
		this.sounds.clear();
	}

	// ─── Internal ───

	private lastOverlays: (string | null)[] = [];

	private handleAnimatorUpdate(animState: AnimatorState) {
		this.currentAnimation = animState.currentAnimation;
		this.lastOverlays = animState.overlays;
		this.emitState();
	}

	private emitState() {
		const overlays =
			this.lastOverlays.length > 0
				? this.lastOverlays
				: this.getDefaultOverlays();

		this.onStateChange({
			x: this.x,
			y: this.y,
			visible: this.visible,
			overlays,
			dragging: this.dragging,
			balloon: this.balloon.getState(),
			width: this.config.framesize[0],
			height: this.config.framesize[1],
			currentAnimation: this.currentAnimation
		});
	}

	private getDefaultOverlays(): (string | null)[] {
		const firstAnim = Object.values(this.config.animations)[0];
		if (firstAnim?.frames[0]?.images) {
			return firstAnim.frames[0].images.map(([x, y]) => `${-x}px ${-y}px`);
		}
		return ['0px 0px'];
	}

	private playSound(soundId: string) {
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		}
	}

	private idleAnimation() {
		const idles = this.animator.animations().filter((a) => a.startsWith('Idle'));
		if (idles.length === 0) return;
		const name = idles[Math.floor(Math.random() * idles.length)];
		this.queue.enqueue((done) => {
			this.animator.play(name, done);
		});
	}

	private getDirection(x: number, y: number): string {
		const cx = this.x + this.config.framesize[0] / 2;
		const cy = this.y + this.config.framesize[1] / 2;
		const dx = x - cx;
		const dy = y - cy;

		if (Math.abs(dx) > Math.abs(dy)) {
			return dx > 0 ? 'Right' : 'Left';
		}
		return dy > 0 ? 'Down' : 'Up';
	}

	private balloonOptions(): BalloonOptions {
		return {
			agentX: this.x,
			agentY: this.y,
			agentWidth: this.config.framesize[0],
			agentHeight: this.config.framesize[1]
		};
	}
}

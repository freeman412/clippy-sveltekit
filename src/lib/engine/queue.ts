export type QueueAction = (complete: () => void) => void;

export class Queue {
	private active = false;
	private queue: QueueAction[] = [];
	private onEmptyCallback: (() => void) | null = null;
	private onStartCallback: (() => void) | null = null;

	onEmpty(cb: () => void) {
		this.onEmptyCallback = cb;
	}

	/** Called when queue transitions from empty to processing */
	onStart(cb: () => void) {
		this.onStartCallback = cb;
	}

	enqueue(action: QueueAction) {
		this.queue.push(action);
		if (!this.active) {
			this.onStartCallback?.();
			this.next();
		}
	}

	clear() {
		this.queue = [];
		this.active = false;
	}

	private next() {
		if (this.queue.length === 0) {
			this.active = false;
			this.onEmptyCallback?.();
			return;
		}

		this.active = true;
		const action = this.queue.shift()!;
		action(() => this.next());
	}
}

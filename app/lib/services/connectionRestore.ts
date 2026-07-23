import log from '../methods/helpers/log';
import sdk from './sdk';

export type StreamRestorer = () => void | Promise<void>;

// Instance-unique ids so two RoomSubscriptions for the same rid never clobber each other's entry.
let sequence = 0;
const restorers = new Map<number, StreamRestorer>();

/** Enroll a consumer's stream-restoration callback. Returns a disposer that removes exactly this entry. */
export function registerStreamRestorer(restore: StreamRestorer): () => void {
	sequence += 1;
	const id = sequence;
	restorers.set(id, restore);
	return () => {
		restorers.delete(id);
	};
}

function runRestorers(): void {
	restorers.forEach(restore => {
		try {
			Promise.resolve(restore()).catch(error => log(error));
		} catch (error) {
			log(error);
		}
	});
}

/**
 * Bind the generation-keyed `'login'` listener that fans out to every enrolled restorer.
 * Called by `connect()` after `sdk.initialize` (the only SDK-instance swap) and stored like the
 * other connect() listeners so it is stopped on the next `connect()`. The generation check drops a
 * stale-instance `'login'` a superseded connect() left behind.
 */
export function bindStreamRestoration(): Promise<{ stop: () => void }> {
	const { generation } = sdk;
	return sdk.onStreamData('login', () => {
		if (sdk.generation !== generation) return;
		runRestorers();
	});
}

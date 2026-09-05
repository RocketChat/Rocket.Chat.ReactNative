import { createAudioPlayer } from 'expo-audio';

import log from '../../methods/helpers/log';

// Module-scoped state so it survives React tree unmounts and is safe to call
// fire-and-forget from any termination path.
let isPlaying = false;
let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

// Cue is ~1.5s; 5s is generous slack before we assume the player is wedged.
const WATCHDOG_MS = 5000;

function releaseLock(): void {
	isPlaying = false;
	currentPlayer = null;
	if (watchdogTimer != null) {
		clearTimeout(watchdogTimer);
		watchdogTimer = null;
	}
}

/**
 * Plays the call-ended audio cue once and releases the player on completion.
 *
 * - Fire-and-forget safe: module-scoped state survives component unmounts.
 * - Coalesces rapid re-invocations: a second call while the first is still
 *   loading or playing is a no-op to prevent doubled/overlapping playback.
 * - Watchdog releases the lock if didJustFinish never fires (rare: OS preempts
 *   the player or the audio session is interrupted indefinitely), so future
 *   cues aren't permanently blocked.
 */
export function playCallEndedSound(): void {
	if (isPlaying) {
		return;
	}

	isPlaying = true;

	try {
		currentPlayer = createAudioPlayer(require('../../../containers/Ringer/call-ended.mp3'));

		currentPlayer.addListener('playbackStatusUpdate', status => {
			if (status.isLoaded && status.didJustFinish) {
				const player = currentPlayer;
				releaseLock();
				player?.release();
			}
		});

		currentPlayer.play();

		watchdogTimer = setTimeout(() => {
			const player = currentPlayer;
			releaseLock();
			player?.release();
		}, WATCHDOG_MS);
	} catch (error) {
		// Never throw — this is fire-and-forget
		releaseLock();
		log(error);
	}
}

/**
 * Resets module-scoped state for testing purposes.
 * NOT intended for production use.
 */
export function resetPlayCallEndedSoundForTesting(): void {
	releaseLock();
}

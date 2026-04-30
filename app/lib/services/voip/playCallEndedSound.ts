import { Audio } from 'expo-av';

// Module-scoped flag so state survives React tree unmounts and is safe to call
// fire-and-forget from any termination path.
let isPlaying = false;

/**
 * Plays the call-ended audio cue once and releases the player on completion.
 *
 * - Fire-and-forget safe: module-scoped state survives component unmounts.
 * - Coalesces rapid re-invocations: a second call while the first is still
 *   loading or playing is a no-op to prevent doubled/overlapping playback.
 */
export async function playCallEndedSound(): Promise<void> {
	if (isPlaying) {
		return;
	}

	isPlaying = true;

	try {
		const sound = new Audio.Sound();

		sound.setOnPlaybackStatusUpdate(status => {
			if (status.isLoaded && status.didJustFinish) {
				isPlaying = false;
				sound.unloadAsync().catch(() => {
					// best-effort unload
				});
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		await sound.loadAsync(require('../../../containers/Ringer/call-ended.mp3'));
		await sound.playAsync();
	} catch (error) {
		// Never throw — this is fire-and-forget
		isPlaying = false;
		console.error('[VoIP] playCallEndedSound failed:', error);
	}
}

/**
 * Resets module-scoped state for testing purposes.
 * NOT intended for production use.
 */
export function resetPlayCallEndedSoundForTesting(): void {
	isPlaying = false;
}

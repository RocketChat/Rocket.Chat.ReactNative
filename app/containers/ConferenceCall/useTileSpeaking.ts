import { useState } from 'react';

export const useTileSpeaking = (): {
	speakingByLevel: ReadonlySet<string>;
	onTileSpeaking: (id: string, speaking: boolean) => void;
} => {
	const [speakingByLevel, setSpeakingByLevel] = useState<ReadonlySet<string>>(() => new Set());

	const onTileSpeaking = (id: string, speaking: boolean) =>
		setSpeakingByLevel(current => {
			if (current.has(id) === speaking) {
				return current;
			}
			const next = new Set(current);
			if (speaking) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});

	return { speakingByLevel, onTileSpeaking };
};

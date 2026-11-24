import { create } from 'zustand';

export interface INowPlayingAudio {
	audioKey: string;
	rid: string;
	msgId?: string;
	playing: boolean;
	currentTime: number;
	duration: number;
}

interface INowPlayingAudioStore {
	audio: INowPlayingAudio | null;
}

export const useNowPlayingAudioStore = create<INowPlayingAudioStore>(() => ({ audio: null }));

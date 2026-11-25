import { create } from 'zustand';

export interface INowPlayingAudio {
	audioKey: string;
	rid: string;
	msgId?: string;
	uri: string;
	playing: boolean;
}

interface INowPlayingAudioStore {
	audio: INowPlayingAudio | null;
}

export const useNowPlayingAudioStore = create<INowPlayingAudioStore>(() => ({ audio: null }));

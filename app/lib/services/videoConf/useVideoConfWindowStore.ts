import { create } from 'zustand';

/**
 * Tracks the in-app conference screen (`JitsiMeetView`) so other screens can offer a way back to
 * it. Only the Jitsi provider renders in-app; every other provider opens a browser, where
 * minimizing is the OS's job.
 *
 * Separate from `useCallStore`: a conference and a VoIP call can be up at the same time.
 */
interface VideoConfWindowState {
	/** True while the conference screen is mounted, whether or not it is in front. */
	open: boolean;
	/** True when the conference screen is mounted but another screen is in front of it. */
	minimized: boolean;
}

interface VideoConfWindowActions {
	openWindow: () => void;
	setMinimized: (minimized: boolean) => void;
	closeWindow: () => void;
}

export type VideoConfWindowStore = VideoConfWindowState & VideoConfWindowActions;

const initialState: VideoConfWindowState = {
	open: false,
	minimized: false
};

export const useVideoConfWindowStore = create<VideoConfWindowStore>(set => ({
	...initialState,
	openWindow: () => set({ open: true, minimized: false }),
	setMinimized: (minimized: boolean) => set({ minimized }),
	closeWindow: () => set({ ...initialState })
}));

/** True when a conference is up but sitting behind the current screen. */
export const useIsVideoConfMinimized = (): boolean => useVideoConfWindowStore(state => state.open && state.minimized);

import MMKVStorage from 'react-native-mmkv-storage';

export const TracksStorage = new MMKVStorage.Loader().withInstanceID('tracks').initialize();

interface Track {
	trackId: string;
	isPlaying: boolean;
	title?: string;
	artist?: string;
}

export const initializeTracks = () => {
	const tracks = TracksStorage.getArray('tracks');
	if (!tracks) TracksStorage.setArray('tracks', []);
};

export const addTrack = (track: Track) => {
	initializeTracks();
	const tracks: Track[] = TracksStorage.getArray('tracks') || [];
	if (tracks.find((t: Track) => t.trackId === track.trackId)) {
		return;
	}
	TracksStorage.setArray('tracks', [...tracks, track]);
};

export const getTrack = (track: Track) => {
	const tracks: Track[] = TracksStorage.getArray('tracks') || [];
	return tracks.find((t: Track) => t.trackId === track.trackId);
};

export const updateTrack = (track: Track) => {
	const tracks: Track[] = TracksStorage.getArray('tracks') || [];
	const index = tracks.findIndex((t: Track) => t.trackId === track.trackId);
	if (index !== -1) {
		tracks[index] = track;
	}
	TracksStorage.setArray('tracks', tracks);
};

export const clearTracks = () => {
	TracksStorage.setArray('tracks', []);
};

export const getCurrentTrack: () => Track | undefined = () => {
	const tracks: Track[] = TracksStorage.getArray('tracks') || [];
	const currentTrack = tracks.find((t: Track) => t.isPlaying);
	return currentTrack;
};

export const setCurrentTrack = (trackId: string) => {
	const tracks: Track[] = TracksStorage.getArray('tracks') || [];
	const currentTrack = tracks.find((t: Track) => t.isPlaying);
	const trackToToggle = tracks.find((t: Track) => t.trackId === trackId);
	currentTrack && updateTrack({ ...currentTrack, isPlaying: false });
	if (trackToToggle) {
		updateTrack({ ...trackToToggle, isPlaying: true });
	}
};

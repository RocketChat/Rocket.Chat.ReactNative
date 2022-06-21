import MMKVStorage, { create } from 'react-native-mmkv-storage';

interface Track {
	trackId: string;
	trackIndex: number;
}

const TracksStorage = new MMKVStorage.Loader().withInstanceID('tracks').initialize();
export const useTracks = create(TracksStorage);

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

export const getTrackIndex = (trackId: string) => {
	const tracks: Track[] = TracksStorage.getArray('tracks') || [];
	const index = tracks.findIndex((t: Track) => t.trackId === trackId);
	if (index !== -1) {
		return tracks[index].trackIndex;
	}
};

export const clearTracks = () => {
	TracksStorage.setArray('tracks', []);
};

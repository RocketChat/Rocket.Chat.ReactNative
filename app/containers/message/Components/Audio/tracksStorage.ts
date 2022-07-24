import MMKVStorage, { create } from 'react-native-mmkv-storage';

const TracksStorage = new MMKVStorage.Loader().withInstanceID('tracks').initialize();

export const useTracks = create(TracksStorage);

export const clearCurrentTrack = () => {
	TracksStorage.removeItem('currentTrack');
};

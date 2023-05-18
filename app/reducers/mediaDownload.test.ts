import { DownloadResumable } from 'expo-file-system';

import { mediaDownloadInProgress, mediaDownloadRemove } from '../actions/mediaDownload';
import { IDownloads, initialState } from './mediaDownload';
import { mockedStore } from './mockedStore';
import { MediaTypes } from '../lib/methods/handleMediaDownload';

describe('test reducer', () => {
	const downloadResumable = 'downloadResumable' as unknown as DownloadResumable;
	const downloadResumableTwo = 'downloadResumableTwo' as unknown as DownloadResumable;

	it('should return initial state', () => {
		const state = mockedStore.getState().mediaDownload;
		expect(state).toEqual(initialState);
	});
	it('should return modified store after action', () => {
		const expectState: IDownloads = { [`${MediaTypes.video}-id`]: downloadResumable };
		mockedStore.dispatch(mediaDownloadInProgress({ mediaType: MediaTypes.video, messageId: 'id', downloadResumable }));
		const state = mockedStore.getState().mediaDownload;
		expect(state).toEqual({ ...expectState });
	});
	it('should return the state correct after add second download', () => {
		mockedStore.dispatch(
			mediaDownloadInProgress({ mediaType: MediaTypes.audio, messageId: 'id', downloadResumable: downloadResumableTwo })
		);
		const expectState = {
			[`${MediaTypes.video}-id`]: downloadResumable,
			[`${MediaTypes.audio}-id`]: downloadResumableTwo
		};
		const state = mockedStore.getState().mediaDownload;
		expect(state).toEqual({ ...expectState });
	});
	it('should remove one download', () => {
		mockedStore.dispatch(mediaDownloadRemove({ mediaType: MediaTypes.video, messageId: 'id' }));
		const expectState = {
			[`${MediaTypes.audio}-id`]: downloadResumableTwo
		};
		const state = mockedStore.getState().mediaDownload;
		expect(state).toEqual({ ...expectState });
	});
});

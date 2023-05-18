import { createSelector } from 'reselect';

import { IApplicationState } from '../definitions';
import { MediaTypes, mediaDownloadKey } from '../lib/methods/handleMediaDownload';
import { IDownloads } from '../reducers/mediaDownload';

const selectMediaDownload = (state: IApplicationState) => state.mediaDownload;

const getMediaDownload = (mediaDownload: IDownloads, { mediaType, messageId }: { mediaType: MediaTypes; messageId: string }) => {
	console.log('🚀 ~ file: mediaDownload.ts:10 ~ getMediaDownload ~ { mediaType, messageId }:', { mediaType, messageId });
	console.log('🚀 ~ file: mediaDownload.ts:10 ~ getMediaDownload ~ mediaDownload:', mediaDownload);
	const key = mediaDownloadKey(mediaType, messageId);
	if (mediaDownload[key]) return mediaDownload[key];
	return null;
};

export const getDownloadResumable = createSelector(
	[
		selectMediaDownload,
		(_state: IApplicationState, { mediaType, messageId }: { mediaType: MediaTypes; messageId: string }) => ({
			mediaType,
			messageId
		})
	],
	getMediaDownload
);

import { Action } from 'redux';
import { DownloadResumable } from 'expo-file-system';

import { MEDIA_DOWNLOAD } from './actionsTypes';
import { MediaTypes } from '../lib/methods/handleMediaDownload';

interface IMediaDownloadInProgressAction extends Action {
	key: string;
	downloadResumable: DownloadResumable;
}

interface IMediaDownloadRemoveAction extends Action {
	key: string;
}

export type TActionMediaDownload = IMediaDownloadInProgressAction & IMediaDownloadRemoveAction;

interface IMediaDownloadInprogress {
	mediaType: MediaTypes;
	messageId: string;
	downloadResumable: DownloadResumable;
}

interface IMediaDownloadRemove {
	mediaType: MediaTypes;
	messageId: string;
}

const downloadKey = (mediaType: MediaTypes, messageId: string) => `${mediaType}-${messageId}`;

export const mediaDownloadInProgress = ({
	mediaType,
	messageId,
	downloadResumable
}: IMediaDownloadInprogress): IMediaDownloadInProgressAction => {
	const key = downloadKey(mediaType, messageId);

	return {
		type: MEDIA_DOWNLOAD.IN_PROGRESS,
		key,
		downloadResumable
	};
};

export const mediaDownloadRemove = ({ mediaType, messageId }: IMediaDownloadRemove): IMediaDownloadRemoveAction => {
	const key = downloadKey(mediaType, messageId);

	return {
		type: MEDIA_DOWNLOAD.REMOVE,
		key
	};
};

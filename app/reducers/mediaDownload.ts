import { DownloadResumable } from 'expo-file-system';

import { MEDIA_DOWNLOAD } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';

export interface IDownloads {
	[key: string]: DownloadResumable;
}

export const initialState: IDownloads = {};

export default function mediaDownload(state = initialState, action: TApplicationActions): IDownloads {
	switch (action.type) {
		case MEDIA_DOWNLOAD.IN_PROGRESS:
			return {
				...state,
				[action.key]: action.downloadResumable
			};
		case MEDIA_DOWNLOAD.REMOVE:
			const newState = { ...state };
			delete newState[action.key];
			return newState;
		default:
			return state;
	}
}

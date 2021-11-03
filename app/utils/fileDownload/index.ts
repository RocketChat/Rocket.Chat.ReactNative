import RNFetchBlob, { FetchBlobResponse } from 'rn-fetch-blob';
import FileViewer from 'react-native-file-viewer';

import EventEmitter from '../events';
import { LISTENER } from '../../containers/Toast';
import I18n from '../../i18n';

interface IAttachment {
	title: string;
	title_link: string;
	type: string;
	description: string;
}

const DOCUMENT_PATH = `${RNFetchBlob.fs.dirs.DownloadDir}/`;

export const getExtensionType = (text: string): string | undefined => text.split('.').pop();

export const getLocalFilePathFromFile = (attachment: IAttachment): string => {
	const fileName = attachment.title.split('.')[0];
	return `${DOCUMENT_PATH}${fileName}.${getExtensionType(attachment.title_link)}`;
};

export const fileDownload = (url: string, attachment: IAttachment): Promise<FetchBlobResponse> => {
	const path = getLocalFilePathFromFile(attachment);

	const options = {
		path,
		timeout: 10000,
		indicator: true,
		addAndroidDownloads: {
			path,
			notification: true,
			useDownloadManager: true
		}
	};

	return RNFetchBlob.config(options).fetch('GET', url);
};

export const filePreview = async (url: string, attachment: IAttachment): Promise<void> => {
	const file = await fileDownload(url, attachment);
	if (file) {
		FileViewer.open(file.data, {
			showOpenWithDialog: true,
			showAppsSuggestions: true
		})
			.then(res => res)
			.catch(() => {
				EventEmitter.emit(LISTENER, { message: I18n.t('Downloaded_file') });
			});
	}
};

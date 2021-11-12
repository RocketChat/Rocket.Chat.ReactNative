import RNFetchBlob, { FetchBlobResponse } from 'rn-fetch-blob';
import FileViewer from 'react-native-file-viewer';

import EventEmitter from '../events';
import { LISTENER } from '../../containers/Toast';
import I18n from '../../i18n';
import { DOCUMENTS_PATH, DOWNLOAD_PATH } from '../../constants/localPath';

interface IAttachment {
	title: string;
	title_link: string;
	type: string;
	description: string;
}

export const getLocalFilePathFromFile = (localPath: string, attachment: IAttachment): string => `${localPath}${attachment.title}`;

export const fileDownload = (url: string, attachment: IAttachment): Promise<FetchBlobResponse> => {
	const path = getLocalFilePathFromFile(DOWNLOAD_PATH, attachment);

	const options = {
		path,
		timeout: 10000,
		indicator: true,
		overwrite: true,
		addAndroidDownloads: {
			path,
			notification: true,
			useDownloadManager: true
		}
	};

	return RNFetchBlob.config(options).fetch('GET', url);
};

export const fileDownloadAndPreview = async (url: string, attachment: IAttachment): Promise<void> => {
	try {
		const path = getLocalFilePathFromFile(DOCUMENTS_PATH, attachment);
		const file = await RNFetchBlob.config({
			timeout: 10000,
			indicator: true,
			path
		}).fetch('GET', url);

		FileViewer.open(file.data, {
			showOpenWithDialog: true,
			showAppsSuggestions: true
		})
			.then(res => res)
			.catch(async () => {
				const file = await fileDownload(url, attachment);
				file
					? EventEmitter.emit(LISTENER, { message: I18n.t('Downloaded_file') })
					: EventEmitter.emit(LISTENER, { message: I18n.t('Error_Download_file') });
			});
	} catch (e) {
		EventEmitter.emit(LISTENER, { message: I18n.t('Error_Download_file') });
	}
};

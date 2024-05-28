import * as FileSystem from 'expo-file-system';
import FileViewer from 'react-native-file-viewer';

import { LISTENER } from '../../../containers/Toast';
import { IAttachment } from '../../../definitions';
import i18n from '../../../i18n';
import EventEmitter from './events';

export const getLocalFilePathFromFile = (localPath: string, attachment: IAttachment): string => `${localPath}${attachment.title}`;

export const fileDownload = async (url: string, attachment?: IAttachment, fileName?: string): Promise<string> => {
	let path = `${FileSystem.documentDirectory}`;
	if (fileName) {
		path = `${path}${fileName}`;
	}
	if (attachment) {
		path = `${path}${attachment.title}`;
	}
	const file = await FileSystem.downloadAsync(url, path);
	return file.uri;
};

export const fileDownloadAndPreview = async (url: string, attachment: IAttachment): Promise<void> => {
	try {
		const file = await fileDownload(url, attachment);
		FileViewer.open(file, {
			showOpenWithDialog: true,
			showAppsSuggestions: true
		});
	} catch (e) {
		EventEmitter.emit(LISTENER, { message: i18n.t('Error_Download_file') });
	}
};

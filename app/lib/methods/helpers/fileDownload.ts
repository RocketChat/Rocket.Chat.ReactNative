import * as FileSystem from 'expo-file-system';
import FileViewer from 'react-native-file-viewer';

import { LISTENER } from '../../../containers/Toast';
import { IAttachment } from '../../../definitions';
import i18n from '../../../i18n';
import EventEmitter from './events';
import { Encryption } from '../../encryption';
import { sanitizeFileName } from '../handleMediaDownload';

export const getLocalFilePathFromFile = (localPath: string, attachment: IAttachment): string => `${localPath}${attachment.title}`;

export const fileDownload = async (url: string, attachment?: IAttachment, fileName?: string): Promise<string> => {
	let path = `${FileSystem.documentDirectory}`;
	if (fileName) {
		path = `${path}${sanitizeFileName(fileName)}`;
	}
	if (attachment?.title) {
		path = `${path}${sanitizeFileName(attachment.title)}`;
	}
	const file = await FileSystem.downloadAsync(url, path);
	return file.uri;
};

export const fileDownloadAndPreview = async (url: string, attachment: IAttachment, messageId: string): Promise<void> => {
	try {
		let file = url;
		// If url starts with file://, we assume it's a local file and we don't download/decrypt it
		if (!file.startsWith('file://')) {
			file = await fileDownload(file, attachment);

			if (attachment.encryption) {
				if (!attachment.hashes?.sha256) {
					throw new Error('Missing checksum');
				}
				await Encryption.addFileToDecryptFileQueue(messageId, file, attachment.encryption, attachment.hashes?.sha256);
			}
		}

		await FileViewer.open(file, {
			showOpenWithDialog: true,
			showAppsSuggestions: true
		});
	} catch (e) {
		EventEmitter.emit(LISTENER, { message: i18n.t('Error_Download_file') });
	}
};

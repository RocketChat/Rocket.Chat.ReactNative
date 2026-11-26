import * as FileSystem from 'expo-file-system/legacy';
import * as mime from 'react-native-mime-types';
import { type Model } from '@nozbe/watermelondb';

import { type IAttachment, type TAttachmentEncryption } from '~/definitions/IAttachment';
import { type TMessageModel } from '~/definitions/IMessage';
import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';
import { Encryption } from '../encryption';
import { getMessageById } from '../database/services/Message';
import { getThreadMessageById } from '../database/services/ThreadMessage';
import database from '../database';
import { getThreadById } from '../database/services/Thread';
import { headers } from './helpers/fetch';

export type MediaTypes = 'audio' | 'image' | 'video';
export type TDownloadState = 'to-download' | 'loading' | 'downloaded';
const defaultType = {
	audio: 'mp3',
	image: 'jpg',
	video: 'mp4'
};
export const LOCAL_DOCUMENT_DIRECTORY = FileSystem.documentDirectory;

const serverUrlParsedAsPath = (serverURL: string) => `${sanitizeLikeString(serverURL)}/`;

export const sanitizeFileName = (value: string) => {
	const extension = value.substring(value.lastIndexOf('.') + 1);
	const toSanitize = value.substring(0, value.lastIndexOf('.'));
	return `${sanitizeLikeString(toSanitize)}.${extension}`;
};

export const getFilename = ({
	title,
	url,
	type,
	mimeType
}: {
	title?: string;
	url?: string;
	type: MediaTypes;
	mimeType?: string;
}) => {
	const isTitleTyped = mime.lookup(title);
	const extension = getExtension(type, mimeType, url);
	if (isTitleTyped && title) {
		if (isTitleTyped === mimeType) {
			return title;
		}
		// removing any character sequence after the last dot
		const filenameWithoutWrongExtension = title.replace(/\.\w+$/, '');
		return `${filenameWithoutWrongExtension}.${extension}`;
	}

	const filenameFromUrl = url?.substring(url.lastIndexOf('/') + 1);
	const isFileNameFromUrlTyped = mime.lookup(filenameFromUrl);
	if (isFileNameFromUrlTyped && filenameFromUrl) {
		if (isFileNameFromUrlTyped === mimeType) {
			return filenameFromUrl;
		}
		// removing any character sequence after the last dot
		const filenameWithoutWrongExtension = filenameFromUrl.replace(/\.\w+$/, '');
		return `${filenameWithoutWrongExtension}.${extension}`;
	}

	return `${filenameFromUrl}.${extension}`;
};

const getExtension = (type: MediaTypes, mimeType?: string, url?: string) => {
	// support url with gif extension and mimetype undefined, ex.: using the app tenor and giphy.
	if (url?.split('.').pop() === 'gif') {
		return 'gif';
	}
	if (!mimeType) {
		return defaultType[type];
	}
	// support audio from older versions
	if (url?.split('.').pop() === 'm4a') {
		return 'm4a';
	}
	// The library is returning mpag instead of mp3 for audio/mpeg
	if (mimeType === 'audio/mpeg') {
		return 'mp3';
	}
	if (mimeType === 'audio/aac') {
		return 'aac';
	}
	// The return of mime.extension('video/quicktime') is .qt,
	// this format the iOS isn't recognize and can't save on gallery
	if (mimeType === 'video/quicktime') {
		return 'mov';
	}
	const extension = mime.extension(mimeType);
	// The mime.extension can return false when there aren't any extension
	if (!extension) {
		return defaultType[type];
	}
	return extension;
};

const ensureDirAsync = async (dir: string, intermediates = true): Promise<void> => {
	const info = await FileSystem.getInfoAsync(dir);
	if (info.exists && info.isDirectory) {
		return;
	}
	await FileSystem.makeDirectoryAsync(dir, { intermediates });
	return ensureDirAsync(dir, intermediates);
};

export const getFilePath = ({
	type,
	mimeType,
	urlToCache
}: {
	type: MediaTypes;
	mimeType?: string;
	urlToCache?: string;
}): string | null => {
	if (!urlToCache) {
		return null;
	}
	const folderPath = getFolderPath(urlToCache);
	const urlWithoutQueryString = urlToCache.split('?')[0];
	const filename = sanitizeFileName(getFilename({ type, mimeType, url: urlWithoutQueryString }));
	const filePath = `${folderPath}${filename}`;
	return filePath;
};

const getFolderPath = (fileUrl: string) => {
	const serverUrl = store.getState().server.server;
	const serverUrlParsed = serverUrlParsedAsPath(serverUrl);
	const fileUrlWithoutQueryString = fileUrl.split('?')[0];
	const fileUrlSplitted = fileUrlWithoutQueryString.split('/');
	const messageId = fileUrlSplitted[fileUrlSplitted.length - 2];
	const folderPath = `${LOCAL_DOCUMENT_DIRECTORY}${serverUrlParsed}${messageId}/`;
	return folderPath;
};

export const getFileInfoAsync = async (filePath: string) => {
	const file = await FileSystem.getInfoAsync(filePath);
	return file;
};

export const getMediaCache = async ({
	type,
	mimeType,
	urlToCache
}: {
	type: MediaTypes;
	mimeType?: string;
	urlToCache?: string;
}) => {
	if (!urlToCache) {
		return null;
	}
	try {
		const folderPath = getFolderPath(urlToCache);
		const filePath = getFilePath({ type, mimeType, urlToCache });
		if (!filePath) {
			return null;
		}
		await ensureDirAsync(folderPath);
		const file = await getFileInfoAsync(filePath);
		return file;
	} catch (error) {
		log(error);
		return null;
	}
};

export const deleteMediaFiles = async (serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = serverUrlParsedAsPath(serverUrl);
		const path = `${LOCAL_DOCUMENT_DIRECTORY}${serverUrlParsed}`;
		await FileSystem.deleteAsync(path, { idempotent: true });
	} catch (error) {
		log(error);
	}
};

interface IDownloadedFile {
	uri: string;
	decrypted: boolean;
}

interface ISharedDownload {
	resumable: FileSystem.DownloadResumable;
	file: Promise<IDownloadedFile>;
	attachedListeners: number;
	transferred: boolean;
}

type TListenerState = 'attached' | 'released' | 'canceled';

export interface IMediaDownload {
	uri: Promise<string>;
	cancel: () => boolean;
	detach: () => void;
}

const activeDownloads = new Map<string, ISharedDownload>();

export const mediaDownloadKey = (messageUrl: string) => `${sanitizeLikeString(messageUrl)}`;

export function isDownloadActive(messageUrl: string): boolean {
	return activeDownloads.has(mediaDownloadKey(messageUrl));
}

const removeActiveDownload = (downloadKey: string, download: ISharedDownload) => {
	if (activeDownloads.get(downloadKey) === download) {
		activeDownloads.delete(downloadKey);
	}
};

export const matchDownloadUrl = (att: IAttachment, downloadUrl: string) =>
	(att.image_url && downloadUrl.includes(att.image_url)) ||
	(att.audio_url && downloadUrl.includes(att.audio_url)) ||
	(att.video_url && downloadUrl.includes(att.video_url));

const mapAttachments = ({
	attachments,
	uri,
	encryption,
	downloadUrl
}: {
	attachments?: IAttachment[];
	uri: string;
	encryption: boolean;
	downloadUrl: string;
}): TMessageModel['attachments'] =>
	attachments?.map(att => ({
		...att,
		title_link: matchDownloadUrl(att, downloadUrl) ? uri : att.title_link,
		e2e: encryption ? 'done' : undefined
	}));

export const persistMessage = async (messageId: string, uri: string, encryption: boolean, downloadUrl: string) => {
	const db = database.active;

	await db.write(async () => {
		const batch: Model[] = [];
		const messageRecord = await getMessageById(messageId);
		if (messageRecord) {
			batch.push(
				messageRecord.prepareUpdate(m => {
					m.attachments = mapAttachments({ attachments: m.attachments, uri, encryption, downloadUrl });
				})
			);
		}
		const threadRecord = await getThreadById(messageId);
		if (threadRecord) {
			batch.push(
				threadRecord.prepareUpdate(m => {
					m.attachments = mapAttachments({ attachments: m.attachments, uri, encryption, downloadUrl });
				})
			);
		}
		const threadMessageRecord = await getThreadMessageById(messageId);
		if (threadMessageRecord) {
			batch.push(
				threadMessageRecord.prepareUpdate(m => {
					m.attachments = mapAttachments({ attachments: m.attachments, uri, encryption, downloadUrl });
				})
			);
		}
		if (batch.length) {
			await db.batch(batch);
		}
	});
};

const startSharedDownload = ({
	downloadKey,
	path,
	messageId,
	downloadUrl,
	encryption,
	originalChecksum
}: {
	downloadKey: string;
	path: string;
	messageId: string;
	downloadUrl: string;
	encryption?: TAttachmentEncryption;
	originalChecksum?: string;
}): ISharedDownload => {
	const resumable = FileSystem.createDownloadResumable(downloadUrl, path, {
		headers: headers as Record<string, string>
	});

	const downloadAndDecrypt = async (onTransferred: () => void): Promise<IDownloadedFile> => {
		let result: FileSystem.FileSystemDownloadResult | undefined;
		const decrypted = !!(encryption && originalChecksum);
		try {
			result = await resumable.downloadAsync();
			if (result) {
				onTransferred();
			}
			if (result && encryption && originalChecksum) {
				await Encryption.addFileToDecryptFileQueue(messageId, result.uri, encryption, originalChecksum);
			}
		} catch (error) {
			console.error(error);
			throw error;
		}
		if (!result) {
			throw new Error('Media download canceled');
		}
		return { uri: result.uri, decrypted };
	};

	const download: ISharedDownload = {
		resumable,
		attachedListeners: 0,
		transferred: false,
		file: downloadAndDecrypt(() => {
			download.transferred = true;
		})
	};
	activeDownloads.set(downloadKey, download);
	download.file.then(
		() => removeActiveDownload(downloadKey, download),
		() => removeActiveDownload(downloadKey, download)
	);
	return download;
};

export function downloadMediaFile({
	messageId,
	type,
	mimeType,
	downloadUrl,
	encryption,
	originalChecksum
}: {
	messageId: string;
	type: MediaTypes;
	mimeType?: string;
	downloadUrl: string;
	encryption?: TAttachmentEncryption;
	originalChecksum?: string;
}): IMediaDownload {
	let stop: (cancelTransfer: boolean) => boolean = () => false;
	const uri = new Promise<string>((resolve, reject) => {
		const path = getFilePath({ type, mimeType, urlToCache: downloadUrl });
		if (!path) {
			return reject(new Error('Media download has no file path'));
		}
		const downloadKey = mediaDownloadKey(downloadUrl);
		const download =
			activeDownloads.get(downloadKey) ??
			startSharedDownload({ downloadKey, path, messageId, downloadUrl, encryption, originalChecksum });
		download.attachedListeners += 1;
		let state: TListenerState = 'attached';

		stop = cancelTransfer => {
			if (state !== 'attached' || (cancelTransfer && download.transferred)) {
				return false;
			}
			state = cancelTransfer ? 'canceled' : 'released';
			download.attachedListeners -= 1;
			reject(new Error(cancelTransfer ? 'Media download canceled' : 'Media download detached'));
			if (cancelTransfer && download.attachedListeners === 0) {
				removeActiveDownload(downloadKey, download);
				download.resumable.cancelAsync().catch(() => {});
			}
			return true;
		};

		download.file
			.then(async ({ uri: fileUri, decrypted }) => {
				if (state === 'canceled') {
					return;
				}
				if (encryption && originalChecksum && !decrypted) {
					throw new Error('Media download was not decrypted');
				}
				await persistMessage(messageId, fileUri, !!encryption, downloadUrl);
				resolve(fileUri);
			})
			.catch(reject);
	});
	return {
		uri,
		cancel: () => stop(true),
		detach: () => {
			stop(false);
		}
	};
}

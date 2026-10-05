import * as LegacyFileSystem from 'expo-file-system/legacy';
import { File, UploadType } from 'expo-file-system';

import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFormData } from './definitions';

const sanitizeFilename = (name: string) => name.replace(/[/\r\n]/g, '_').replace(/"/g, '%22');

const hasFilename = (uri: string, name: string) => {
	try {
		return decodeURIComponent(uri.split('/').pop() || '') === sanitizeFilename(name);
	} catch {
		return false;
	}
};

const STAGING_DIR = `${LegacyFileSystem.cacheDirectory}upload-staging/`;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const removeStaleStaging = async () => {
	try {
		const names = await LegacyFileSystem.readDirectoryAsync(STAGING_DIR);
		const stale = names.filter(name => Date.now() - Number(name.split('-')[0]) > STALE_AFTER_MS);
		await Promise.all(stale.map(name => LegacyFileSystem.deleteAsync(`${STAGING_DIR}${name}`, { idempotent: true })));
	} catch {}
};

const assertEnoughStorage = async (uri: string) => {
	const info = await LegacyFileSystem.getInfoAsync(uri);
	if (info.exists && info.size * 2 > (await LegacyFileSystem.getFreeDiskStorageAsync())) {
		throw new Error('Not enough storage');
	}
};

export class Upload {
	private uploadUrl = '';
	private headers: Record<string, string> = {};
	private file: IFormData | null = null;
	private parameters: Record<string, string> = {};
	private progressCallback?: (loaded: number, total: number) => void;
	private abortController = new AbortController();

	public setupRequest(
		url: string,
		headers: Record<string, string>,
		progressCallback?: (loaded: number, total: number) => void
	): void {
		this.uploadUrl = url;
		this.headers = headers;
		this.progressCallback = progressCallback;
	}

	public appendFile(item: IFormData): void {
		if (item.uri) {
			this.file = item;
		} else {
			this.parameters[item.name] = String(item.data);
		}
	}

	public async send(): Promise<TRoomsMediaResponse> {
		if (!this.file?.uri) {
			throw new Error('No file to upload');
		}
		const { uri, filename, name: fieldName, type: mimeType } = this.file;
		const stagingDir = `${STAGING_DIR}${Date.now()}-${Math.random().toString(36).slice(2)}/`;
		try {
			let stagedUri = uri;
			if (filename && !hasFilename(uri, filename)) {
				await assertEnoughStorage(uri);
				removeStaleStaging();
				stagedUri = `${stagingDir}${encodeURIComponent(sanitizeFilename(filename))}`;
				await LegacyFileSystem.makeDirectoryAsync(stagingDir, { intermediates: true });
				await LegacyFileSystem.copyAsync({ from: uri, to: stagedUri });
			}
			const response = await new File(stagedUri).upload(this.uploadUrl, {
				uploadType: UploadType.MULTIPART,
				headers: this.headers,
				fieldName,
				mimeType,
				parameters: this.parameters,
				signal: this.abortController.signal,
				onProgress: ({ bytesSent, totalBytes }) => this.progressCallback?.(bytesSent, totalBytes)
			});
			if (response.status < 200 || response.status >= 400) {
				throw new Error(`Error: ${response.status}`);
			}
			return JSON.parse(response.body);
		} catch (error) {
			throw this.abortController.signal.aborted ? new Error('Upload Cancelled') : error;
		} finally {
			LegacyFileSystem.deleteAsync(stagingDir, { idempotent: true }).catch(() => {});
		}
	}

	public cancel(): void {
		this.abortController.abort();
	}
}

import * as FileSystem from 'expo-file-system/legacy';

import {
	downloadMediaFile,
	getFilePath,
	getFilename,
	isDownloadActive,
	matchDownloadUrl,
	persistMessage
} from '../handleMediaDownload';
import database from '../../database';
import { Encryption } from '../../encryption';
import { getMessageById } from '../../database/services/Message';
import { getThreadById } from '../../database/services/Thread';
import { getThreadMessageById } from '../../database/services/ThreadMessage';
import { createBatchMock, deferred, flush, makeFakeRecord } from '../../database/__tests__/mockedWatermelonDB';

const mockDbBatch = createBatchMock();
jest.mock('../../database', () => {
	const { createWriterLock } = require('../../database/__tests__/mockedWatermelonDB');
	const write = createWriterLock();
	return {
		__esModule: true,
		default: {
			active: {
				get: jest.fn(),
				write,
				batch: (...args: unknown[]) => mockDbBatch(...args)
			}
		}
	};
});

jest.mock('../../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

jest.mock('../../encryption', () => ({
	Encryption: { addFileToDecryptFileQueue: jest.fn() }
}));

jest.mock('expo-file-system/legacy', () => ({
	documentDirectory: 'file:///documents/',
	createDownloadResumable: jest.fn()
}));

jest.mock('../../store/auxStore', () => ({
	store: { getState: () => ({ server: { server: 'https://server.com' } }) }
}));

describe('getFilePath', () => {
	it('derives the cache filename from the unencoded url', () => {
		expect(
			getFilePath({
				type: 'video',
				mimeType: 'video/quicktime',
				urlToCache: 'https://server.com/file-upload/abc/Screen Recording.mov'
			})
		).toContain('/Screen_Recording.mov');
	});
});

describe('matchDownloadUrl', () => {
	it('matches when downloadUrl contains image_url', () => {
		expect(
			matchDownloadUrl({ image_url: '/file-upload/abc/photo.jpg' }, 'https://server.com/file-upload/abc/photo.jpg')
		).toBeTruthy();
	});

	it('matches when downloadUrl contains audio_url', () => {
		expect(
			matchDownloadUrl({ audio_url: '/file-upload/abc/audio.mp3' }, 'https://server.com/file-upload/abc/audio.mp3')
		).toBeTruthy();
	});

	it('matches when downloadUrl contains video_url', () => {
		expect(
			matchDownloadUrl({ video_url: '/file-upload/abc/video.mp4' }, 'https://server.com/file-upload/abc/video.mp4')
		).toBeTruthy();
	});

	it('returns falsy when none of the attachment URLs match', () => {
		expect(
			matchDownloadUrl({ audio_url: '/file-upload/abc/other.mp3' }, 'https://server.com/file-upload/xyz/audio.mp3')
		).toBeFalsy();
	});

	it('returns falsy when the attachment has no URL fields', () => {
		expect(matchDownloadUrl({}, 'https://server.com/file-upload/abc/audio.mp3')).toBeFalsy();
	});

	it('does not match image_url against an unrelated audio download', () => {
		expect(
			matchDownloadUrl({ image_url: '/file-upload/abc/photo.jpg' }, 'https://server.com/file-upload/abc/audio.mp3')
		).toBeFalsy();
	});

	it('matches an attachment url with a space against the download url', () => {
		expect(
			matchDownloadUrl(
				{ video_url: '/file-upload/abc/Screen Recording.mov' },
				'https://server.com/file-upload/abc/Screen Recording.mov'
			)
		).toBeTruthy();
	});
});

describe('Test the getFilename', () => {
	it('returns the title without changes', () => {
		const { image_type, image_url, title } = {
			title: 'help-image.png',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe(title);
	});

	it("returns the title with correct extension based on image_type when the title's extension is wrong", () => {
		const { image_type, image_url, title } = {
			title: 'help-image.MOV',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.MOV',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image.png');
	});

	it("returns the filename from image_url when there isn't extension at title", () => {
		const { image_type, image_url, title } = {
			title: 'help-image',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image-url.png');
	});

	it("returns the filename from image_url with correct extension based on image_type when there isn't extension at title and the image_url's extension is wrong", () => {
		const { image_type, image_url, title } = {
			title: 'help-image',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.MOV',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image-url.png');
	});

	it("returns the filename from image_url and based on the image_type when there isn't extension either at title and image_url", () => {
		const { image_type, image_url, title } = {
			title: 'help-image',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image-url.png');
	});

	it('returns the filename with the gif extension from a gif sent by tenor/giphy', () => {
		const { image_type, image_url, title } = {
			title: undefined,
			image_url: 'https://media4.giphy.com/media/bGtO3RlAPHkeQ/giphy.gif',
			image_type: undefined
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('giphy.gif');
	});
});

describe('persistMessage', () => {
	const messageId = 'KXse45i7gGYE8j4Xb';
	const downloadUrl = 'https://server.com/file-upload/abc/photo.jpg';
	const uri = 'file:///local/photo.jpg';

	const makeRecord = (debugName: string) =>
		makeFakeRecord(debugName, { attachments: [{ image_url: '/file-upload/abc/photo.jpg' }] });

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not throw "pending changes" when a concurrent writer touches the message mid-persist', async () => {
		const messageRecord = makeRecord(`messages#${messageId}`);
		const threadRecord = makeRecord(`threads#${messageId}`);
		const threadMessageRecord = makeRecord(`thread_messages#${messageId}`);
		(getMessageById as jest.Mock).mockResolvedValue(messageRecord);
		(getThreadById as jest.Mock).mockResolvedValue(threadRecord);
		(getThreadMessageById as jest.Mock).mockResolvedValue(threadMessageRecord);

		const db = (database as any).active;

		// Hold the writer lock — as an incoming message update in a busy room would — and then
		// touch the very record persistMessage is about to prepare.
		const concurrentGate = deferred();
		const concurrentWrite = db.write(async () => {
			await concurrentGate.promise;
			await db.batch([
				messageRecord.prepareUpdate((m: any) => {
					m.msg = 'written by another writer';
				})
			]);
		});

		const persisting = persistMessage(messageId, uri, false, downloadUrl);

		// Give an unlocked implementation the chance to prepare now — before the concurrent
		// writer runs — and hold the records pending until its own batch.
		await flush();
		concurrentGate.resolve();

		await expect(Promise.all([concurrentWrite, persisting])).resolves.toBeDefined();

		// All three records committed in one batch, with the downloaded file attached.
		const batched = mockDbBatch.mock.calls.map(call => call.flat()).find(items => items.includes(threadRecord));
		expect(batched).toEqual([messageRecord, threadRecord, threadMessageRecord]);
		[messageRecord, threadRecord, threadMessageRecord].forEach(record => {
			expect(record.attachments[0].title_link).toBe(uri);
			expect(record._preparedState).toBeNull();
		});
	});

	it('does not batch when the message is not found locally', async () => {
		(getMessageById as jest.Mock).mockResolvedValue(null);
		(getThreadById as jest.Mock).mockResolvedValue(null);
		(getThreadMessageById as jest.Mock).mockResolvedValue(null);

		await persistMessage(messageId, uri, false, downloadUrl);

		expect(mockDbBatch).not.toHaveBeenCalled();
	});
});

describe('downloadMediaFile', () => {
	const downloadUrl = 'https://server.com/file-upload/abc/photo.jpg';
	const fileUri = 'file:///documents/photo.jpg';
	const mockCreateDownloadResumable = FileSystem.createDownloadResumable as jest.Mock;

	const createTransfer = () => {
		let resolve: (result: { uri: string } | undefined) => void = () => {};
		let reject: (error: Error) => void = () => {};
		const promise = new Promise<{ uri: string } | undefined>((onResolve, onReject) => {
			resolve = onResolve;
			reject = onReject;
		});
		return { promise, resolve, reject };
	};

	const mockTransfer = () => {
		const transfer = createTransfer();
		const cancelAsync = jest.fn(() => {
			transfer.resolve(undefined);
			return Promise.resolve();
		});
		mockCreateDownloadResumable.mockReturnValueOnce({ downloadAsync: () => transfer.promise, cancelAsync });
		return { transfer, cancelAsync };
	};

	const startMessageDownload = (messageId: string) => {
		const mediaDownload = downloadMediaFile({ messageId, type: 'image', downloadUrl });
		mediaDownload.uri.catch(() => {});
		return mediaDownload;
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'error').mockImplementation(() => {});
		(getMessageById as jest.Mock).mockResolvedValue(null);
		(getThreadById as jest.Mock).mockResolvedValue(null);
		(getThreadMessageById as jest.Mock).mockResolvedValue(null);
	});

	it('finishes the other Message when one Message cancels a joined download', async () => {
		const { transfer, cancelAsync } = mockTransfer();
		const first = startMessageDownload('first');
		const second = startMessageDownload('second');

		first.cancel();
		await expect(first.uri).rejects.toThrow('Media download canceled');
		expect(cancelAsync).not.toHaveBeenCalled();

		transfer.resolve({ uri: fileUri });
		await expect(second.uri).resolves.toBe(fileUri);
		expect(mockCreateDownloadResumable).toHaveBeenCalledTimes(1);
		expect(isDownloadActive(downloadUrl)).toBe(false);
	});

	it('fails every joined Message when the transfer fails', async () => {
		const { transfer } = mockTransfer();
		const first = startMessageDownload('first');
		const second = startMessageDownload('second');

		transfer.reject(new Error('network down'));

		await expect(first.uri).rejects.toThrow('network down');
		await expect(second.uri).rejects.toThrow('network down');
		expect(isDownloadActive(downloadUrl)).toBe(false);
	});

	it('stops the transfer once every joined Message cancels', async () => {
		const { cancelAsync } = mockTransfer();
		const first = startMessageDownload('first');
		const second = startMessageDownload('second');

		first.cancel();
		second.cancel();

		await expect(second.uri).rejects.toThrow('Media download canceled');
		expect(cancelAsync).toHaveBeenCalledTimes(1);
		expect(isDownloadActive(downloadUrl)).toBe(false);
	});

	it('stops the transfer when a Message that left and came back cancels', async () => {
		const { cancelAsync } = mockTransfer();
		const beforeScroll = startMessageDownload('first');
		beforeScroll.detach();
		expect(cancelAsync).not.toHaveBeenCalled();
		expect(isDownloadActive(downloadUrl)).toBe(true);

		const afterScroll = startMessageDownload('first');
		afterScroll.cancel();

		expect(cancelAsync).toHaveBeenCalledTimes(1);
		expect(isDownloadActive(downloadUrl)).toBe(false);
	});

	it('saves the file for a Message that left before the transfer finished', async () => {
		const { transfer } = mockTransfer();
		const messageRecord = makeFakeRecord('messages#first', { attachments: [{ image_url: '/file-upload/abc/photo.jpg' }] });
		(getMessageById as jest.Mock).mockImplementation(async (id: string) => (id === 'first' ? messageRecord : null));
		startMessageDownload('first').detach();

		transfer.resolve({ uri: fileUri });
		await flush();

		expect(messageRecord.attachments[0].title_link).toBe(fileUri);
	});

	it('saves the file under each joined Message id, except the one that canceled', async () => {
		const { transfer } = mockTransfer();
		const records = Object.fromEntries(
			['first', 'second', 'third'].map(id => [
				id,
				makeFakeRecord(`messages#${id}`, { attachments: [{ image_url: '/file-upload/abc/photo.jpg' }] })
			])
		);
		(getMessageById as jest.Mock).mockImplementation(async (id: string) => records[id]);
		const first = startMessageDownload('first');
		const second = startMessageDownload('second');
		startMessageDownload('third').cancel();

		transfer.resolve({ uri: fileUri });
		await Promise.all([first.uri, second.uri]);

		expect(records.first.attachments[0].title_link).toBe(fileUri);
		expect(records.second.attachments[0].title_link).toBe(fileUri);
		expect(records.third.attachments[0].title_link).toBeUndefined();
	});

	it('finishes as downloaded when Cancel arrives while the file is being saved', async () => {
		const { transfer, cancelAsync } = mockTransfer();
		let finishSave: () => void = () => {};
		(getMessageById as jest.Mock).mockReturnValue(
			new Promise(resolve => {
				finishSave = () => resolve(null);
			})
		);
		const mediaDownload = startMessageDownload('first');
		transfer.resolve({ uri: fileUri });
		await flush();

		expect(mediaDownload.cancel()).toBe(false);
		finishSave();

		await expect(mediaDownload.uri).resolves.toBe(fileUri);
		expect(cancelAsync).not.toHaveBeenCalled();
	});

	it('fails an encrypted Message that joined a download which did not decrypt the file', async () => {
		const { transfer } = mockTransfer();
		const encryptedRecord = makeFakeRecord('messages#encrypted', {
			attachments: [{ image_url: '/file-upload/abc/photo.jpg', e2e: 'pending' }]
		});
		(getMessageById as jest.Mock).mockImplementation(async (id: string) => (id === 'encrypted' ? encryptedRecord : null));
		const plain = startMessageDownload('plain');
		const encrypted = downloadMediaFile({
			messageId: 'encrypted',
			type: 'image',
			downloadUrl,
			encryption: { iv: 'iv', key: {} },
			originalChecksum: 'checksum'
		});

		transfer.resolve({ uri: fileUri });

		await expect(plain.uri).resolves.toBe(fileUri);
		await expect(encrypted.uri).rejects.toThrow('Media download was not decrypted');
		expect(encryptedRecord.attachments[0].e2e).toBe('pending');
		expect(encryptedRecord.attachments[0].title_link).toBeUndefined();
	});

	it('ignores Cancel once the transfer has finished, while the file is decrypted', async () => {
		const { transfer, cancelAsync } = mockTransfer();
		let finishDecrypt: () => void = () => {};
		const mockDecrypt = Encryption.addFileToDecryptFileQueue as jest.Mock;
		mockDecrypt.mockReturnValue(
			new Promise(resolve => {
				finishDecrypt = () => resolve(undefined);
			})
		);
		const mediaDownload = downloadMediaFile({
			messageId: 'encrypted',
			type: 'image',
			downloadUrl,
			encryption: { iv: 'iv', key: {} },
			originalChecksum: 'checksum'
		});
		transfer.resolve({ uri: fileUri });
		await flush();
		expect(mockDecrypt).toHaveBeenCalled();

		expect(mediaDownload.cancel()).toBe(false);
		finishDecrypt();

		await expect(mediaDownload.uri).resolves.toBe(fileUri);
		expect(cancelAsync).not.toHaveBeenCalled();
	});

	it('keeps a newer download active when a canceled transfer settles after it started', async () => {
		const stale = mockTransfer();
		stale.cancelAsync.mockResolvedValue(undefined);
		startMessageDownload('first').cancel();

		const fresh = mockTransfer();
		const retry = startMessageDownload('first');
		stale.transfer.resolve(undefined);
		await flush();

		expect(isDownloadActive(downloadUrl)).toBe(true);
		fresh.transfer.resolve({ uri: fileUri });
		await expect(retry.uri).resolves.toBe(fileUri);
	});
});

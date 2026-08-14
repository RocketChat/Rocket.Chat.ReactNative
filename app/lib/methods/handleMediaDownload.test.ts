import { getFilePath, getFilename, matchDownloadUrl, persistMessage } from './handleMediaDownload';
import database from '../database';
import { getMessageById } from '../database/services/Message';
import { getThreadById } from '../database/services/Thread';
import { getThreadMessageById } from '../database/services/ThreadMessage';
import { createBatchMock, deferred, flush, makeFakeRecord } from '../database/__tests__/mockedWatermelonDB';

const mockDbBatch = createBatchMock();
jest.mock('../database', () => {
	const { createWriterLock } = require('../database/__tests__/mockedWatermelonDB');
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

jest.mock('../database/services/Message', () => ({
	getMessageById: jest.fn()
}));

jest.mock('../database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../database/services/ThreadMessage', () => ({
	getThreadMessageById: jest.fn()
}));

jest.mock('../store/auxStore', () => ({
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

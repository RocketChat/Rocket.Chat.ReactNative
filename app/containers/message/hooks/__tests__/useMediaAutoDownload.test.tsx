import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMediaAutoDownload } from '../useMediaAutoDownload';
import { MessageProvider } from '~/containers/message/stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '~/containers/message/stores/MessageRoomStore';
import { mockedStore } from '~/reducers/mockedStore';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { type IAttachment } from '~/definitions/IAttachment';
import { type IUserMessage, type TAnyMessageModel } from '~/definitions/IMessage';
import { downloadMediaFile, getMediaCache, isDownloadActive } from '~/lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '~/lib/methods/autoDownloadPreference';
import { isImageBase64 } from '~/lib/methods/isImageBase64';
import { store } from '~/lib/store/auxStore';

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

jest.mock('~/lib/methods/handleMediaDownload', () => ({
	downloadMediaFile: jest.fn(),
	getMediaCache: jest.fn(),
	isDownloadActive: jest.fn()
}));

jest.mock('~/lib/methods/autoDownloadPreference', () => ({
	fetchAutoDownloadEnabled: jest.fn()
}));

jest.mock('~/lib/methods/isImageBase64', () => ({
	isImageBase64: jest.fn()
}));

const mockDownloadMediaFile = downloadMediaFile as jest.Mock;
const mockGetMediaCache = getMediaCache as jest.Mock;
const mockIsDownloadActive = isDownloadActive as jest.Mock;
const mockFetchAutoDownloadEnabled = fetchAutoDownloadEnabled as jest.Mock;
const mockIsImageBase64 = isImageBase64 as jest.Mock;
const mockGetState = store.getState as jest.Mock;

const URL = 'https://open.rocket.chat/file.png';

const mediaDownload = (uri: Promise<string>) => ({ uri, cancel: jest.fn(), detach: jest.fn() });

const pendingMediaDownload = () => {
	let finish: (uri: string) => void = () => {};
	let stop: (error: Error) => void = () => {};
	const handle = mediaDownload(
		new Promise<string>((resolve, reject) => {
			finish = resolve;
			stop = reject;
		})
	);
	handle.cancel.mockImplementation(() => stop(new Error('canceled')));
	handle.detach.mockImplementation(() => stop(new Error('detached')));
	return { handle, finish: (uri: string) => finish(uri) };
};
const USER = { id: 'user-1', username: 'john', token: 'token' };

mockedStore.dispatch(setUser(USER));
mockedStore.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '', name: '' }));

// Flushes the mount effect's async cache/auto-download chain inside act, used when the
// final status equals the initial 'to-download' so there is no change for waitFor to await.
const flushMount = () =>
	act(async () => {
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
	});

const renderMediaHook = ({
	file,
	author,
	showAttachment,
	ctx = {}
}: {
	file: IAttachment;
	author?: IUserMessage;
	showAttachment?: (file: IAttachment) => void;
	ctx?: Partial<MessageRoomState>;
}) => {
	const contextValue: Partial<MessageRoomState> = { ...ctx };
	const item = { id: 'msg-1' } as unknown as TAnyMessageModel;
	const wrapper = ({ children }: { children: ReactNode }) => (
		<Provider store={mockedStore}>
			<MessageRoomProvider {...contextValue}>
				<MessageProvider item={item}>{children}</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
	return renderHook(
		(props: { file: IAttachment; author?: IUserMessage; showAttachment?: (file: IAttachment) => void }) =>
			useMediaAutoDownload(props),
		{
			wrapper,
			initialProps: { file, author, showAttachment }
		}
	);
};

describe('useMediaAutoDownload', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetState.mockReturnValue({ settings: { FileUpload_ProtectFiles: false } });
		mockIsImageBase64.mockReturnValue(false);
		mockGetMediaCache.mockResolvedValue({ exists: false });
		mockIsDownloadActive.mockReturnValue(false);
		mockFetchAutoDownloadEnabled.mockReturnValue(false);
		mockDownloadMediaFile.mockImplementation(() => mediaDownload(Promise.resolve('file://downloaded')));
	});

	describe('getFileType selection', () => {
		it('resolves an image file to the image auto-download preference', async () => {
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await flushMount();
			expect(mockFetchAutoDownloadEnabled).toHaveBeenCalledWith('imagePreferenceDownload');
			expect(result.current.status).toBe('to-download');
		});

		it('resolves a video file to the video auto-download preference', async () => {
			renderMediaHook({ file: { video_url: '/video' } });
			await flushMount();
			expect(mockFetchAutoDownloadEnabled).toHaveBeenCalledWith('videoPreferenceDownload');
		});

		it('resolves an audio file to the audio auto-download preference', async () => {
			renderMediaHook({ file: { audio_url: '/audio' } });
			await flushMount();
			expect(mockFetchAutoDownloadEnabled).toHaveBeenCalledWith('audioPreferenceDownload');
		});

		it('does not try to auto-download when the file has no media url', async () => {
			renderMediaHook({ file: {} });
			await flushMount();
			expect(mockFetchAutoDownloadEnabled).not.toHaveBeenCalled();
			expect(mockDownloadMediaFile).not.toHaveBeenCalled();
		});
	});

	describe('isEncrypted', () => {
		it('is true when the current file e2e is pending', async () => {
			const { result } = renderMediaHook({ file: { image_url: '/img', e2e: 'pending' } });
			await flushMount();
			expect(result.current.isEncrypted).toBe(true);
		});

		it('is false when the current file e2e is not pending', async () => {
			const { result } = renderMediaHook({ file: { image_url: '/img', e2e: 'done' } });
			await flushMount();
			expect(mockGetMediaCache).toHaveBeenCalled();
			expect(result.current.isEncrypted).toBe(false);
		});
	});

	describe('mount effect', () => {
		it('marks a base64 image as downloaded without hitting the cache', async () => {
			mockIsImageBase64.mockReturnValue(true);
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
			expect(mockGetMediaCache).not.toHaveBeenCalled();
		});

		it('marks the file downloaded and updates title_link when a non-encrypted cache exists', async () => {
			mockGetMediaCache.mockResolvedValue({ exists: true, uri: 'file://cache' });
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
			expect(result.current.currentFile.title_link).toBe('file://cache');
		});

		it('keeps the local title_link when the file prop changes back to the remote url', async () => {
			mockGetMediaCache.mockResolvedValue({ exists: true, uri: 'file://cache' });
			const { result, rerender } = renderMediaHook({ file: { image_url: '/img', title: 'original.png' } });
			await waitFor(() => expect(result.current.status).toBe('downloaded'));

			rerender({ file: { image_url: '/img', title: 'renamed.png', title_link: '/remote' } });

			expect(result.current.currentFile.title).toBe('renamed.png');
			expect(result.current.currentFile.title_link).toBe('file://cache');
		});

		it('joins an active download and shows loading until it finishes', async () => {
			mockIsDownloadActive.mockReturnValue(true);
			const { handle, finish: finishDownload } = pendingMediaDownload();
			mockDownloadMediaFile.mockReturnValue(handle);
			const { result } = renderMediaHook({ file: { image_url: '/file.png' } });
			await waitFor(() => expect(result.current.status).toBe('loading'));
			expect(mockDownloadMediaFile).toHaveBeenCalledWith(expect.objectContaining({ downloadUrl: URL }));

			await act(async () => finishDownload('file://joined'));
			expect(result.current.status).toBe('downloaded');
			expect(result.current.currentFile.title_link).toBe('file://joined');
		});

		it('returns to to-download when the joined download fails', async () => {
			mockIsDownloadActive.mockReturnValue(true);
			mockDownloadMediaFile.mockImplementation(() => mediaDownload(Promise.reject(new Error('boom'))));
			const { result } = renderMediaHook({ file: { image_url: '/file.png' } });
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalled());
			await waitFor(() => expect(result.current.status).toBe('to-download'));
		});
	});

	describe('tryAutoDownload', () => {
		it('downloads when the auto-download preference is enabled', async () => {
			mockFetchAutoDownloadEnabled.mockReturnValue(true);
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalled());
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
			expect(result.current.currentFile.title_link).toBe('file://downloaded');
		});

		it('downloads when the author is the current user even if auto-download is disabled', async () => {
			renderMediaHook({ file: { image_url: '/img' }, author: { _id: 'user-1' } as IUserMessage });
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalled());
		});

		it('stays in to-download when auto-download is disabled and the author is someone else', async () => {
			const { result } = renderMediaHook({ file: { image_url: '/img' }, author: { _id: 'other' } as IUserMessage });
			await flushMount();
			expect(mockFetchAutoDownloadEnabled).toHaveBeenCalled();
			expect(mockDownloadMediaFile).not.toHaveBeenCalled();
			expect(result.current.status).toBe('to-download');
		});

		it('returns to to-download when the download fails', async () => {
			mockFetchAutoDownloadEnabled.mockReturnValue(true);
			mockDownloadMediaFile.mockImplementation(() => mediaDownload(Promise.reject(new Error('boom'))));
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalled());
			await waitFor(() => expect(result.current.status).toBe('to-download'));
		});

		it('retries and succeeds after a previous download failure', async () => {
			mockFetchAutoDownloadEnabled.mockReturnValue(true);
			mockDownloadMediaFile.mockImplementationOnce(() => mediaDownload(Promise.reject(new Error('boom'))));
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalledTimes(1));
			await waitFor(() => expect(result.current.status).toBe('to-download'));

			await act(async () => result.current.onPress());
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalledTimes(2));
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
		});
	});

	describe('onPress', () => {
		it('cancels only its own download and returns to to-download while loading', async () => {
			mockIsDownloadActive.mockReturnValue(true);
			const { handle } = pendingMediaDownload();
			mockDownloadMediaFile.mockReturnValue(handle);
			const { result } = renderMediaHook({ file: { image_url: '/file.png' } });
			await waitFor(() => expect(result.current.status).toBe('loading'));

			await act(async () => result.current.onPress());
			expect(handle.cancel).toHaveBeenCalledTimes(1);
			expect(result.current.status).toBe('to-download');
		});

		it('downloads again after a cancel', async () => {
			mockDownloadMediaFile.mockImplementationOnce(() => pendingMediaDownload().handle);
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await flushMount();

			await act(async () => result.current.onPress());
			expect(result.current.status).toBe('loading');
			await act(async () => result.current.onPress());
			expect(result.current.status).toBe('to-download');

			await act(async () => result.current.onPress());
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
			expect(mockDownloadMediaFile).toHaveBeenCalledTimes(2);
		});

		it('starts one download when the mount auto-download and a tap overlap', async () => {
			let finishCacheCheck: (cache: { exists: boolean }) => void = () => {};
			mockGetMediaCache.mockReturnValue(
				new Promise(resolve => {
					finishCacheCheck = resolve;
				})
			);
			mockFetchAutoDownloadEnabled.mockReturnValue(true);
			const { handle } = pendingMediaDownload();
			mockDownloadMediaFile.mockReturnValue(handle);
			const { result } = renderMediaHook({ file: { image_url: '/img' } });

			await act(async () => result.current.onPress());
			await act(async () => finishCacheCheck({ exists: false }));
			expect(mockDownloadMediaFile).toHaveBeenCalledTimes(1);

			await act(async () => result.current.onPress());
			expect(handle.cancel).toHaveBeenCalledTimes(1);
			expect(result.current.status).toBe('to-download');
		});

		it('does not start a download when the Message unmounts during the cache check', async () => {
			let finishCacheCheck: (cache: { exists: boolean }) => void = () => {};
			mockGetMediaCache.mockReturnValue(
				new Promise(resolve => {
					finishCacheCheck = resolve;
				})
			);
			mockIsDownloadActive.mockReturnValue(true);
			const { unmount } = renderMediaHook({ file: { image_url: '/img' } });

			unmount();
			await act(async () => finishCacheCheck({ exists: false }));
			expect(mockDownloadMediaFile).not.toHaveBeenCalled();
		});

		it('detaches without canceling when the Message unmounts mid-download', async () => {
			mockIsDownloadActive.mockReturnValue(true);
			const { handle } = pendingMediaDownload();
			mockDownloadMediaFile.mockReturnValue(handle);
			const { result, unmount } = renderMediaHook({ file: { image_url: '/file.png' } });
			await waitFor(() => expect(result.current.status).toBe('loading'));

			unmount();
			expect(handle.detach).toHaveBeenCalledTimes(1);
			expect(handle.cancel).not.toHaveBeenCalled();
		});

		it('starts a download when pressed in the to-download state', async () => {
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await flushMount();
			expect(result.current.status).toBe('to-download');
			expect(mockDownloadMediaFile).not.toHaveBeenCalled();

			await act(async () => result.current.onPress());
			expect(mockDownloadMediaFile).toHaveBeenCalledTimes(1);
		});

		it('opens the attachment when downloaded, unlocked and openable', async () => {
			mockGetMediaCache.mockResolvedValue({ exists: true, uri: 'file://cache' });
			const showAttachment = jest.fn();
			const { result } = renderMediaHook({ file: { image_url: '/img' }, showAttachment });
			await waitFor(() => expect(result.current.status).toBe('downloaded'));

			act(() => result.current.onPress());
			expect(showAttachment).toHaveBeenCalledWith(expect.objectContaining({ title_link: 'file://cache' }));
		});

		it('does not open the attachment when there is no showAttachment handler', async () => {
			mockGetMediaCache.mockResolvedValue({ exists: true, uri: 'file://cache' });
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(result.current.status).toBe('downloaded'));

			act(() => result.current.onPress());
			expect(result.current.status).toBe('downloaded');
		});

		it('does not open the attachment while it is still encrypted', async () => {
			mockIsImageBase64.mockReturnValue(true);
			const showAttachment = jest.fn();
			const { result } = renderMediaHook({ file: { image_url: '/file.png', e2e: 'pending' }, showAttachment });
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
			expect(result.current.isEncrypted).toBe(true);

			act(() => result.current.onPress());
			expect(showAttachment).not.toHaveBeenCalled();
		});
	});

	describe('attachment credentials', () => {
		beforeEach(() => {
			mockGetState.mockReturnValue({ settings: { FileUpload_ProtectFiles: true } });
		});

		const getUrl = (file: IAttachment) => renderMediaHook({ file }).result.current.url as string;

		it('adds credentials to a file hosted on the workspace', () => {
			expect(getUrl({ title_link: '/file.png', image_url: URL })).toBe(`${URL}?rc_token=${USER.token}&rc_uid=${USER.id}`);
		});

		it('does not rewrite the credentials already on an untrusted url', () => {
			const attackerUrl = 'https://evil.example/x.png?rc_token=attacker&rc_uid=attacker';
			expect(getUrl({ image_url: attackerUrl })).toBe(attackerUrl);
			expect(getUrl({ title_link: attackerUrl, image_url: URL })).toBe(attackerUrl);
		});

		it.each([
			['plain image_url on attacker host', { image_url: 'https://evil.example/pixel.jpg' }],
			['title_link on attacker host, image_url on the real server', { title_link: 'https://evil.example/x.jpg', image_url: URL }],
			[
				'title_link on attacker host, image_url on a look-alike host',
				{ title_link: 'https://evil.example/x.jpg', image_url: 'https://open.rocket.chat.evil.example/x.png' }
			],
			[
				'title_link on attacker host, image_url with userinfo',
				{ title_link: 'https://evil.example/x.jpg', image_url: 'https://open.rocket.chat@evil.example/x.png' }
			],
			['title_link on attacker host, no image_url', { title_link: 'https://evil.example/x.jpg', image_type: 'image/png' }],
			['video title_link on attacker host', { title_link: 'https://evil.example/v.mp4', video_url: URL }],
			['audio title_link on attacker host', { title_link: 'https://evil.example/a.mp3', audio_url: URL }]
		] as [string, IAttachment][])('does not send credentials for %s', (_name, file) => {
			const url = getUrl(file);
			expect(url).not.toContain('rc_token');
			expect(url).not.toContain('rc_uid');
		});
	});
});

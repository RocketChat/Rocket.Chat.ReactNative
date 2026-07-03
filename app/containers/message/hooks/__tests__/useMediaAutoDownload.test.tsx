import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMediaAutoDownload } from '../useMediaAutoDownload';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type IAttachment, type IUserMessage, type TAnyMessageModel } from '../../../../definitions';
import { cancelDownload, downloadMediaFile, getMediaCache, isDownloadActive } from '../../../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';
import { isImageBase64 } from '../../../../lib/methods/isImageBase64';
import { emitter } from '../../../../lib/methods/helpers/emitter';

jest.mock('../../../../lib/methods/handleMediaDownload', () => ({
	downloadMediaFile: jest.fn(),
	getMediaCache: jest.fn(),
	isDownloadActive: jest.fn(),
	cancelDownload: jest.fn()
}));

jest.mock('../../../../lib/methods/autoDownloadPreference', () => ({
	fetchAutoDownloadEnabled: jest.fn()
}));

jest.mock('../../../../lib/methods/helpers/formatAttachmentUrl', () => ({
	formatAttachmentUrl: jest.fn()
}));

jest.mock('../../../../lib/methods/isImageBase64', () => ({
	isImageBase64: jest.fn()
}));

// Real mitt behind spies so resumeDownload registrations can be observed and the
// download listener can be driven with emitter.emit.
jest.mock('../../../../lib/methods/helpers/emitter', () => {
	const mittModule = require('mitt');
	const mitt = mittModule.default || mittModule;
	const instance = mitt();
	return {
		emitter: {
			on: jest.fn((type: string, handler: (uri: string) => void) => instance.on(type, handler)),
			off: jest.fn((type: string, handler: (uri: string) => void) => instance.off(type, handler)),
			emit: (type: string, event: string) => instance.emit(type, event)
		}
	};
});

// The persisted/localFile logic is covered by useFile.test; here useFile is a plain
// state cell so setCurrentFile merges are observable through the returned currentFile.
jest.mock('../useFile', () => {
	const { useState } = require('react');
	return {
		useFile: (file: IAttachment) => {
			const [current, setCurrent] = useState(file);
			const manage = (partial: Partial<IAttachment>) => setCurrent((prev: IAttachment) => ({ ...prev, ...partial }));
			return [current, manage];
		}
	};
});

const mockDownloadMediaFile = downloadMediaFile as jest.Mock;
const mockGetMediaCache = getMediaCache as jest.Mock;
const mockIsDownloadActive = isDownloadActive as jest.Mock;
const mockCancelDownload = cancelDownload as jest.Mock;
const mockFetchAutoDownloadEnabled = fetchAutoDownloadEnabled as jest.Mock;
const mockFormatAttachmentUrl = formatAttachmentUrl as jest.Mock;
const mockIsImageBase64 = isImageBase64 as jest.Mock;
const mockEmitterOn = emitter.on as jest.Mock;

const URL = 'https://open.rocket.chat/file.png';
const USER = { id: 'user-1', username: 'john', token: 'token' };

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
	const contextValue: Partial<MessageRoomState> = { baseUrl: 'https://open.rocket.chat', user: USER, ...ctx };
	const item = { id: 'msg-1' } as unknown as TAnyMessageModel;
	const wrapper = ({ children }: { children: ReactNode }) => (
		<Provider store={mockedStore}>
			<MessageRoomProvider {...contextValue}>
				<MessageProvider item={item}>{children}</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
	return renderHook(() => useMediaAutoDownload({ file, author, showAttachment }), { wrapper });
};

describe('useMediaAutoDownload', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFormatAttachmentUrl.mockReturnValue(URL);
		mockIsImageBase64.mockReturnValue(false);
		mockGetMediaCache.mockResolvedValue({ exists: false });
		mockIsDownloadActive.mockReturnValue(false);
		mockFetchAutoDownloadEnabled.mockReturnValue(false);
		mockDownloadMediaFile.mockResolvedValue('file://downloaded');
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

		it('defaults to the image preference when the file has no media url', async () => {
			renderMediaHook({ file: {} });
			await flushMount();
			expect(mockFetchAutoDownloadEnabled).toHaveBeenCalledWith('imagePreferenceDownload');
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

		it('resumes an active download by registering the download listener and showing loading', async () => {
			mockIsDownloadActive.mockReturnValue(true);
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(result.current.status).toBe('loading'));
			expect(mockEmitterOn).toHaveBeenCalledWith(`downloadMedia${URL}`, expect.any(Function));
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
			mockDownloadMediaFile.mockRejectedValue(new Error('boom'));
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(mockDownloadMediaFile).toHaveBeenCalled());
			await waitFor(() => expect(result.current.status).toBe('to-download'));
		});
	});

	describe('onPress', () => {
		it('cancels the download and returns to to-download while loading', async () => {
			mockIsDownloadActive.mockReturnValue(true);
			const { result } = renderMediaHook({ file: { image_url: '/img' } });
			await waitFor(() => expect(result.current.status).toBe('loading'));

			act(() => result.current.onPress());
			expect(mockCancelDownload).toHaveBeenCalledWith(URL);
			expect(result.current.status).toBe('to-download');
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
			mockIsDownloadActive.mockReturnValue(true);
			const showAttachment = jest.fn();
			const { result } = renderMediaHook({ file: { image_url: '/img', e2e: 'pending' }, showAttachment });
			await waitFor(() => expect(result.current.status).toBe('loading'));

			act(() => emitter.emit(`downloadMedia${URL}`, 'file://encrypted'));
			await waitFor(() => expect(result.current.status).toBe('downloaded'));
			expect(result.current.isEncrypted).toBe(true);

			act(() => result.current.onPress());
			expect(showAttachment).not.toHaveBeenCalled();
		});
	});
});

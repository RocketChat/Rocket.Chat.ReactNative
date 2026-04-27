import { renderHook, waitFor } from '@testing-library/react-native';

import { useChooseMedia } from './useChooseMedia';

jest.mock('expo-document-picker', () => ({
	getDocumentAsync: jest.fn()
}));

jest.mock('../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('../context', () => ({
	useMessageComposerApi: jest.fn()
}));

jest.mock('../../../views/RoomView/context', () => ({
	useRoomContext: jest.fn()
}));

jest.mock('../../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: jest.fn()
}));

jest.mock('../../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../../lib/navigation/appNavigation', () => ({
	navigate: jest.fn()
}));

jest.mock('../../../lib/methods/helpers/ImagePicker/ImagePicker', () => ({
	__esModule: true,
	default: {
		openCamera: jest.fn(),
		openPicker: jest.fn()
	}
}));

const mockGetDocumentAsync = require('expo-document-picker').getDocumentAsync as jest.Mock;
const mockUseAppSelector = require('../../../lib/hooks/useAppSelector').useAppSelector as jest.Mock;
const mockUseMessageComposerApi = require('../context').useMessageComposerApi as jest.Mock;
const mockUseRoomContext = require('../../../views/RoomView/context').useRoomContext as jest.Mock;
const mockUseAltTextSupported = require('../../../lib/hooks/useAltTextSupported').useAltTextSupported as jest.Mock;
const mockGetSubscriptionByRoomId = require('../../../lib/database/services/Subscription').getSubscriptionByRoomId as jest.Mock;
const mockGetThreadById = require('../../../lib/database/services/Thread').getThreadById as jest.Mock;
const mockNavigate = require('../../../lib/navigation/appNavigation').navigate as jest.Mock;

describe('useChooseMedia', () => {
	const addAttachments = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseAppSelector.mockImplementation(selector =>
			selector({
				settings: {
					FileUpload_MediaTypeWhiteList: '*',
					FileUpload_MaxFileSize: 1000
				}
			})
		);
		mockUseMessageComposerApi.mockReturnValue({ addAttachments });
		mockUseRoomContext.mockReturnValue({
			action: null,
			setQuotesAndText: jest.fn(),
			selectedMessages: [],
			getText: jest.fn(() => 'draft')
		});
		mockGetSubscriptionByRoomId.mockResolvedValue({ rid: 'room-id', t: 'c' });
		mockGetThreadById.mockResolvedValue({ id: 'thread-id' });
	});

	it('opens ShareView on servers below 8.4', async () => {
		mockUseAltTextSupported.mockReturnValue(false);
		mockGetDocumentAsync.mockResolvedValue({
			canceled: false,
			assets: [{ name: 'legacy.pdf', size: 12, mimeType: 'application/pdf', uri: 'file:///tmp/legacy.pdf' }]
		});

		const { result } = renderHook(() => useChooseMedia({ rid: 'room-id', tmid: 'thread-id', permissionToUpload: true }));

		await result.current.chooseFile();

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith(
				'ShareView',
				expect.objectContaining({
					room: expect.objectContaining({ rid: 'room-id' }),
					thread: expect.objectContaining({ id: 'thread-id' }),
					attachments: [
						expect.objectContaining({
							filename: 'legacy.pdf',
							path: 'file:///tmp/legacy.pdf'
						})
					]
				})
			);
		});
		expect(addAttachments).not.toHaveBeenCalled();
	});

	it('keeps inline composer attachments on servers 8.4 and above', async () => {
		mockUseAltTextSupported.mockReturnValue(true);
		mockGetDocumentAsync.mockResolvedValue({
			canceled: false,
			assets: [{ name: 'modern.pdf', size: 12, mimeType: 'application/pdf', uri: 'file:///tmp/modern.pdf' }]
		});

		const { result } = renderHook(() => useChooseMedia({ rid: 'room-id', tmid: 'thread-id', permissionToUpload: true }));

		await result.current.chooseFile();

		await waitFor(() => {
			expect(addAttachments).toHaveBeenCalledWith([
				expect.objectContaining({
					filename: 'modern.pdf',
					path: 'file:///tmp/modern.pdf',
					canUpload: true
				})
			]);
		});
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});

import { type ReactNode } from 'react';
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react-native';

import { MessageActionProvider, createMessageActionStore } from '../../../message/stores/MessageActionStore';
import { MessageInnerContext } from '../../context';
import { useChooseMedia } from '../useChooseMedia';

jest.mock('expo-document-picker', () => ({
	getDocumentAsync: jest.fn()
}));

jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn()
}));

jest.mock('../../store', () => ({
	...jest.requireActual('../../store'),
	useMessageComposerApi: jest.fn()
}));

jest.mock('../../../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: jest.fn()
}));

jest.mock('../../../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../../../lib/navigation/appNavigation', () => ({
	navigate: jest.fn()
}));

jest.mock('../../../../lib/methods/helpers/ImagePicker/ImagePicker', () => ({
	__esModule: true,
	default: {
		openCamera: jest.fn(),
		openPicker: jest.fn()
	}
}));

const mockGetDocumentAsync = require('expo-document-picker').getDocumentAsync as jest.Mock;
const mockUseAppSelector = require('../../../../lib/hooks/useAppSelector').useAppSelector as jest.Mock;
const mockUseMessageComposerApi = require('../../store').useMessageComposerApi as jest.Mock;
const mockUseAltTextSupported = require('../../../../lib/hooks/useAltTextSupported').useAltTextSupported as jest.Mock;
const mockGetSubscriptionByRoomId = require('../../../../lib/database/services/Subscription')
	.getSubscriptionByRoomId as jest.Mock;
const mockGetThreadById = require('../../../../lib/database/services/Thread').getThreadById as jest.Mock;
const mockNavigate = require('../../../../lib/navigation/appNavigation').navigate as jest.Mock;

describe('useChooseMedia', () => {
	const addAttachments = jest.fn();
	const getText = jest.fn(() => 'draft');
	const setInput = jest.fn();

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
		mockGetSubscriptionByRoomId.mockResolvedValue({ rid: 'room-id', t: 'c' });
		mockGetThreadById.mockResolvedValue({ id: 'thread-id' });
		mockGetDocumentAsync.mockResolvedValue({
			canceled: false,
			assets: [{ name: 'document.pdf', size: 12, mimeType: 'application/pdf', uri: 'file:///tmp/document.pdf' }]
		});
	});

	const setup = (
		initialAction: Parameters<typeof createMessageActionStore>[0] = null
	): RenderHookResult<ReturnType<typeof useChooseMedia>, unknown> & {
		messageActionStore: ReturnType<typeof createMessageActionStore>;
	} => {
		const messageActionStore = createMessageActionStore(initialAction);
		const wrapper = ({ children }: { children: ReactNode }) => (
			<MessageActionProvider store={messageActionStore}>
				<MessageInnerContext.Provider
					value={{
						sendMessage: jest.fn(),
						onEmojiSelected: jest.fn(),
						closeEmojiKeyboardAndAction: jest.fn(),
						focus: jest.fn(),
						getText,
						setInput
					}}>
					{children}
				</MessageInnerContext.Provider>
			</MessageActionProvider>
		);
		const hook = renderHook(() => useChooseMedia({ rid: 'room-id', tmid: 'thread-id', permissionToUpload: true }), {
			wrapper
		});
		return { messageActionStore, ...hook };
	};

	it('opens ShareView on servers below 8.4', async () => {
		mockUseAltTextSupported.mockReturnValue(false);
		const { result } = setup();

		await result.current.chooseFile();

		await waitFor(() =>
			expect(mockNavigate).toHaveBeenCalledWith(
				'ShareView',
				expect.objectContaining({
					room: expect.objectContaining({ rid: 'room-id' }),
					thread: expect.objectContaining({ id: 'thread-id' }),
					attachments: [expect.objectContaining({ filename: 'document.pdf', path: 'file:///tmp/document.pdf' })]
				})
			)
		);
		expect(addAttachments).not.toHaveBeenCalled();
	});

	it('keeps inline composer attachments on servers 8.4 and above', async () => {
		mockUseAltTextSupported.mockReturnValue(true);
		const { result } = setup();

		await result.current.chooseFile();

		await waitFor(() =>
			expect(addAttachments).toHaveBeenCalledWith([
				expect.objectContaining({ filename: 'document.pdf', path: 'file:///tmp/document.pdf', canUpload: true })
			])
		);
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it('reads text and quoted message ids at the composer boundary', async () => {
		mockUseAltTextSupported.mockReturnValue(false);
		const { result } = setup({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });

		await result.current.chooseFile();

		await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
		const { action, startShareView } = mockNavigate.mock.calls[0][1];
		expect(action).toBe('quote');
		expect(startShareView()).toEqual({ text: 'draft', selectedMessages: ['msg-1', 'msg-2'] });
		expect(getText).toHaveBeenCalledTimes(1);
	});

	it('does not quote the message when the action is edit', async () => {
		mockUseAltTextSupported.mockReturnValue(false);
		const { result } = setup({ kind: 'edit', messageId: 'msg-1' });

		await result.current.chooseFile();

		await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
		const { action, startShareView } = mockNavigate.mock.calls[0][1];
		expect(action).toBe('edit');
		expect(startShareView().selectedMessages).toEqual([]);
	});

	it('sets text and replaces quote ids at the composer boundary', async () => {
		mockUseAltTextSupported.mockReturnValue(false);
		const { result, messageActionStore } = setup({ kind: 'quote', messageIds: ['old-message'] });

		await result.current.chooseFile();

		await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
		const { finishShareView } = mockNavigate.mock.calls[0][1];
		act(() => finishShareView('updated text', ['msg-1', 'msg-2']));
		expect(setInput).toHaveBeenCalledWith('updated text');
		expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['msg-1', 'msg-2'] });

		act(() => finishShareView());
		expect(setInput).toHaveBeenLastCalledWith('');
		expect(messageActionStore.getState().action).toBeNull();
	});
});

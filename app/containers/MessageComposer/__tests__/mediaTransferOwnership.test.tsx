import { createRef, type RefObject } from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { getDocumentAsync } from 'expo-document-picker';

import { MessageComposerContainer } from '../MessageComposerContainer';
import { ComposerAttachments } from '../components/Attachments/ComposerAttachments';
import { ComposerProvider } from '../ComposerStore';
import { MessageActionProvider, useMessageActionStoreApi } from '../../message/stores/MessageActionStore';
import { useChooseMedia } from '../hooks/useChooseMedia';
import { type IMessageComposerRef } from '../interfaces';
import { setPermissions } from '../../../actions/permissions';
import { selectServerRequest } from '../../../actions/server';
import { setUser } from '../../../actions/login';
import { mockedStore } from '../../../reducers/mockedStore';
import { type TMessageActionState } from '../../../definitions';
import { initStore } from '../../../lib/store/auxStore';
import ImagePicker from '../../../lib/methods/helpers/ImagePicker/ImagePicker';
import Navigation from '../../../lib/navigation/appNavigation';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { getThreadById } from '../../../lib/database/services/Thread';
import { useAltTextSupported } from '../../../lib/hooks/useAltTextSupported';

jest.useFakeTimers();

jest.mock('expo-document-picker', () => ({
	getDocumentAsync: jest.fn()
}));

jest.mock('../../../lib/methods/helpers/ImagePicker/ImagePicker', () => ({
	__esModule: true,
	default: {
		openCamera: jest.fn(),
		openPicker: jest.fn()
	}
}));

jest.mock('../../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../../lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn() }
}));

jest.mock('../../../lib/methods/draftMessage', () => ({
	loadDraftMessage: jest.fn(() => Promise.resolve('')),
	saveDraftMessage: jest.fn()
}));

jest.mock('../../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: jest.fn()
}));

jest.mock('../../../lib/database/services/Message', () => ({
	getMessageById: (messageId: string) => ({ id: messageId, rid: 'rid', msg: `Message ${messageId}`, attachments: [] })
}));

jest.mock('../hooks/useMessage', () => ({
	useMessage: (messageId: string) => ({ id: messageId, msg: 'quote this', u: { username: 'rocket.cat' } })
}));

mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '6.4.0'));
mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));
mockedStore.dispatch(setPermissions({ 'mobile-upload-file': ['user'] }));
initStore(mockedStore);

const composerContext = {
	rid: 'rid',
	roomRead: {
		room: { rid: 'rid', t: 'd', name: 'Rocket Chat', fname: 'Rocket Chat', usernames: ['user1', 'user2'], federated: false }
	},
	sharing: false,
	editCancel: jest.fn(),
	editRequest: jest.fn(),
	onSendMessage: jest.fn(),
	onRemoveQuoteMessage: jest.fn()
};

const document = { name: 'legacy.pdf', size: 12, mimeType: 'application/pdf', uri: 'file:///tmp/legacy.pdf' };

type MediaHandles = {
	chooseMedia: ReturnType<typeof useChooseMedia>;
	actionStore: ReturnType<typeof useMessageActionStoreApi>;
};

const MediaProbe = ({ handles, rid, tmid }: { handles: RefObject<MediaHandles | null>; rid: string; tmid: string }) => {
	handles.current = {
		chooseMedia: useChooseMedia({ rid, tmid, permissionToUpload: true }),
		actionStore: useMessageActionStoreApi()
	};
	return null;
};

const composerInstance = ({
	rid = 'rid',
	tmid = 'thread-id',
	action
}: {
	rid?: string;
	tmid?: string;
	action?: TMessageActionState;
}) => {
	const composerRef = createRef<IMessageComposerRef>();
	const handles = createRef<MediaHandles>();
	const element = (
		<MessageActionProvider initialAction={action}>
			<ComposerProvider {...composerContext} tmid={tmid || undefined}>
				<MessageComposerContainer ref={composerRef}>
					<>
						<ComposerAttachments />
						<MediaProbe handles={handles} rid={rid} tmid={tmid} />
					</>
				</MessageComposerContainer>
			</ComposerProvider>
		</MessageActionProvider>
	);
	return {
		element,
		getText: () => composerRef.current?.getText(),
		setInput: (text: string) => composerRef.current?.setInput(text),
		media: () => handles.current!.chooseMedia,
		action: () => handles.current!.actionStore.getState().action,
		startReacting: (messageId: string) => handles.current!.actionStore.getState().actions.startReacting(messageId),
		mounted: () => waitFor(() => expect(handles.current).not.toBeNull())
	};
};

const renderComposers = async (...instances: ReturnType<typeof composerInstance>[]) => {
	render(<Provider store={mockedStore}>{instances.map(instance => instance.element)}</Provider>);
	await Promise.all(instances.map(instance => instance.mounted()));
};

const shareViewParams = (predicate: (params: any) => boolean = () => true) =>
	jest
		.mocked(Navigation.navigate)
		.mock.calls.map(([, params]: any[]) => params)
		.find(predicate);

beforeEach(() => {
	jest.mocked(useAltTextSupported).mockReturnValue(false);
	jest.mocked(getDocumentAsync).mockReset();
	jest.mocked(ImagePicker.openCamera).mockReset();
	jest.mocked(ImagePicker.openPicker).mockReset();
	jest.mocked(Navigation.navigate).mockClear();
	jest.mocked(getSubscriptionByRoomId).mockResolvedValue({
		rid: 'rid',
		t: 'c',
		roles: [],
		observe: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) })
	} as any);
	jest.mocked(getThreadById).mockResolvedValue({ id: 'thread-id' } as any);
});

describe('media transfer ownership', () => {
	test('legacy transfer reads current text while retaining Quote IDs captured by the initiating render', async () => {
		let resolveDocument!: (result: unknown) => void;
		jest.mocked(getDocumentAsync).mockReturnValueOnce(new Promise(resolve => (resolveDocument = resolve)) as any);
		const composer = composerInstance({ action: { kind: 'quote', messageIds: ['old-quote'] } });
		await renderComposers(composer);

		const choosePromise = composer.media().chooseFile();
		composer.setInput('awaiting text');
		composer.startReacting('react-now');
		resolveDocument({ canceled: false, assets: [document] });
		await choosePromise;
		composer.setInput('current text');
		composer.startReacting('react-after-resolution');

		const params = shareViewParams();
		expect(params.startShareView()).toEqual({ text: 'current text', selectedMessages: ['old-quote'] });
		params.finishShareView('', []);
		expect(composer.getText()).toBe('');
		expect(composer.action()).toBeNull();
	});

	test.each(['chooseFile', 'takePhoto', 'chooseFromLibrary'] as const)(
		'%s cancellation leaves input and Quotes unchanged',
		async method => {
			const composer = composerInstance({ action: { kind: 'quote', messageIds: ['kept-quote'] } });
			await renderComposers(composer);
			composer.setInput('kept text');
			if (method === 'chooseFile') {
				jest.mocked(getDocumentAsync).mockResolvedValueOnce({ canceled: true } as any);
			} else {
				jest
					.mocked(method === 'takePhoto' ? ImagePicker.openCamera : ImagePicker.openPicker)
					.mockRejectedValueOnce(new Error('cancelled'));
			}

			await composer.media()[method]();
			expect(Navigation.navigate).not.toHaveBeenCalled();
			expect(composer.getText()).toBe('kept text');
			expect(composer.action()).toEqual({ kind: 'quote', messageIds: ['kept-quote'] });
		}
	);

	test('same-rid Room and Thread composers transfer and restore independently', async () => {
		jest.mocked(getDocumentAsync).mockResolvedValue({ canceled: false, assets: [document] } as any);
		const room = composerInstance({ rid: 'same-rid', tmid: '', action: { kind: 'quote', messageIds: ['room-quote'] } });
		const thread = composerInstance({
			rid: 'same-rid',
			tmid: 'thread-id',
			action: { kind: 'quote', messageIds: ['thread-quote'] }
		});
		await renderComposers(room, thread);
		room.setInput('room text');
		thread.setInput('thread text');
		await Promise.all([room.media().chooseFile(), thread.media().chooseFile()]);

		expect(Navigation.navigate).toHaveBeenCalledTimes(2);
		const roomParams = shareViewParams(params => params.thread === '');
		const threadParams = shareViewParams(params => params.thread?.id === 'thread-id');
		expect(roomParams.startShareView().text).toBe('room text');
		expect(threadParams.startShareView().text).toBe('thread text');
		roomParams.finishShareView('room restored', ['room-restored']);
		threadParams.finishShareView('thread restored', ['thread-restored']);
		expect(room.getText()).toBe('room restored');
		expect(thread.getText()).toBe('thread restored');
		expect(room.action()).toEqual({ kind: 'quote', messageIds: ['room-restored'] });
		expect(thread.action()).toEqual({ kind: 'quote', messageIds: ['thread-restored'] });
	});

	test('alt-text capable workspaces keep selected media inline', async () => {
		jest.mocked(useAltTextSupported).mockReturnValue(true);
		jest.mocked(getDocumentAsync).mockResolvedValueOnce({ canceled: false, assets: [document] } as any);
		const composer = composerInstance({});
		await renderComposers(composer);
		await composer.media().chooseFile();
		await waitFor(() => expect(screen.getByTestId('message-composer-attachments')).toBeOnTheScreen());
		expect(Navigation.navigate).not.toHaveBeenCalled();
	});
});

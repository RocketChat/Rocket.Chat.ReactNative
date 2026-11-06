import { useEffect, type ReactElement, type RefObject } from 'react';
import { act, render, screen, fireEvent, waitFor, userEvent } from '@testing-library/react-native';
import { Text, TextInput } from 'react-native';
import { Provider } from 'react-redux';

import { MessageComposerContainer } from '../MessageComposerContainer';
import { ComposerAttachments } from '../components/Attachments/ComposerAttachments';
import { setPermissions } from '~/actions/permissions';
import { addSettings } from '~/actions/settings';
import { selectServerRequest } from '~/actions/server';
import { setUser } from '~/actions/login';
import { mockedStore } from '~/reducers/mockedStore';
import { type IShareAttachment } from '~/definitions';
import { ComposerProvider, type TComposerExternalState } from '../ComposerStore';
import {
	createMessageActionStore,
	MessageActionProvider,
	type TMessageActionStore
} from '../../message/stores/MessageActionStore';
import { initStore } from '~/lib/store/auxStore';
import { useAlsoSendThreadToChannel, useMessageComposerApi } from '../context';
import { type IMessageComposerRef } from '../interfaces';
import { sendFileMessage } from '~/lib/methods/sendFileMessage';
import log from '~/lib/methods/helpers/log';

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('~/lib/methods/sendFileMessage', () => ({
	sendFileMessage: jest.fn(() => Promise.resolve())
}));

jest.mock('~/lib/database/services/Message', () => ({
	getMessageById: (messageId: string) => ({ id: messageId, rid: 'rid', msg: `Message ${messageId}`, attachments: [] })
}));

jest.useFakeTimers();

const user = userEvent.setup();

mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '6.4.0'));
mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));
mockedStore.dispatch(setPermissions({ 'mobile-upload-file': ['user'] }));
mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));
initStore(mockedStore);

const Render = ({
	context,
	store,
	children,
	forwardedRef
}: {
	context?: Partial<TComposerExternalState>;
	store?: TMessageActionStore;
	children?: ReactElement;
	forwardedRef?: RefObject<IMessageComposerRef | null>;
}) => (
	<Provider store={mockedStore}>
		<MessageActionProvider store={store}>
			<ComposerProvider rid='rid' t='d' tmid={undefined} roomTitle='Rocket Chat' sharing={false} {...context}>
				<MessageComposerContainer ref={forwardedRef}>
					<>
						<ComposerAttachments />
						{children}
					</>
				</MessageComposerContainer>
			</ComposerProvider>
		</MessageActionProvider>
	</Provider>
);

const AttachmentSeeder = ({ attachments }: { attachments: IShareAttachment[] }) => {
	const { addAttachments } = useMessageComposerApi();

	useEffect(() => {
		addAttachments(attachments);
	}, [addAttachments, attachments]);

	return null;
};

const AlsoSendToChannelTicked = () => {
	const { setAlsoSendThreadToChannel } = useMessageComposerApi();
	const alsoSendThreadToChannel = useAlsoSendThreadToChannel();

	useEffect(() => {
		setAlsoSendThreadToChannel(true);
	}, [setAlsoSendThreadToChannel]);

	return <Text testID='also-send-to-channel'>{String(alsoSendThreadToChannel)}</Text>;
};

describe('MessageComposer attachments', () => {
	const attachment = {
		filename: 'IMG_2444.png',
		size: 1234,
		mime: 'image/png',
		path: 'file:///tmp/IMG_2444.png',
		canUpload: true
	} as IShareAttachment;

	const sent = { ...attachment, filename: 'sent.png', path: 'file:///tmp/sent.png' } as IShareAttachment;
	const failed = { ...attachment, filename: 'failed.png', path: 'file:///tmp/failed.png' } as IShareAttachment;

	beforeEach(() => {
		(sendFileMessage as jest.Mock).mockClear();
		jest.mocked(log).mockClear();
	});

	const sendWithCaptionAndQuote = async (attachments: IShareAttachment[]) => {
		const composerRef = { current: null } as RefObject<IMessageComposerRef | null>;
		const messageActionStore = createMessageActionStore({ kind: 'quote', messageIds: ['abc'] });
		render(
			<Render forwardedRef={composerRef} store={messageActionStore}>
				<AttachmentSeeder attachments={attachments} />
			</Render>
		);
		await screen.findByTestId(`message-composer-attachment-${attachments.length - 1}`);
		await screen.findByTestId('composer-quote-abc');
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'caption');
		await user.press(screen.getByTestId('message-composer-send'));
		return { composerRef, messageActionStore };
	};

	const holdUpload = () => {
		const upload = { resolve: () => {}, reject: () => {} };
		(sendFileMessage as jest.Mock).mockImplementationOnce(
			() => new Promise<void>((resolve, reject) => Object.assign(upload, { resolve, reject }))
		);
		return upload;
	};

	test('shows inline attachments and remove button', async () => {
		render(
			<Render>
				<AttachmentSeeder attachments={[attachment]} />
			</Render>
		);

		await screen.findByTestId('message-composer-attachments');
		expect(screen.getByTestId('message-composer-attachment-0')).toBeOnTheScreen();
		expect(screen.getByTestId('message-composer-send')).toBeOnTheScreen();
		expect(screen.queryByTestId('message-composer-send-audio')).not.toBeOnTheScreen();

		await user.press(screen.getByTestId('message-composer-remove-attachment-0'));

		await waitFor(() => expect(screen.queryByTestId('message-composer-attachments')).not.toBeOnTheScreen());
		expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	});

	test('sends composer attachments from the room instead of delegating to onSendMessage', async () => {
		const onSendMessage = jest.fn();
		render(
			<Render context={{ onSendMessage }}>
				<AttachmentSeeder attachments={[attachment]} />
			</Render>
		);

		await screen.findByTestId('message-composer-attachment-0');
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'caption');
		await user.press(screen.getByTestId('message-composer-send'));

		await waitFor(() =>
			expect(sendFileMessage).toHaveBeenCalledWith(
				'rid',
				expect.objectContaining({
					name: 'IMG_2444.png',
					path: 'file:///tmp/IMG_2444.png',
					msg: 'caption',
					type: 'image/png'
				}),
				undefined,
				'https://open.rocket.chat',
				expect.objectContaining({ id: 'abc' })
			)
		);
		expect(onSendMessage).not.toHaveBeenCalled();
		expect(screen.queryByTestId('message-composer-attachments')).not.toBeOnTheScreen();
	});

	test.each(['resolve', 'reject'] as const)('keeps text typed while the upload runs when it %ss', async outcome => {
		const upload = holdUpload();
		const { composerRef } = await sendWithCaptionAndQuote([attachment]);
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'typed while uploading');
		await act(async () => upload[outcome]());

		expect(composerRef.current?.getText()).toBe('typed while uploading');
	});

	test.each(['resolve', 'reject'] as const)('keeps an edit started while the upload runs when it %ss', async outcome => {
		const upload = holdUpload();
		const { composerRef, messageActionStore } = await sendWithCaptionAndQuote([attachment]);
		await act(() => messageActionStore.getState().actions.requestEditing('started-during-upload'));
		await waitFor(() => expect(composerRef.current?.getText()).toBe('Message started-during-upload'));
		await act(async () => upload[outcome]());

		expect(composerRef.current?.getText()).toBe('Message started-during-upload');
		expect(messageActionStore.getState().action).toEqual({ kind: 'edit', messageId: 'started-during-upload' });
	});

	test('keeps a quote picked while the upload runs when it fails', async () => {
		const upload = holdUpload();
		const { composerRef, messageActionStore } = await sendWithCaptionAndQuote([attachment]);
		await act(() => messageActionStore.getState().actions.requestQuote('def'));
		await act(async () => upload.reject());

		expect(messageActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['def'] });
		expect(composerRef.current?.getText()).toBe('');
	});

	test('restores the caption but not the quote when an upload fails while reacting', async () => {
		const upload = holdUpload();
		const { composerRef, messageActionStore } = await sendWithCaptionAndQuote([attachment]);
		await act(() => messageActionStore.getState().actions.startReacting('def'));
		await act(async () => upload.reject());

		await waitFor(() => expect(composerRef.current?.getText()).toBe('caption'));
		expect(screen.getByTestId('message-composer-attachments')).toBeOnTheScreen();
		expect(messageActionStore.getState().action).toEqual({ kind: 'react', messageId: 'def' });
	});

	test('keeps only the attachments that failed so the ones already sent are not sent again', async () => {
		(sendFileMessage as jest.Mock).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('upload failed'));
		await sendWithCaptionAndQuote([sent, failed]);

		await waitFor(() => expect(screen.queryByTestId('message-composer-attachment-1')).not.toBeOnTheScreen());
		expect(screen.getByLabelText('failed.png')).toBeOnTheScreen();
		expect(screen.queryByLabelText('sent.png')).not.toBeOnTheScreen();
	});

	test('does not restore the caption or the quote when the first attachment, which carried them, was sent', async () => {
		(sendFileMessage as jest.Mock).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('upload failed'));
		const { composerRef } = await sendWithCaptionAndQuote([sent, failed]);

		await waitFor(() => expect(screen.queryByTestId('message-composer-attachment-1')).not.toBeOnTheScreen());
		expect(composerRef.current?.getText()).toBe('');
		expect(screen.queryByTestId('composer-quote-abc')).not.toBeOnTheScreen();
	});

	test('puts a skipped first attachment back with the caption and the quote even when the other upload was sent', async () => {
		const skipped = { ...attachment, path: 'file:///tmp/skipped.png', canUpload: false } as IShareAttachment;
		(sendFileMessage as jest.Mock).mockResolvedValueOnce(undefined);
		const { composerRef } = await sendWithCaptionAndQuote([skipped, sent]);

		await waitFor(() => expect(composerRef.current?.getText()).toBe('caption'));
		expect(screen.getByTestId('composer-quote-abc')).toBeOnTheScreen();
		expect(screen.getByLabelText('IMG_2444.png')).toBeOnTheScreen();
		expect(screen.queryByLabelText('sent.png')).not.toBeOnTheScreen();
	});

	test('leaves the caption, the tray and the thread toggle alone when no attachment can be uploaded', async () => {
		const skipped = { ...attachment, canUpload: false } as IShareAttachment;
		const composerRef = { current: null } as RefObject<IMessageComposerRef | null>;
		render(
			<Render forwardedRef={composerRef}>
				<>
					<AttachmentSeeder attachments={[skipped]} />
					<AlsoSendToChannelTicked />
				</>
			</Render>
		);
		await screen.findByTestId('message-composer-attachment-0');
		await waitFor(() => expect(screen.getByTestId('also-send-to-channel')).toHaveTextContent('true'));
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'caption');
		jest.mocked(TextInput.prototype.clear).mockClear();

		await user.press(screen.getByTestId('message-composer-send'));

		expect(TextInput.prototype.clear).not.toHaveBeenCalled();
		expect(composerRef.current?.getText()).toBe('caption');
		expect(screen.getByTestId('message-composer-attachment-0')).toBeOnTheScreen();
		expect(sendFileMessage).not.toHaveBeenCalled();
		expect(screen.getByTestId('also-send-to-channel')).toHaveTextContent('true');
	});

	test('still sends an edit when the tray holds only attachments that cannot be uploaded', async () => {
		const editRequest = jest.fn();
		const skipped = { ...attachment, canUpload: false } as IShareAttachment;
		render(
			<Render context={{ editRequest }} store={createMessageActionStore({ kind: 'edit', messageId: 'edited' })}>
				<AttachmentSeeder attachments={[skipped]} />
			</Render>
		);
		await screen.findByTestId('message-composer-attachment-0');

		await user.press(screen.getByTestId('message-composer-send'));

		expect(editRequest).toHaveBeenCalledWith(expect.objectContaining({ id: 'edited', rid: 'rid' }));
	});

	test('clears the tray as soon as Send is pressed so an upload in flight cannot be sent again', async () => {
		holdUpload();
		await sendWithCaptionAndQuote([attachment]);

		await waitFor(() => expect(sendFileMessage).toHaveBeenCalledTimes(1));
		expect(screen.queryByTestId('message-composer-attachments')).not.toBeOnTheScreen();
	});

	test('does not throw when the composer is gone before a failed upload settles', async () => {
		let failUpload!: (error: Error) => void;
		(sendFileMessage as jest.Mock).mockImplementationOnce(() => new Promise<void>((_, reject) => (failUpload = reject)));
		const error = new Error('upload failed');
		const unhandled = jest.fn();
		process.on('unhandledRejection', unhandled);
		const { unmount } = render(
			<Render>
				<AttachmentSeeder attachments={[attachment]} />
			</Render>
		);
		await screen.findByTestId('message-composer-attachment-0');
		await user.press(screen.getByTestId('message-composer-send'));

		unmount();
		failUpload(error);
		await waitFor(() => expect(log).toHaveBeenCalledWith(error));
		await act(async () => {
			await Promise.resolve();
		});
		process.off('unhandledRejection', unhandled);

		expect(unhandled).not.toHaveBeenCalled();
	});
});

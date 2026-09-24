import { useEffect } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { Alert } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync, PermissionStatus } from 'expo-audio';

import { MicOrSendButton } from '../MicOrSendButton';
import { ComposerProvider } from '../../../ComposerStore';
import { MessageComposerProvider, MessageInnerContext, useMessageComposerApi, useRecordingAudio } from '../../../context';
import { mockedStore } from '~/reducers/mockedStore';
import { selectServerRequest } from '~/actions/server';
import { setUser } from '~/actions/login';
import { setPermissions } from '~/actions/permissions';
import { addSettings } from '~/actions/settings';
import { initStore } from '~/lib/store/auxStore';
import { useCanUploadFile } from '~/containers/MessageComposer/hooks/useCanUploadFile';
import { openAppSettings } from '~/lib/methods/helpers/openAppSettings';
import { type IShareAttachment } from '~/definitions';
import { type TMicOrSend } from '../../../interfaces';

jest.mock('~/theme', () => ({ useTheme: () => ({ theme: 'light', colors: { strokeHighlight: '#054' } }) }));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (k: string) => k } }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/openAppSettings', () => ({ openAppSettings: jest.fn() }));
jest.mock('~/containers/MessageComposer/hooks/useCanUploadFile', () => ({ useCanUploadFile: jest.fn(() => true) }));

mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '6.4.0'));
mockedStore.dispatch(
	setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'], settings: { preferences: {} } })
);
mockedStore.dispatch(setPermissions({ 'mobile-upload-file': ['user'] }));
initStore(mockedStore);

const sendMessage = jest.fn();

const SeedMicOrSend = ({ value }: { value: TMicOrSend }) => {
	const { setMicOrSend } = useMessageComposerApi();
	useEffect(() => {
		setMicOrSend(value);
	}, [setMicOrSend, value]);
	return null;
};

const SeedAttachments = ({ attachments }: { attachments: IShareAttachment[] }) => {
	const { addAttachments } = useMessageComposerApi();
	useEffect(() => {
		addAttachments(attachments);
	}, [addAttachments, attachments]);
	return null;
};

const RecordingFlag = () => {
	const recordingAudio = useRecordingAudio();
	return <Text testID='recording-flag'>{recordingAudio ? 'on' : 'off'}</Text>;
};

const renderButton = ({
	micOrSend = 'mic' as TMicOrSend,
	sharing = false,
	attachments = [] as IShareAttachment[],
	rid = 'rid'
} = {}) =>
	render(
		<Provider store={mockedStore}>
			<ComposerProvider roomTitle='Rocket Chat' rid={rid} t='d' sharing={sharing}>
				<MessageComposerProvider>
					<MessageInnerContext.Provider
						value={{
							sendMessage,
							onEmojiSelected: jest.fn(),
							getText: () => '',
							setInput: jest.fn(),
							closeEmojiKeyboardAndAction: jest.fn(),
							focus: jest.fn()
						}}>
						<>
							<SeedMicOrSend value={micOrSend} />
							{attachments.length ? <SeedAttachments attachments={attachments} /> : null}
							<MicOrSendButton />
							<RecordingFlag />
						</>
					</MessageInnerContext.Provider>
				</MessageComposerProvider>
			</ComposerProvider>
		</Provider>
	);

const attachment = {
	filename: 'a.png',
	size: 1,
	mime: 'image/png',
	path: 'file:///a.png',
	canUpload: true
} as IShareAttachment;

const granted = { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true, expires: 'never' } as const;

beforeEach(() => {
	jest.clearAllMocks();
	sendMessage.mockClear();
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));
	jest.mocked(useCanUploadFile).mockReturnValue(true);
	jest.mocked(getRecordingPermissionsAsync).mockResolvedValue({ ...granted });
	jest.mocked(requestRecordingPermissionsAsync).mockResolvedValue({ ...granted });
	jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
	jest.restoreAllMocks();
});

test('renders SEND when micOrSend is send', async () => {
	renderButton({ micOrSend: 'send' });
	expect(await screen.findByTestId('message-composer-send')).toBeOnTheScreen();
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	fireEvent.press(screen.getByTestId('message-composer-send'));
	expect(sendMessage).toHaveBeenCalledTimes(1);
});

test('renders SEND when sharing', async () => {
	renderButton({ sharing: true });
	expect(await screen.findByTestId('message-composer-send')).toBeOnTheScreen();
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
});

test('renders SEND when there are attachments', async () => {
	renderButton({ attachments: [attachment] });
	expect(await screen.findByTestId('message-composer-send')).toBeOnTheScreen();
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
});

test('renders MIC when audio is enabled and upload is allowed', async () => {
	renderButton();
	expect(await screen.findByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.queryByTestId('message-composer-send')).toBeNull();
});

test('renders nothing when audio is disabled', async () => {
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: false }));
	renderButton();
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toBeOnTheScreen());
	expect(screen.queryByTestId('message-composer-send')).toBeNull();
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
});

test('renders nothing without upload permission and not in send state', async () => {
	jest.mocked(useCanUploadFile).mockReturnValue(false);
	renderButton();
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toBeOnTheScreen());
	expect(screen.queryByTestId('message-composer-send')).toBeNull();
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
});

test('permission granted starts recording', async () => {
	renderButton();
	fireEvent.press(await screen.findByTestId('message-composer-send-audio'));
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toHaveTextContent('on'));
	expect(requestRecordingPermissionsAsync).not.toHaveBeenCalled();
	expect(Alert.alert).not.toHaveBeenCalled();
});

test('permission undetermined requests permission then proceeds on grant', async () => {
	jest.mocked(getRecordingPermissionsAsync).mockResolvedValueOnce({
		status: PermissionStatus.UNDETERMINED,
		granted: false,
		canAskAgain: true,
		expires: 'never'
	});
	renderButton();
	fireEvent.press(await screen.findByTestId('message-composer-send-audio'));
	await waitFor(() => expect(requestRecordingPermissionsAsync).toHaveBeenCalledTimes(1));
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toHaveTextContent('on'));
});

test('permission canAskAgain requests permission without alert', async () => {
	jest.mocked(getRecordingPermissionsAsync).mockResolvedValueOnce({
		status: PermissionStatus.DENIED,
		granted: false,
		canAskAgain: true,
		expires: 'never'
	});
	renderButton();
	fireEvent.press(await screen.findByTestId('message-composer-send-audio'));
	await waitFor(() => expect(requestRecordingPermissionsAsync).toHaveBeenCalledTimes(1));
	expect(Alert.alert).not.toHaveBeenCalled();
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toHaveTextContent('on'));
});

test('denial at the prompt does not start recording', async () => {
	jest.mocked(getRecordingPermissionsAsync).mockResolvedValueOnce({
		status: PermissionStatus.UNDETERMINED,
		granted: false,
		canAskAgain: true,
		expires: 'never'
	});
	jest.mocked(requestRecordingPermissionsAsync).mockResolvedValueOnce({
		status: PermissionStatus.DENIED,
		granted: false,
		canAskAgain: false,
		expires: 'never'
	});
	renderButton();
	fireEvent.press(await screen.findByTestId('message-composer-send-audio'));
	await waitFor(() => expect(requestRecordingPermissionsAsync).toHaveBeenCalledTimes(1));
	await act(async () => {});
	expect(screen.getByTestId('recording-flag')).toHaveTextContent('off');
	expect(Alert.alert).not.toHaveBeenCalled();
});

test('final denial alerts and opens settings without recording', async () => {
	jest.mocked(getRecordingPermissionsAsync).mockResolvedValueOnce({
		status: PermissionStatus.DENIED,
		granted: false,
		canAskAgain: false,
		expires: 'never'
	});
	renderButton();
	fireEvent.press(await screen.findByTestId('message-composer-send-audio'));
	await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
	expect(requestRecordingPermissionsAsync).not.toHaveBeenCalled();
	expect(screen.getByTestId('recording-flag')).toHaveTextContent('off');
	const [, , buttons] = jest.mocked(Alert.alert).mock.calls[0];
	(buttons?.find(b => b.text === 'Settings')?.onPress as () => void)?.();
	expect(openAppSettings).toHaveBeenCalledTimes(1);
});

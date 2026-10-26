import { useEffect } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PermissionStatus, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { getInfoAsync } from 'expo-file-system/legacy';
import { useKeepAwake } from 'expo-keep-awake';

import { RecordAudio } from '../RecordAudio';
import { RECORDING_MODE, RECORDING_SETTINGS } from '~/lib/constants/audio';
import { ComposerProvider } from '../../../ComposerStore';
import { MessageComposerProvider, useMessageComposerApi, useRecordingAudio } from '../../../context';
import { mockedStore } from '~/reducers/mockedStore';
import { selectServerRequest } from '~/actions/server';
import { setUser } from '~/actions/login';
import { initStore } from '~/lib/store/auxStore';
import { sendFileMessage } from '~/lib/methods/sendFileMessage';
import { useCanUploadFile } from '~/containers/MessageComposer/hooks/useCanUploadFile';
import log from '~/lib/methods/helpers/log';

jest.mock('~/theme', () => ({
	useTheme: () => ({
		theme: 'light',
		colors: {
			surfaceLight: '#fff',
			strokeLight: '#eee',
			fontDanger: '#f00',
			fontSecondaryInfo: '#666',
			buttonBackgroundPrimaryDefault: '#054',
			fontDefault: '#000'
		}
	})
}));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (k: string) => k } }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({ getInfoAsync: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
jest.mock('~/lib/methods/sendFileMessage', () => ({ sendFileMessage: jest.fn(() => Promise.resolve()) }));
jest.mock('~/containers/AudioPlayer', () => ({ __esModule: true, default: () => null }));
jest.mock('~/containers/MessageComposer/hooks/useCanUploadFile', () => ({ useCanUploadFile: jest.fn(() => true) }));

mockedStore.dispatch(selectServerRequest('https://open.rocket.chat', '6.4.0'));
mockedStore.dispatch(
	setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'], settings: { preferences: {} } })
);
initStore(mockedStore);

const makeRecorder = (overrides: Record<string, unknown> = {}) => ({
	uri: null,
	prepareToRecordAsync: jest.fn(() => Promise.resolve()),
	record: jest.fn(),
	stop: jest.fn(() => Promise.resolve()),
	...overrides
});

const SeedRecordingTrue = () => {
	const { setRecordingAudio } = useMessageComposerApi();
	useEffect(() => {
		setRecordingAudio(true);
	}, [setRecordingAudio]);
	return null;
};

const RecordingFlag = () => {
	const recordingAudio = useRecordingAudio();
	return <Text testID='recording-flag'>{recordingAudio ? 'on' : 'off'}</Text>;
};

const renderRecordAudio = ({ rid = 'rid', seedRecording = false }: { rid?: string | null; seedRecording?: boolean } = {}) =>
	render(
		<Provider store={mockedStore}>
			<ComposerProvider roomTitle='Rocket Chat' rid={rid ?? undefined} t='d'>
				<MessageComposerProvider>
					<>
						{seedRecording ? <SeedRecordingTrue /> : null}
						<RecordAudio />
						<RecordingFlag />
					</>
				</MessageComposerProvider>
			</ComposerProvider>
		</Provider>
	);

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(useAudioRecorder).mockReturnValue(makeRecorder() as never);
	jest.mocked(useCanUploadFile).mockReturnValue(true);
	jest.mocked(requestRecordingPermissionsAsync).mockResolvedValue({
		status: PermissionStatus.GRANTED,
		granted: true,
		canAskAgain: true,
		expires: 'never'
	});
});

test('renders nothing when there is no rid (and no send UI)', () => {
	renderRecordAudio({ rid: null });
	expect(screen.queryByTestId('message-composer-delete-audio')).toBeNull();
	expect(screen.queryByTestId('message-composer-send')).toBeNull();
	expect(screen.queryByLabelText('Recording_audio_in_progress')).toBeNull();
	expect(screen.queryByLabelText('Review_message')).toBeNull();
});

test('mount starts recording', async () => {
	const recorder = makeRecorder();
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio();
	await waitFor(() => expect(requestRecordingPermissionsAsync).toHaveBeenCalled());
	expect(useAudioRecorder).toHaveBeenCalledWith(RECORDING_SETTINGS);
	expect(setAudioModeAsync).toHaveBeenCalledWith(RECORDING_MODE);
	expect(useKeepAwake).toHaveBeenCalled();
	expect(recorder.prepareToRecordAsync).toHaveBeenCalled();
	expect(recorder.record).toHaveBeenCalled();
});

test('unmount stops the recorder', async () => {
	const recorder = makeRecorder();
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	const { unmount } = renderRecordAudio();
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	unmount();
	expect(recorder.stop).toHaveBeenCalledTimes(1);
});

test('cancelling stops the recorder and exits recording', async () => {
	const recorder = makeRecorder();
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio({ seedRecording: true });
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Cancel_and_delete_recording'));
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toHaveTextContent('off'));
	expect(recorder.stop).toHaveBeenCalled();
});

test('cancelling from the review screen exits recording', async () => {
	const recorder = makeRecorder({ uri: 'file:///rec.aac' });
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio({ seedRecording: true });
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Review_message'));
	fireEvent.press(await screen.findByLabelText('Delete_recording'));
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toHaveTextContent('off'));
	expect(sendFileMessage).not.toHaveBeenCalled();
});

test('exits recording when permission is denied', async () => {
	jest.mocked(requestRecordingPermissionsAsync).mockResolvedValueOnce({
		status: PermissionStatus.DENIED,
		granted: false,
		canAskAgain: false,
		expires: 'never'
	});
	const recorder = makeRecorder();
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio({ seedRecording: true });
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toHaveTextContent('off'));
	expect(recorder.prepareToRecordAsync).not.toHaveBeenCalled();
	expect(recorder.record).not.toHaveBeenCalled();
});

test('exits recording when recorder preparation fails', async () => {
	const error = new Error('Failed to prepare recorder');
	const recorder = makeRecorder({ prepareToRecordAsync: jest.fn(() => Promise.reject(error)) });
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio({ seedRecording: true });
	await waitFor(() => expect(log).toHaveBeenCalledWith(error));
	expect(recorder.record).not.toHaveBeenCalled();
	expect(screen.getByTestId('recording-flag')).toHaveTextContent('off');
});

test('stopping recording renders the review UI', async () => {
	const recorder = makeRecorder({ uri: 'file:///rec.aac' });
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio();
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Review_message'));
	expect(recorder.stop).toHaveBeenCalled();
	expect(await screen.findByTestId('message-composer-send')).toBeOnTheScreen();
});

test('send builds IUpload and calls sendFileMessage', async () => {
	const recorder = makeRecorder({ uri: 'file:///rec.aac' });
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	jest.mocked(getInfoAsync).mockResolvedValue({ exists: true, uri: 'file:///rec.aac', size: 123 } as never);
	renderRecordAudio();
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Review_message'));
	fireEvent.press(await screen.findByTestId('message-composer-send'));
	await waitFor(() => expect(sendFileMessage).toHaveBeenCalledTimes(1));
	expect(sendFileMessage).toHaveBeenCalledWith(
		'rid',
		expect.objectContaining({
			mime: 'audio/aac',
			type: 'audio/aac',
			store: 'Uploads',
			path: 'file:///rec.aac',
			size: 123,
			name: expect.stringMatching(/\.aac$/)
		}),
		undefined,
		'https://open.rocket.chat',
		expect.objectContaining({ id: 'abc' })
	);
});

test('send reports a null size when the recording file is missing', async () => {
	const recorder = makeRecorder({ uri: 'file:///rec.aac' });
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	jest.mocked(getInfoAsync).mockResolvedValue({ exists: false, uri: 'file:///rec.aac' } as never);
	renderRecordAudio();
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Review_message'));
	fireEvent.press(await screen.findByTestId('message-composer-send'));
	await waitFor(() => expect(sendFileMessage).toHaveBeenCalledTimes(1));
	expect(sendFileMessage).toHaveBeenCalledWith(
		'rid',
		expect.objectContaining({ size: null }),
		undefined,
		'https://open.rocket.chat',
		expect.anything()
	);
});

test('send without a recording uri strands the review screen', async () => {
	const recorder = makeRecorder();
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	renderRecordAudio({ seedRecording: true });
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Review_message'));
	fireEvent.press(await screen.findByTestId('message-composer-send'));
	await act(async () => {});
	expect(getInfoAsync).not.toHaveBeenCalled();
	expect(sendFileMessage).not.toHaveBeenCalled();
	expect(log).not.toHaveBeenCalled();
	expect(screen.getByTestId('message-composer-send')).toBeOnTheScreen();
	expect(screen.getByTestId('recording-flag')).toHaveTextContent('on');
});

test('send is gated by upload permission', async () => {
	jest.mocked(useCanUploadFile).mockReturnValue(false);
	const recorder = makeRecorder({ uri: 'file:///rec.aac' });
	jest.mocked(useAudioRecorder).mockReturnValue(recorder as never);
	jest.mocked(getInfoAsync).mockResolvedValue({ exists: true, uri: 'file:///rec.aac', size: 123 } as never);
	renderRecordAudio();
	await waitFor(() => expect(recorder.record).toHaveBeenCalled());
	fireEvent.press(screen.getByLabelText('Review_message'));
	fireEvent.press(await screen.findByTestId('message-composer-send'));
	await waitFor(() => expect(screen.getByTestId('recording-flag')).toBeOnTheScreen());
	expect(sendFileMessage).not.toHaveBeenCalled();
});

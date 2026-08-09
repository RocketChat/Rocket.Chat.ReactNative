jest.mock('expo-av', () => {
	const Audio = {
		playAsync: jest.fn(),
		stopAsync: jest.fn(),
		unloadAsync: jest.fn(),
		setIsLoopingAsync: jest.fn(),
		setPositionAsync: jest.fn(),
		setVolumeAsync: jest.fn(),
		getStatusAsync: jest.fn(() => Promise.resolve({})),
		AndroidOutputFormat: { AAC_ADTS: 0, MPEG_4: 1, THREE_GPP: 2 },
		AndroidAudioEncoder: { AAC: 0, AMR_NB: 1 },
		IOSOutputFormat: { MPEG4AAC: 0 },
		IOSAudioEncoder: { AAC: 0 },
		IOSAudioQuality: { LOW: 0, MEDIUM: 1, HIGH: 2 },
		RecordingOptionsPresets: {
			LOW_QUALITY: {
				android: { sampleRate: 8000, numberOfChannels: 1, bitRate: 128000 },
				ios: { sampleRate: 8000, numberOfChannels: 1, bitRate: 128000 }
			},
			HIGH_QUALITY: {
				android: { sampleRate: 44100, numberOfChannels: 2, bitRate: 256000 },
				ios: { sampleRate: 44100, numberOfChannels: 2, bitRate: 256000 }
			}
		}
	};
	return {
		Audio,
		Sound: class {
			loadAsync = jest.fn();
			playAsync = jest.fn();
			unloadAsync = jest.fn();
		},
		InterruptionModeIOS: { MixWithOthers: 0, DoNotMix: 1 },
		InterruptionModeAndroid: { MixWithOthers: 0, DoNotMix: 1 },
		requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true })),
		getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true, canAskAgain: true }))
	};
});

import { MessageContainer } from './index';
import { messagesStatus } from '../../lib/constants/messagesStatus';

const makeMessage = (status: number) =>
	({
		_id: 'msg1',
		id: 'msg1',
		rid: 'rid1',
		msg: 'hello',
		u: { _id: 'u1', username: 'user', name: 'User' },
		ts: 0,
		status
	} as any);

describe('Message.hasError', () => {
	it('is true for ERROR status messages (retry/delete available)', () => {
		const wrapper = new MessageContainer({ item: makeMessage(messagesStatus.ERROR) } as any);
		expect(wrapper.hasError).toBe(true);
	});

	it('is true for TEMP (stuck sending) status messages so they can be retried/deleted', () => {
		const wrapper = new MessageContainer({ item: makeMessage(messagesStatus.TEMP) } as any);
		expect(wrapper.hasError).toBe(true);
	});

	it('is false for a successfully SENT message', () => {
		const wrapper = new MessageContainer({ item: makeMessage(messagesStatus.SENT) } as any);
		expect(wrapper.hasError).toBe(false);
	});
});

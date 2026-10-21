import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { type TPipSource } from '~/lib/methods/helpers/pickPipSource';
import { iosPictureInPictureSourceRef } from '~/lib/services/conference/conferencePictureInPicture';
import ConferencePipSource from '../ConferencePipSource';
import { type TTrackRef } from '../useConferenceTiles';

const mockVideoTrack = jest.fn();

jest.mock('~/lib/methods/helpers', () => {
	const { Platform: MockPlatform } = jest.requireActual('react-native');
	const proxy: Record<string, unknown> = { ...jest.requireActual('~/lib/methods/helpers') };
	Object.defineProperty(proxy, 'isIOS', {
		get() {
			return MockPlatform.OS === 'ios';
		},
		enumerable: true,
		configurable: true
	});
	return proxy;
});
jest.mock('@livekit/react-native', () => {
	const { createElement } = jest.requireActual('react');
	const { View: MockView } = jest.requireActual('react-native');
	return {
		isTrackReference: (track?: { publication?: unknown }) => !!track?.publication,
		VideoTrack: (props: unknown) => {
			mockVideoTrack(props);
			return createElement(MockView, { testID: 'video-track' });
		}
	};
});
jest.mock('@livekit/react-native-webrtc', () => ({ startIOSPIP: jest.fn() }));

const track = { publication: {} } as unknown as TTrackRef;
const originalOS = Platform.OS;
const setPlatform = (os: 'ios' | 'android') => {
	(Platform as { OS: string }).OS = os;
};

afterAll(() => {
	setPlatform(originalOS as 'ios' | 'android');
});

describe('ConferencePipSource', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setPlatform('ios');
	});

	it('feeds the system window with a presented screen, kept whole', () => {
		const { getByTestId } = render(<ConferencePipSource source={{ kind: 'screen', id: 'ada', name: 'Ada', track }} />);

		expect(getByTestId('conference-pip-source')).toBeTruthy();
		expect(mockVideoTrack).toHaveBeenCalledWith(
			expect.objectContaining({
				trackRef: track,
				objectFit: 'contain',
				iosPIP: {
					enabled: true,
					startAutomatically: true,
					stopAutomatically: true,
					preferredSize: { width: 16, height: 9 }
				}
			})
		);
	});

	it('feeds the system window with a camera, cropped to fill it', () => {
		render(<ConferencePipSource source={{ kind: 'camera', id: 'ada', name: 'Ada', track }} />);

		expect(mockVideoTrack).toHaveBeenCalledWith(expect.objectContaining({ trackRef: track, objectFit: 'cover' }));
	});

	it('is the video that a manual start of the window is pointed at', () => {
		render(<ConferencePipSource source={{ kind: 'camera', id: 'ada', name: 'Ada', track }} />);

		expect(mockVideoTrack.mock.calls[0][0].ref).toBe(iosPictureInPictureSourceRef);
	});

	it.each<[string, TPipSource<TTrackRef> | undefined]>([
		['nobody to show', undefined],
		['someone with no camera', { kind: 'avatar', id: 'ada', name: 'Ada' }],
		['a video that is gone', { kind: 'camera', id: 'ada', name: 'Ada', track: {} as TTrackRef }]
	])('has no video to feed the system window with for %s', (_, source) => {
		const { queryByTestId } = render(<ConferencePipSource source={source} />);

		expect(queryByTestId('conference-pip-source')).toBeNull();
		expect(mockVideoTrack).not.toHaveBeenCalled();
	});

	it('does nothing on Android, where the activity shows its own window', () => {
		setPlatform('android');

		const { queryByTestId } = render(<ConferencePipSource source={{ kind: 'screen', id: 'ada', name: 'Ada', track }} />);

		expect(queryByTestId('conference-pip-source')).toBeNull();
		expect(mockVideoTrack).not.toHaveBeenCalled();
	});
});

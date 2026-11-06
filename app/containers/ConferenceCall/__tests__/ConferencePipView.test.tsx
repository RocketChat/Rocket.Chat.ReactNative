import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { type TPipSource } from '~/lib/methods/helpers/pickPipSource';
import { mockedStore } from '~/reducers/mockedStore';
import ConferencePipView from '../ConferencePipView';
import { type TTrackRef } from '../useConferenceTiles';

const mockVideoTrack = jest.fn();

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

const track = { publication: {} } as unknown as TTrackRef;

const renderPip = (source?: TPipSource<TTrackRef>) =>
	render(
		<Provider store={mockedStore}>
			<ConferencePipView source={source} />
		</Provider>
	);

describe('ConferencePipView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows a presented screen whole, not cropped', () => {
		const { getByTestId } = renderPip({ kind: 'screen', id: 'ada', name: 'Ada', track });

		expect(getByTestId('conference-pip')).toBeTruthy();
		expect(mockVideoTrack).toHaveBeenCalledWith(expect.objectContaining({ trackRef: track, objectFit: 'contain' }));
	});

	it('does not put the name of the presenter over the shared screen', () => {
		const { queryByText } = renderPip({ kind: 'screen', id: 'ada', name: 'Ada', track });

		expect(queryByText('Ada')).toBeNull();
	});

	it('shows a camera filling the window, with the name of who it is', () => {
		const { getByText, getByTestId } = renderPip({ kind: 'camera', id: 'ada', name: 'Ada', track });

		expect(getByTestId('video-track')).toBeTruthy();
		expect(getByText('Ada')).toBeTruthy();
		expect(mockVideoTrack).toHaveBeenCalledWith(expect.objectContaining({ trackRef: track, objectFit: 'cover' }));
	});

	it('shows who it is when there is no camera to show', () => {
		const { getByText, queryByTestId } = renderPip({ kind: 'avatar', id: 'ada', name: 'Ada' });

		expect(getByText('Ada')).toBeTruthy();
		expect(queryByTestId('video-track')).toBeNull();
	});

	it('falls back to a plain window when the video the source points at is gone', () => {
		const { getByText, queryByTestId } = renderPip({ kind: 'camera', id: 'ada', name: 'Ada', track: {} as TTrackRef });

		expect(getByText('Ada')).toBeTruthy();
		expect(queryByTestId('video-track')).toBeNull();
	});

	it('is an empty window when there is nobody to show yet', () => {
		const { getByTestId, queryByTestId } = renderPip(undefined);

		expect(getByTestId('conference-pip')).toBeTruthy();
		expect(queryByTestId('video-track')).toBeNull();
	});
});

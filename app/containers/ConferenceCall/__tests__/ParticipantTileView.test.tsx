import { fireEvent, render } from '@testing-library/react-native';
import { type ReactElement } from 'react';
import { Text } from 'react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '~/reducers/mockedStore';
import ParticipantTileView from '../ParticipantTileView';

interface ITileState {
	muted?: boolean;
	speaking?: boolean;
	handPosition?: number;
	badge?: string;
	video?: ReactElement;
	testID?: string;
}

const tile = ({ muted = false, speaking, handPosition, badge, video, testID }: ITileState) => (
	<Provider store={mockedStore}>
		<ParticipantTileView
			identity='ada'
			name='Ada Lovelace'
			muted={muted}
			speaking={speaking}
			handPosition={handPosition}
			badge={badge}
			video={video}
			testID={testID}
		/>
	</Provider>
);

const renderTile = (state: ITileState = {}) => render(tile(state));

describe('ParticipantTileView', () => {
	it('shows who it is', () => {
		const { getByText } = renderTile();

		expect(getByText('Ada Lovelace')).toBeTruthy();
	});

	it('is read out with the name, and says so when the microphone is off', () => {
		const { getByLabelText, rerender } = renderTile();
		expect(getByLabelText('Ada Lovelace')).toBeTruthy();

		rerender(
			<Provider store={mockedStore}>
				<ParticipantTileView identity='ada' name='Ada Lovelace' muted />
			</Provider>
		);

		expect(getByLabelText('Ada Lovelace, Microphone muted')).toBeTruthy();
	});

	it('marks a muted microphone, and nothing for an open one', () => {
		const { queryByTestId, rerender } = renderTile({ muted: false });
		expect(queryByTestId('participant-tile-muted')).toBeNull();

		rerender(
			<Provider store={mockedStore}>
				<ParticipantTileView identity='ada' name='Ada Lovelace' muted />
			</Provider>
		);

		expect(queryByTestId('participant-tile-muted')).not.toBeNull();
	});

	it('lights a ring around the tile only while the person is speaking', () => {
		const { queryByTestId, rerender } = renderTile({ speaking: false });
		expect(queryByTestId('participant-tile-speaking')).toBeNull();

		rerender(
			<Provider store={mockedStore}>
				<ParticipantTileView identity='ada' name='Ada Lovelace' muted={false} speaking />
			</Provider>
		);

		expect(queryByTestId('participant-tile-speaking')).not.toBeNull();
	});

	it('shows the video instead of the placeholder when there is some', () => {
		const { getByText, queryByLabelText } = renderTile({ video: <Text>video</Text> });

		expect(getByText('video')).toBeTruthy();
		expect(queryByLabelText(/Avatar/)).toBeNull();
	});

	it('shows a raised hand with its place in the queue', () => {
		const { getByText, getByTestId } = renderTile({ handPosition: 2 });

		expect(getByTestId('participant-tile-hand')).toBeTruthy();
		expect(getByText('✋ (2) Ada Lovelace')).toBeTruthy();
	});

	describe('on a small thumbnail', () => {
		const shrinkTo = (tile: Parameters<typeof fireEvent>[0], width: number) =>
			fireEvent(tile, 'layout', { nativeEvent: { layout: { width, height: 100 } } });

		it('shows the raised hand as a small badge instead of a pill over the avatar', () => {
			const { getByText, getByLabelText, queryByText } = renderTile({ handPosition: 2, testID: 'tile' });

			shrinkTo(getByLabelText('Ada Lovelace'), 140);

			expect(getByText('✋ 2')).toBeTruthy();
			expect(getByText('Ada Lovelace')).toBeTruthy();
			expect(queryByText('✋ (2) Ada Lovelace')).toBeNull();
		});

		it('keeps the full pill on a large tile', () => {
			const { getByText, getByLabelText } = renderTile({ handPosition: 2 });

			shrinkTo(getByLabelText('Ada Lovelace'), 360);

			expect(getByText('✋ (2) Ada Lovelace')).toBeTruthy();
		});

		it('leaves out the send resolution badge to keep the thumbnail clear', () => {
			const { queryByText, getByLabelText } = renderTile({ badge: '720p' });
			expect(queryByText('720p')).not.toBeNull();

			shrinkTo(getByLabelText('Ada Lovelace'), 140);

			expect(queryByText('720p')).toBeNull();
		});
	});

	it('shows no hand pill when the hand is down', () => {
		const { queryByTestId } = renderTile();

		expect(queryByTestId('participant-tile-hand')).toBeNull();
	});

	it('shows the resolution being sent when asked to', () => {
		const { getByText } = renderTile({ badge: '720p' });

		expect(getByText('720p')).toBeTruthy();
	});
});

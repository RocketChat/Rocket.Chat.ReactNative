import { act, fireEvent, render } from '@testing-library/react-native';
import { type ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Provider } from 'react-redux';

import { colors } from '~/lib/constants/colors';
import { mockedStore } from '~/reducers/mockedStore';
import { REVEAL_DELAY_MS } from '../RaisedHandChip';
import ParticipantTileView, { backdropTint } from '../ParticipantTileView';

interface ITileState {
	muted?: boolean;
	speaking?: boolean;
	isSelf?: boolean;
	handPosition?: number;
	badge?: string;
	video?: ReactElement;
	testID?: string;
}

const tile = ({ muted = false, speaking, isSelf, handPosition, badge, video, testID }: ITileState) => (
	<Provider store={mockedStore}>
		<ParticipantTileView
			identity='ada'
			name='Ada Lovelace'
			muted={muted}
			speaking={speaking}
			isSelf={isSelf}
			handPosition={handPosition}
			badge={badge}
			video={video}
			testID={testID}
		/>
	</Provider>
);

const renderTile = (state: ITileState = {}) => render(tile(state));

describe('ParticipantTileView', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

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

	it('shows a raised hand with its place in the queue and the name', async () => {
		const { findByText, getByTestId } = renderTile({ handPosition: 2 });

		expect(getByTestId('participant-tile-hand')).toBeTruthy();
		expect(await findByText('(2) Ada Lovelace')).toBeTruthy();
	});

	it('shows the raised hand of the current user in green', () => {
		const { getByTestId } = renderTile({ handPosition: 1, isSelf: true });

		expect(StyleSheet.flatten(getByTestId('participant-tile-hand').props.style).backgroundColor).toBe(
			colors.light.buttonBackgroundSuccessDefault
		);
	});

	it('shows the raised hand of anybody else in white', () => {
		const { getByTestId } = renderTile({ handPosition: 1, isSelf: false });

		expect(StyleSheet.flatten(getByTestId('participant-tile-hand').props.style).backgroundColor).toBe('#FFFFFF');
	});

	describe('on a small thumbnail', () => {
		it.each([
			[true, colors.light.buttonBackgroundSuccessDefault],
			[false, '#FFFFFF']
		])('keeps the colour of the raised hand when the current user is %s', (isSelf, background) => {
			const { getByTestId, getByLabelText } = renderTile({ handPosition: 2, isSelf });

			fireEvent(getByLabelText('Ada Lovelace'), 'layout', { nativeEvent: { layout: { width: 140, height: 100 } } });

			expect(StyleSheet.flatten(getByTestId('participant-tile-hand').props.style).backgroundColor).toBe(background);
		});

		const shrinkTo = (tile: Parameters<typeof fireEvent>[0], width: number) =>
			fireEvent(tile, 'layout', { nativeEvent: { layout: { width, height: 100 } } });

		it('shows the raised hand as a small badge instead of a pill over the avatar', () => {
			jest.useFakeTimers();
			const { getByText, getByLabelText, queryByText } = renderTile({ handPosition: 2, testID: 'tile' });

			shrinkTo(getByLabelText('Ada Lovelace'), 140);
			act(() => {
				jest.advanceTimersByTime(REVEAL_DELAY_MS);
			});

			expect(getByText('✋ 2')).toBeTruthy();
			expect(getByText('Ada Lovelace')).toBeTruthy();
			expect(queryByText('(2) Ada Lovelace')).toBeNull();
		});

		it('keeps the full pill on a large tile', async () => {
			const { findByText, getByLabelText } = renderTile({ handPosition: 2 });

			shrinkTo(getByLabelText('Ada Lovelace'), 360);

			expect(await findByText('(2) Ada Lovelace')).toBeTruthy();
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

describe('backdropTint', () => {
	it('gives the same name the same tint every time', () => {
		expect(backdropTint('Ada Lovelace')).toBe(backdropTint('Ada Lovelace'));
	});

	it('maps names onto each of the five tints', () => {
		expect(backdropTint('')).toBe('#5f141480');
		expect(backdropTint('e')).toBe('#1a3a5f80');
		expect(backdropTint('a')).toBe('#145f2a80');
		expect(backdropTint('b')).toBe('#5f4a1480');
		expect(backdropTint('c')).toBe('#3a145f80');
	});

	it('picks the tints the web client picks for the same names', () => {
		expect(backdropTint('Ada Lovelace')).toBe('#5f4a1480');
		expect(backdropTint('rohit.bansal')).toBe('#5f4a1480');
		expect(backdropTint('bob')).toBe('#145f2a80');
		expect(backdropTint('user-2')).toBe('#3a145f80');
		expect(backdropTint('Zoë')).toBe('#1a3a5f80');
	});
});

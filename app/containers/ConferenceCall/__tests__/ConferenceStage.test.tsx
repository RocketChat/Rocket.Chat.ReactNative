import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import ConferenceStage, { type IStageTile } from '../ConferenceStage';

const peopleOf = (count: number): IStageTile[] =>
	Array.from({ length: count }, (_, index) => ({ id: index === 0 ? 'me' : `user${index}`, hasCamera: false }));

const renderStage = (count: number, activeSpeakerId: string | null = null) => {
	const utils = render(
		<ConferenceStage
			tiles={peopleOf(count)}
			activeSpeakerId={activeSpeakerId}
			selfId='me'
			renderTile={tile => <Text testID={`tile-${tile.id}`}>{tile.id}</Text>}
			renderOverflow={hidden => <Text testID='overflow'>{`${hidden.length} hidden`}</Text>}
		/>
	);
	return utils;
};

const measure = (getByTestId: (id: string) => unknown, width = 393, height = 728) =>
	fireEvent(getByTestId('conference-stage') as never, 'layout', { nativeEvent: { layout: { width, height } } });

describe('ConferenceStage', () => {
	it('draws nothing until it knows how much room it has', () => {
		const { queryByTestId } = renderStage(3);

		expect(queryByTestId('tile-me')).toBeNull();
	});

	it('shows everyone in the call once it has measured itself', () => {
		const { getByTestId } = renderStage(3);

		measure(getByTestId);

		expect(getByTestId('tile-me')).toBeTruthy();
		expect(getByTestId('tile-user1')).toBeTruthy();
		expect(getByTestId('tile-user2')).toBeTruthy();
	});

	it('shows no overflow cell while everyone fits', () => {
		const { getByTestId, queryByTestId } = renderStage(9);

		measure(getByTestId);

		expect(queryByTestId('overflow')).toBeNull();
	});

	it('folds the people who do not fit into one overflow cell', () => {
		const { getByTestId, queryByTestId } = renderStage(12);

		measure(getByTestId);

		expect(getByTestId('overflow')).toBeTruthy();
		expect(queryByTestId('tile-me')).not.toBeNull();
		const shown = Array.from({ length: 12 }, (_, index) => (index === 0 ? 'me' : `user${index}`)).filter(
			id => queryByTestId(`tile-${id}`) !== null
		);
		expect(shown).toHaveLength(7);
	});

	it('gives the person speaking a cell even when the grid is full', () => {
		const { getByTestId, queryByTestId } = renderStage(12, 'user11');

		measure(getByTestId);

		expect(queryByTestId('tile-user11')).not.toBeNull();
	});
});

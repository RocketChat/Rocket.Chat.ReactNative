import { ActivityIndicator } from 'react-native';
import { Provider } from 'react-redux';
import { render, screen, userEvent } from '@testing-library/react-native';

import { createMockedStore } from '../../../reducers/mockedStore';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { type MessageType } from '../../../definitions';
import LoadMore from '.';

jest.unmock('../../../lib/hooks/useResponsiveLayout/useResponsiveLayout');

const renderLoadMore = ({
	type = MessageTypeLoad.MORE,
	runOnRender = false
}: { type?: MessageType; runOnRender?: boolean } = {}) => {
	const store = createMockedStore();
	render(
		<Provider store={store}>
			<LoadMore rid='rid' t='c' loaderId='loaderId' type={type} runOnRender={runOnRender} />
		</Provider>
	);
	return store;
};

describe('LoadMore', () => {
	test.each([
		[MessageTypeLoad.MORE, 'Load more'],
		[MessageTypeLoad.PREVIOUS_CHUNK, 'Load older'],
		[MessageTypeLoad.NEXT_CHUNK, 'Load newer']
	])('renders the %s label', (type, label) => {
		renderLoadMore({ type });

		expect(screen.getByText(label)).toBeOnTheScreen();
	});

	test('shows the loading indicator instead of the label after being pressed', async () => {
		renderLoadMore();

		await userEvent.press(screen.getByText('Load more'));

		expect(screen.queryByText('Load more')).not.toBeOnTheScreen();
		expect(screen.UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
	});

	test('requests history on mount when runOnRender is set', () => {
		const store = renderLoadMore({ runOnRender: true });

		expect(store.getState().room.historyLoaders).toEqual(['loaderId']);
		expect(screen.UNSAFE_queryByType(ActivityIndicator)).not.toBeNull();
	});
});

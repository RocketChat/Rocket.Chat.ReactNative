import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import NewMessageView from '..';
import { mockedStore } from '~/reducers/mockedStore';
import { initStore } from '~/lib/store/auxStore';
import { search } from '~/lib/methods/search';
import { createDirectMessage } from '~/lib/methods/createDirectMessage';
import { setRoomsCategory } from '~/lib/services/restApi';
import { goRoom } from '~/lib/methods/helpers/goRoom';

const mockPop = jest.fn();

initStore(mockedStore);

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ setOptions: jest.fn(), pop: mockPop, dispatch: jest.fn() })
}));

jest.mock('~/lib/database', () => ({
	active: {
		get: () => ({ query: () => ({ fetch: () => Promise.resolve([]) }) })
	}
}));

jest.mock('~/lib/methods/search', () => ({
	search: jest.fn()
}));

jest.mock('~/lib/methods/createDirectMessage', () => ({
	createDirectMessage: jest.fn()
}));

jest.mock('~/lib/services/restApi', () => ({
	setRoomsCategory: jest.fn()
}));

jest.mock('~/lib/methods/helpers/goRoom', () => ({
	goRoom: jest.fn()
}));

jest.mock('~/views/RoomsListView/hooks/useSidebarCategories', () => ({
	useSidebarCategories: () => ({ customCategoryNames: new Map([['category-id', 'Work']]) })
}));

jest.mock('../HeaderNewMessage', () => ({
	__esModule: true,
	default: ({ onChangeText }: { onChangeText: (text: string) => void }) => {
		const { TextInput } = jest.requireActual('react-native');
		return <TextInput testID='new-message-view-search' onChangeText={onChangeText} />;
	}
}));

jest.mock('../Item', () => ({
	__esModule: true,
	default: ({ name, onPress, testID }: { name: string; onPress: () => void; testID: string }) => {
		const { Pressable, Text } = jest.requireActual('react-native');
		return (
			<Pressable testID={testID} onPress={onPress}>
				<Text>{name}</Text>
			</Pressable>
		);
	}
}));

const remoteUser = {
	_id: 'user-id',
	rid: 'john',
	name: 'john',
	fname: 'John',
	username: 'john',
	t: 'd',
	search: true
};

const renderNewMessageView = (categoryId?: string) =>
	render(
		<Provider store={mockedStore}>
			<NewMessageView route={{ params: categoryId ? { categoryId } : undefined } as any} />
		</Provider>
	);

const searchForJohn = async () => {
	fireEvent.changeText(screen.getByTestId('new-message-view-search'), 'john');
	await screen.findByTestId('new-message-view-item-john');
};

describe('NewMessageView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(search).mockResolvedValue([remoteUser] as any);
		jest.mocked(createDirectMessage).mockResolvedValue({ success: true, room: { _id: 'dm-rid' } } as any);
		jest.mocked(setRoomsCategory).mockResolvedValue(undefined);
	});

	it('searches the backend for users when opened from a category', async () => {
		renderNewMessageView('category-id');

		await searchForJohn();

		expect(search).toHaveBeenCalledWith(expect.objectContaining({ text: 'john', filterRooms: false }));
	});

	it('files the direct message into the category when a user is picked', async () => {
		renderNewMessageView('category-id');
		await searchForJohn();

		fireEvent.press(screen.getByTestId('new-message-view-item-john'));

		await waitFor(() => expect(goRoom).toHaveBeenCalled());
		expect(createDirectMessage).toHaveBeenCalledWith('john');
		expect(setRoomsCategory).toHaveBeenCalledWith(['dm-rid'], 'category-id');
		expect(goRoom).toHaveBeenCalledWith(expect.objectContaining({ item: expect.objectContaining({ rid: 'dm-rid', t: 'd' }) }));
	});

	it('files an existing direct message found by search without creating it again', async () => {
		jest.mocked(search).mockResolvedValue([{ rid: 'existing-rid', name: 'john', fname: 'John', t: 'd' }] as any);
		renderNewMessageView('category-id');
		await searchForJohn();

		fireEvent.press(screen.getByTestId('new-message-view-item-john'));

		await waitFor(() => expect(goRoom).toHaveBeenCalled());
		expect(createDirectMessage).not.toHaveBeenCalled();
		expect(setRoomsCategory).toHaveBeenCalledWith(['existing-rid'], 'category-id');
		expect(goRoom).toHaveBeenCalledWith(expect.objectContaining({ item: expect.objectContaining({ rid: 'existing-rid' }) }));
	});

	it('neither files nor opens a room when the direct message cannot be created', async () => {
		jest.mocked(createDirectMessage).mockRejectedValue({ data: { errorType: 'error-not-allowed' } });
		renderNewMessageView('category-id');
		await searchForJohn();

		fireEvent.press(screen.getByTestId('new-message-view-item-john'));

		await waitFor(() => expect(createDirectMessage).toHaveBeenCalledWith('john'));
		expect(setRoomsCategory).not.toHaveBeenCalled();
		expect(goRoom).not.toHaveBeenCalled();
	});

	it('goes back to the opening list when the search is cleared', async () => {
		renderNewMessageView('category-id');
		await searchForJohn();

		fireEvent.changeText(screen.getByTestId('new-message-view-search'), '');

		await waitFor(() => expect(screen.queryByTestId('new-message-view-item-john')).toBeNull());
		expect(search).toHaveBeenCalledTimes(1);
	});

	it('opens the picked user without filing it outside a category', async () => {
		renderNewMessageView();
		await searchForJohn();

		fireEvent.press(screen.getByTestId('new-message-view-item-john'));

		await waitFor(() => expect(goRoom).toHaveBeenCalledWith(expect.objectContaining({ item: remoteUser })));
		expect(setRoomsCategory).not.toHaveBeenCalled();
	});
});

import Navigation from './appNavigation';

const mockDispatch = jest.fn();

describe('popToRoom', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Navigation.navigationRef.current = { dispatch: mockDispatch } as any;
	});

	it('merges params when popping back to a retained RoomView', () => {
		Navigation.popToRoom(false);

		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'POP_TO',
			payload: { name: 'RoomView', params: undefined, merge: true }
		});
	});

	it('pops to MainNavigator on master detail', () => {
		Navigation.popToRoom(true);

		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'POP_TO',
			payload: { name: 'MainNavigator', params: undefined, merge: undefined }
		});
	});
});

describe('navigateToRoomsList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Navigation.navigationRef.current = { dispatch: mockDispatch } as any;
	});

	it('closes modals, then pops back to the home tabs with the rooms list tab focused', () => {
		Navigation.navigateToRoomsList();

		expect(mockDispatch).toHaveBeenNthCalledWith(1, {
			type: 'POP_TO',
			payload: { name: 'MainNavigator', params: undefined, merge: undefined }
		});
		expect(mockDispatch).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				type: 'NAVIGATE',
				payload: expect.objectContaining({ name: 'HomeTabs', params: { screen: 'RoomsListStackNavigator' }, pop: true })
			})
		);
	});
});

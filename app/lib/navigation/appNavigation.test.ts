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

	it('pops to DrawerNavigator on master detail', () => {
		Navigation.popToRoom(true);

		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'POP_TO',
			payload: { name: 'DrawerNavigator', params: undefined, merge: undefined }
		});
	});
});

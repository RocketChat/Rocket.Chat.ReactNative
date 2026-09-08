import { navigateToScreen, type TRoomStackNavigation } from '../navigateToScreen';

describe('navigateToScreen', () => {
	const navigate = jest.fn();
	const navigation = { navigate } as unknown as TRoomStackNavigation;

	beforeEach(() => jest.clearAllMocks());

	it('navigates straight to the screen on stack mode', () => {
		navigateToScreen({
			navigation,
			isMasterDetail: false,
			screen: 'ThreadMessagesView',
			params: { rid: 'rid-1', t: 'c' } as any
		});

		expect(navigate).toHaveBeenCalledWith('ThreadMessagesView', { rid: 'rid-1', t: 'c' });
	});

	it('navigates through the modal stack on master-detail mode', () => {
		navigateToScreen({ navigation, isMasterDetail: true, screen: 'ThreadMessagesView', params: { rid: 'rid-1', t: 'c' } as any });

		expect(navigate).toHaveBeenCalledWith('ModalStackNavigator', {
			screen: 'ThreadMessagesView',
			params: { rid: 'rid-1', t: 'c' }
		});
	});

	it('navigates without params', () => {
		navigateToScreen({ navigation, isMasterDetail: false, screen: 'PushTroubleshootView' });

		expect(navigate).toHaveBeenCalledWith('PushTroubleshootView', undefined);
	});
});

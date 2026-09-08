import { SubscriptionType } from '../../../../definitions';
import { navigateToScreen, type TRoomStackNavigation, type TRoomStackParamList } from '../navigateToScreen';

describe('navigateToScreen', () => {
	const navigate = jest.fn();
	const navigation = { navigate } as unknown as TRoomStackNavigation;
	const threadMessagesParams: TRoomStackParamList['ThreadMessagesView'] = { rid: 'rid-1', t: SubscriptionType.CHANNEL };

	beforeEach(() => jest.clearAllMocks());

	it('navigates straight to the screen on stack mode', () => {
		navigateToScreen({
			navigation,
			isMasterDetail: false,
			screen: 'ThreadMessagesView',
			params: threadMessagesParams
		});

		expect(navigate).toHaveBeenCalledWith('ThreadMessagesView', { rid: 'rid-1', t: 'c' });
	});

	it('navigates through the modal stack on master-detail mode', () => {
		navigateToScreen({ navigation, isMasterDetail: true, screen: 'ThreadMessagesView', params: threadMessagesParams });

		expect(navigate).toHaveBeenCalledWith('ModalStackNavigator', {
			screen: 'ThreadMessagesView',
			params: { rid: 'rid-1', t: 'c' }
		});
	});

	it('navigates without params', () => {
		navigateToScreen({ navigation, isMasterDetail: false, screen: 'PushTroubleshootView' });

		expect(navigate).toHaveBeenCalledWith('PushTroubleshootView', undefined);
	});

	it('rejects routes with required params when params are missing', () => {
		// @ts-expect-error ThreadMessagesView requires rid and t
		navigateToScreen({ navigation, isMasterDetail: false, screen: 'ThreadMessagesView' });

		expect(navigate).toHaveBeenCalledWith('ThreadMessagesView', undefined);
	});
});

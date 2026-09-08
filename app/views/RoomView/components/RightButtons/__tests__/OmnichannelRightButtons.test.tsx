import { fireEvent, render, screen } from '@testing-library/react-native';

import { type TActionSheetOptionsItem } from '../../../../../containers/ActionSheet';
import { showConfirmationAlert } from '../../../../../lib/methods/helpers';
import { returnLivechat } from '../../../../../lib/services/restApi';
import { type RoomStore } from '../../../definitions';
import { closeLivechat } from '../../../services/closeLivechat';
import { placeLivechatOnHold } from '../../../services/placeLivechatOnHold';
import { OmnichannelRightButtons } from '../OmnichannelRightButtons';
import { makeRoomReads } from '../../../__tests__/roomStoreFixture';

const mockNavigation = { navigate: jest.fn(), push: jest.fn() };
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => mockNavigation
}));

const mockShowActionSheet = jest.fn();
jest.mock('../../../../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet })
}));

let mockIsMasterDetail = false;
jest.mock('../../../../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => mockIsMasterDetail
}));

let mockLivechatRequestComment = false;
jest.mock('../../../../../lib/hooks/useSetting', () => ({
	useSetting: () => mockLivechatRequestComment
}));

let mockRoomState = {
	...makeRoomReads({ rid: 'rid-1', t: 'l', id: 'rid-1', departmentId: 'department-1' }),
	canForwardGuest: false
};
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));

let mockCanReturnQueue = false;
jest.mock('../../../../../ee/omnichannel/hooks/useCanReturnQueue', () => ({
	useCanReturnQueue: () => mockCanReturnQueue
}));

let mockCanPlaceLivechatOnHold = false;
jest.mock('../../../hooks/useCanPlaceLivechatOnHold', () => ({
	useCanPlaceLivechatOnHold: () => mockCanPlaceLivechatOnHold
}));

jest.mock('../../../services/closeLivechat', () => ({ closeLivechat: jest.fn() }));
jest.mock('../../../services/placeLivechatOnHold', () => ({ placeLivechatOnHold: jest.fn() }));
jest.mock('../../../../../lib/services/restApi', () => ({ returnLivechat: jest.fn() }));
jest.mock('../../../../../lib/methods/helpers', () => ({
	...jest.requireActual('../../../../../lib/methods/helpers'),
	showConfirmationAlert: jest.fn(),
	showErrorAlert: jest.fn()
}));

jest.mock('../../../../../containers/Header/components/HeaderButton', () => {
	const ReactActual = jest.requireActual('react');
	return {
		Container: ({ children }: { children: unknown }) => ReactActual.createElement('Container', null, children),
		Item: ({ iconName, onPress, testID }: { iconName: string; onPress: () => void; testID: string }) =>
			ReactActual.createElement('Item', { iconName, onPress, testID })
	};
});

const roomStore = {} as RoomStore;

const openKebab = (): TActionSheetOptionsItem[] => {
	render(<OmnichannelRightButtons rid='rid-1' roomStore={roomStore} />);
	fireEvent.press(screen.getByTestId('room-view-header-omnichannel-kebab'));
	return mockShowActionSheet.mock.calls[0][0].options as TActionSheetOptionsItem[];
};

const titlesOf = (options: TActionSheetOptionsItem[]) => options.map(option => option.title);

describe('OmnichannelRightButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsMasterDetail = false;
		mockLivechatRequestComment = false;
		mockRoomState = {
			...makeRoomReads({ rid: 'rid-1', t: 'l', id: 'rid-1', departmentId: 'department-1' }),
			canForwardGuest: false
		};
		mockCanReturnQueue = false;
		mockCanPlaceLivechatOnHold = false;
	});

	it('renders the kebab button', () => {
		render(<OmnichannelRightButtons rid='rid-1' roomStore={roomStore} />);

		expect(screen.getByTestId('room-view-header-omnichannel-kebab')).toHaveProp('iconName', 'kebab');
	});

	it('offers only the close option when no capability is granted', () => {
		const options = openKebab();

		expect(titlesOf(options)).toEqual(['Close']);
		expect(options[0].icon).toBe('chat-close');
		expect(options[0].danger).toBe(true);
	});

	it('offers the on-hold option when the chat can be placed on hold', () => {
		mockCanPlaceLivechatOnHold = true;

		const options = openKebab();

		expect(titlesOf(options)).toEqual(['Place chat on hold', 'Close']);
		expect(options[0].icon).toBe('pause');
	});

	it('offers the forward option when the agent can forward the guest', () => {
		mockRoomState = { ...mockRoomState, canForwardGuest: true };

		const options = openKebab();

		expect(titlesOf(options)).toEqual(['Forward chat', 'Close']);
		expect(options[0].icon).toBe('chat-forward');
	});

	it('offers the return-to-queue option when the agent can return to the queue', () => {
		mockCanReturnQueue = true;

		const options = openKebab();

		expect(titlesOf(options)).toEqual(['Return to waiting line', 'Close']);
		expect(options[0].icon).toBe('move-to-the-queue');
	});

	it('offers every option in order when all capabilities are granted', () => {
		mockCanPlaceLivechatOnHold = true;
		mockCanReturnQueue = true;
		mockRoomState = { ...mockRoomState, canForwardGuest: true };

		expect(titlesOf(openKebab())).toEqual(['Place chat on hold', 'Forward chat', 'Return to waiting line', 'Close']);
	});

	it('places the chat on hold through the service', () => {
		mockCanPlaceLivechatOnHold = true;

		openKebab()[0].onPress?.();

		expect(placeLivechatOnHold).toHaveBeenCalledWith({ rid: 'rid-1', navigation: mockNavigation });
	});

	it('navigates to the forward screen on stack mode', () => {
		mockRoomState = { ...mockRoomState, canForwardGuest: true };

		openKebab()[0].onPress?.();

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ForwardLivechatView', { rid: 'rid-1' });
	});

	it('navigates to the forward screen through the modal stack on master-detail mode', () => {
		mockRoomState = { ...mockRoomState, canForwardGuest: true };
		mockIsMasterDetail = true;

		openKebab()[0].onPress?.();

		expect(mockNavigation.navigate).toHaveBeenCalledWith('ModalStackNavigator', {
			screen: 'ForwardLivechatView',
			params: { rid: 'rid-1' }
		});
	});

	it('returns the inquiry only after the confirmation is accepted', async () => {
		mockCanReturnQueue = true;

		openKebab()[0].onPress?.();

		expect(returnLivechat).not.toHaveBeenCalled();
		await (showConfirmationAlert as jest.Mock).mock.calls[0][0].onPress();
		expect(returnLivechat).toHaveBeenCalledWith('rid-1', 'department-1');
	});

	it('closes the chat with the room department and the request comment setting', () => {
		mockLivechatRequestComment = true;

		openKebab()[0].onPress?.();

		expect(closeLivechat).toHaveBeenCalledWith({
			rid: 'rid-1',
			departmentId: 'department-1',
			isMasterDetail: false,
			livechatRequestComment: true,
			navigation: mockNavigation
		});
	});
});

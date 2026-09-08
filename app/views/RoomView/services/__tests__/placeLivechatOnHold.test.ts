import { showConfirmationAlert, showErrorAlert } from '../../../../lib/methods/helpers';
import { onHoldLivechat } from '../../../../lib/services/restApi';
import { placeLivechatOnHold } from '../placeLivechatOnHold';
import { type TRoomStackNavigation } from '../navigateToScreen';

jest.mock('../../../../lib/methods/helpers', () => ({
	showConfirmationAlert: jest.fn(),
	showErrorAlert: jest.fn()
}));
jest.mock('../../../../lib/services/restApi', () => ({ onHoldLivechat: jest.fn(() => Promise.resolve()) }));

const mockShowConfirmationAlert = showConfirmationAlert as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;
const mockOnHoldLivechat = onHoldLivechat as jest.Mock;

const confirm = () => mockShowConfirmationAlert.mock.calls[0][0].onPress();

describe('placeLivechatOnHold', () => {
	const navigate = jest.fn();
	const navigation = { navigate } as unknown as TRoomStackNavigation;

	beforeEach(() => jest.clearAllMocks());

	it('asks for confirmation before placing the chat on hold', () => {
		placeLivechatOnHold({ rid: 'rid-1', navigation });

		expect(mockShowConfirmationAlert).toHaveBeenCalledTimes(1);
		expect(mockOnHoldLivechat).not.toHaveBeenCalled();
	});

	it('places the chat on hold and returns to the rooms list once confirmed', async () => {
		placeLivechatOnHold({ rid: 'rid-1', navigation });

		await confirm();

		expect(mockOnHoldLivechat).toHaveBeenCalledWith('rid-1');
		expect(navigate).toHaveBeenCalledWith('RoomsListView');
	});

	it('shows the server error and stays on the room when the request fails', async () => {
		mockOnHoldLivechat.mockRejectedValueOnce({ data: { error: 'error-on-hold' } });
		placeLivechatOnHold({ rid: 'rid-1', navigation });

		await confirm();

		expect(mockShowErrorAlert).toHaveBeenCalledWith('error-on-hold', 'Oops!');
		expect(navigate).not.toHaveBeenCalled();
	});
});

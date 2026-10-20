import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
import { onHoldLivechat } from '~/lib/services/restApi';
import { placeLivechatOnHold } from '../placeLivechatOnHold';
import Navigation from '~/lib/navigation/appNavigation';

jest.mock('~/lib/methods/helpers', () => ({
	showConfirmationAlert: jest.fn(),
	showErrorAlert: jest.fn()
}));
jest.mock('~/lib/services/restApi', () => ({ onHoldLivechat: jest.fn(() => Promise.resolve()) }));
jest.mock('~/lib/navigation/appNavigation', () => ({ navigateToRoomsList: jest.fn() }));

const mockShowConfirmationAlert = showConfirmationAlert as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;
const mockOnHoldLivechat = onHoldLivechat as jest.Mock;

const confirm = () => mockShowConfirmationAlert.mock.calls[0][0].onPress();

describe('placeLivechatOnHold', () => {
	beforeEach(() => jest.clearAllMocks());

	it('asks for confirmation before placing the chat on hold', () => {
		placeLivechatOnHold({ rid: 'rid-1' });

		expect(mockShowConfirmationAlert).toHaveBeenCalledTimes(1);
		expect(mockOnHoldLivechat).not.toHaveBeenCalled();
	});

	it('places the chat on hold and returns to the rooms list once confirmed', async () => {
		placeLivechatOnHold({ rid: 'rid-1' });

		await confirm();

		expect(mockOnHoldLivechat).toHaveBeenCalledWith('rid-1');
		expect(Navigation.navigateToRoomsList).toHaveBeenCalled();
	});

	it('shows the server error and stays on the room when the request fails', async () => {
		mockOnHoldLivechat.mockRejectedValueOnce({ data: { error: 'error-on-hold' } });
		placeLivechatOnHold({ rid: 'rid-1' });

		await confirm();

		expect(mockShowErrorAlert).toHaveBeenCalledWith('error-on-hold', 'Oops!');
		expect(Navigation.navigateToRoomsList).not.toHaveBeenCalled();
	});
});

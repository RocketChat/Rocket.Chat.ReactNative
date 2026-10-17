import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { showErrorAlertWithEMessage } from '~/lib/methods/helpers/info';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { videoConferenceShareChat } from '~/lib/services/restApi';
import { mockedStore } from '~/reducers/mockedStore';
import ChatAccessSheetContent from '../ChatAccessSheetContent';

const mockHideActionSheet = jest.fn();

jest.mock('~/containers/ActionSheet', () => ({ useActionSheet: () => ({ hideActionSheet: mockHideActionSheet }) }));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: jest.fn() }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlertWithEMessage: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ videoConferenceShareChat: jest.fn() }));

const infoMock = useConferenceInfo as jest.Mock;
const shareChatMock = videoConferenceShareChat as jest.Mock;

const member = (id: string) => ({ _id: id, username: id, name: id.toUpperCase(), joined: true });

const showInfo = ({ type = 'c', canInvite = true, missing = ['ada', 'bob'] } = {}) =>
	infoMock.mockReturnValue({
		info: {
			success: true,
			users: [member('me'), member('ada'), member('bob'), member('cy')],
			chatAccess: { rid: 'GENERAL', name: 'general', type, membersWithoutAccess: missing, canInvite }
		},
		loading: false,
		failed: false,
		reload: jest.fn()
	});

const renderSheet = () =>
	render(
		<Provider store={mockedStore}>
			<ChatAccessSheetContent />
		</Provider>
	);

describe('ChatAccessSheetContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useConferenceCallStore.getState().close();
		useConferenceCallStore.getState().open({ callId: 'call1', rid: 'GENERAL' });
		shareChatMock.mockResolvedValue({ success: true, rid: 'GENERAL' });
		showInfo();
	});

	afterEach(() => {
		useConferenceCallStore.getState().close();
	});

	it('names the people who cannot read the chat, and nobody else', () => {
		const { getByTestId, queryByTestId } = renderSheet();

		expect(getByTestId('conference-chat-access-member-ada')).toBeTruthy();
		expect(getByTestId('conference-chat-access-member-bob')).toBeTruthy();
		expect(queryByTestId('conference-chat-access-member-cy')).toBeNull();
	});

	it('names the room the chat lives in, in what each way out gives away', () => {
		const { getByText } = renderSheet();

		expect(getByText('They will be added to general and will be able to read its entire message history.')).toBeTruthy();
		expect(getByText(/only by going back to general\./)).toBeTruthy();
	});

	it('offers both ways out in a public channel they can be invited to', () => {
		const { getByTestId } = renderSheet();

		expect(getByTestId('conference-chat-access-invite')).toBeTruthy();
		expect(getByTestId('conference-chat-access-discussion')).toBeTruthy();
	});

	it('offers only a discussion where the room cannot take new members', () => {
		showInfo({ type: 'd', canInvite: false });
		const { getByTestId, queryByTestId } = renderSheet();

		expect(queryByTestId('conference-chat-access-invite')).toBeNull();
		expect(getByTestId('conference-chat-access-discussion')).toBeTruthy();
	});

	it.each(['invite', 'discussion'])('asks the server to %s, then closes', async mode => {
		const { getByTestId } = renderSheet();

		fireEvent.press(getByTestId(`conference-chat-access-${mode}`));

		await waitFor(() => expect(mockHideActionSheet).toHaveBeenCalledTimes(1));
		expect(shareChatMock).toHaveBeenCalledWith('call1', mode);
	});

	it('says why it failed and stays open so another way can be tried', async () => {
		const error = new Error('error-not-allowed');
		shareChatMock.mockRejectedValueOnce(error);
		const { getByTestId } = renderSheet();

		fireEvent.press(getByTestId('conference-chat-access-discussion'));

		await waitFor(() => expect(showErrorAlertWithEMessage).toHaveBeenCalledWith(error));
		expect(mockHideActionSheet).not.toHaveBeenCalled();
	});

	it('does nothing before the call has an id', () => {
		useConferenceCallStore.getState().close();
		const { getByTestId } = renderSheet();

		fireEvent.press(getByTestId('conference-chat-access-invite'));

		expect(shareChatMock).not.toHaveBeenCalled();
	});
});

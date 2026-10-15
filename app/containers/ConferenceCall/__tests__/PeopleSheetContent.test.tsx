import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { RINGING_WINDOW_MS } from '~/lib/methods/helpers/groupConferenceMembers';
import { navigateToConferenceChat } from '~/lib/services/conference/navigateToConferenceChat';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useConferenceRoomStore } from '~/lib/services/conference/useConferenceRoomStore';
import { mockedStore } from '~/reducers/mockedStore';
import PeopleSheetContent from '../PeopleSheetContent';

const mockHideActionSheet = jest.fn();

jest.mock('@livekit/react-native', () => ({
	RoomContext: { Provider: ({ children }: { children: unknown }) => children },
	useParticipants: () => []
}));
jest.mock('~/containers/ActionSheet', () => ({ useActionSheet: () => ({ hideActionSheet: mockHideActionSheet }) }));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: jest.fn() }));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [true] }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({ conferenceSession: { requestMute: jest.fn() } }));
jest.mock('~/lib/services/conference/navigateToConferenceChat', () => ({
	navigateToConferenceChat: jest.fn(() => Promise.resolve())
}));
jest.mock('~/lib/services/restApi', () => ({ videoConferenceRing: jest.fn(() => Promise.resolve()) }));

const infoMock = useConferenceInfo as jest.Mock;

const NOW = Date.parse('2026-10-15T08:00:00.000Z');

const chatAccess = (membersWithoutAccess: string[] = []) => ({
	rid: 'GENERAL',
	name: 'general',
	type: 'c',
	membersWithoutAccess,
	canInvite: true
});

const member = (id: string, rest: object = {}) => ({ _id: id, username: id, name: id.toUpperCase(), joined: true, ...rest });

const showInfo = (users: object[], access = chatAccess()) =>
	infoMock.mockReturnValue({ info: { success: true, rid: 'GENERAL', users, chatAccess: access }, loading: false, failed: false });

const renderSheet = () =>
	render(
		<Provider store={mockedStore}>
			<PeopleSheetContent onAddPeople={jest.fn()} />
		</Provider>
	);

describe('PeopleSheetContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(setUser({ id: 'me', token: 'tok' }));
		useConferenceCallStore.getState().open({ callId: 'call1', rid: 'GENERAL' });
		useConferenceInteractionStore.getState().reset();
		useConferenceRoomStore.getState().setRoom({} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
		useConferenceCallStore.getState().close();
		useConferenceRoomStore.getState().setRoom(undefined);
	});

	describe('chat access', () => {
		it('says how many people cannot see the chat, and opens the Room from the notice', () => {
			showInfo([member('ada'), member('bob')], chatAccess(['ada']));
			const { getByText, getByTestId } = renderSheet();

			expect(getByText("1 in this call can't see the chat")).toBeTruthy();
			fireEvent.press(getByTestId('conference-chat-access-notice'));

			expect(mockHideActionSheet).toHaveBeenCalledTimes(1);
			expect(navigateToConferenceChat).toHaveBeenCalledWith(
				expect.objectContaining({ chat: { rid: 'GENERAL', name: 'general', t: 'c' } })
			);
		});

		it('marks only the people who cannot see the chat', () => {
			showInfo([member('ada'), member('bob')], chatAccess(['ada']));
			const { queryByTestId } = renderSheet();

			expect(queryByTestId('conference-no-chat-ada')).not.toBeNull();
			expect(queryByTestId('conference-no-chat-bob')).toBeNull();
		});

		it('shows no notice when everyone can see the chat', () => {
			showInfo([member('ada')]);
			const { queryByTestId } = renderSheet();

			expect(queryByTestId('conference-chat-access-notice')).toBeNull();
		});
	});

	describe('raised hands', () => {
		it('numbers them in the order they were raised', () => {
			showInfo([member('ada'), member('bob'), member('cleo')]);
			const interactions = useConferenceInteractionStore.getState();
			interactions.applyHandMessage('bob', { type: 'hand', raised: true, raisedAt: 100 }, 100);
			interactions.applyHandMessage('ada', { type: 'hand', raised: true, raisedAt: 200 }, 200);
			const { getByText, queryByText } = renderSheet();

			expect(getByText('✋ 1')).toBeTruthy();
			expect(getByText('✋ 2')).toBeTruthy();
			expect(queryByText('✋ 3')).toBeNull();
		});
	});

	describe('ringing', () => {
		it('moves a member out of Waiting to join once their ring runs out, without any other update', () => {
			jest.useFakeTimers();
			jest.setSystemTime(NOW);
			showInfo([member('ada', { joined: false, ringingAt: new Date(NOW - 1000).toISOString() })]);
			const { getByText, queryByText } = renderSheet();
			expect(getByText('Waiting to join')).toBeTruthy();

			act(() => {
				jest.advanceTimersByTime(RINGING_WINDOW_MS);
			});

			expect(queryByText('Waiting to join')).toBeNull();
			expect(getByText('Not in the call')).toBeTruthy();
		});

		it('offers to ring someone who is not in the call, but not while their phone is already ringing', () => {
			jest.useFakeTimers();
			jest.setSystemTime(NOW);
			showInfo([
				member('ada', { joined: false, ringingAt: new Date(NOW - 1000).toISOString() }),
				member('bob', { joined: false })
			]);
			const { getByTestId } = renderSheet();

			expect(getByTestId('conference-ring-ada').props.accessibilityState).toMatchObject({ disabled: true });
			expect(getByTestId('conference-ring-bob').props.accessibilityState).toMatchObject({ disabled: false });
		});
	});
});

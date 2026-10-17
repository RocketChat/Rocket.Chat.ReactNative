import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { showErrorAlertWithEMessage } from '~/lib/methods/helpers/info';
import { RINGING_WINDOW_MS } from '~/lib/methods/helpers/groupConferenceMembers';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useConferenceRoomStore } from '~/lib/services/conference/useConferenceRoomStore';
import { videoConferenceRing } from '~/lib/services/restApi';
import { mockedStore } from '~/reducers/mockedStore';
import PeopleSheetContent from '../PeopleSheetContent';

const mockHideActionSheet = jest.fn();
const mockSpeakers: { identity: string; isMicrophoneEnabled: boolean }[] = [];

jest.mock('@livekit/react-native', () => ({
	RoomContext: { Provider: ({ children }: { children: unknown }) => children },
	useParticipants: () => [],
	useSpeakingParticipants: () => mockSpeakers
}));
jest.mock('~/containers/ActionSheet', () => ({ useActionSheet: () => ({ hideActionSheet: mockHideActionSheet }) }));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: jest.fn() }));
jest.mock('~/lib/hooks/usePermissions', () => ({ usePermissions: () => [true] }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlertWithEMessage: jest.fn() }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({ conferenceSession: { requestMute: jest.fn() } }));
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

const onReviewChatAccess = jest.fn();

const renderSheet = () =>
	render(
		<Provider store={mockedStore}>
			<PeopleSheetContent onAddPeople={jest.fn()} onReviewChatAccess={onReviewChatAccess} />
		</Provider>
	);

describe('PeopleSheetContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(setUser({ id: 'me', token: 'tok' }));
		useConferenceCallStore.getState().open({ callId: 'call1', rid: 'GENERAL' });
		useConferenceInteractionStore.getState().reset();
		useConferenceRoomStore.getState().setRoom({} as never);
		mockSpeakers.length = 0;
	});

	afterEach(() => {
		jest.useRealTimers();
		useConferenceCallStore.getState().close();
		useConferenceRoomStore.getState().setRoom(undefined);
	});

	describe('chat access', () => {
		it('says how many people cannot see the chat, and opens the review from the notice', () => {
			showInfo([member('ada'), member('bob')], chatAccess(['ada']));
			const { getByText, getByTestId } = renderSheet();

			expect(getByText("1 in this call can't see the chat")).toBeTruthy();
			fireEvent.press(getByTestId('conference-chat-access-notice'));

			expect(onReviewChatAccess).toHaveBeenCalledTimes(1);
		});

		it('does not count someone who was invited but has not joined', () => {
			showInfo([member('ada', { joined: false }), member('bob')], chatAccess(['ada']));
			const { queryByTestId } = renderSheet();

			expect(queryByTestId('conference-chat-access-notice')).toBeNull();
		});

		it('shows no notice to someone who cannot read the chat either, since they cannot share it', () => {
			showInfo([member('me'), member('ada')], chatAccess(['me', 'ada']));
			const { queryByTestId } = renderSheet();

			expect(queryByTestId('conference-chat-access-notice')).toBeNull();
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

	describe('status', () => {
		it.each([
			[
				'declined someone who turned the call down',
				{ declined: true, declinedAt: new Date(NOW - 5000).toISOString() },
				'Declined'
			],
			['left someone who hung up', { leftAt: new Date(NOW - 5000).toISOString() }, 'Left'],
			['invited someone who was added and never answered', {}, 'Waiting for answer']
		])('says %s', (_, state, label) => {
			jest.useFakeTimers();
			jest.setSystemTime(NOW);
			showInfo([member('ada', { joined: false, ...state })]);
			const { getByText } = renderSheet();

			expect(getByText(label)).toBeTruthy();
		});

		it('says Ringing while the phone is ringing', () => {
			jest.useFakeTimers();
			jest.setSystemTime(NOW);
			showInfo([member('ada', { joined: false, ringingAt: new Date(NOW - 1000).toISOString() })]);
			const { getByText } = renderSheet();

			expect(getByText('Ringing')).toBeTruthy();
		});

		it('says nothing about someone who is in the call', () => {
			showInfo([member('ada')]);
			const { queryByText } = renderSheet();

			expect(queryByText('Ringing')).toBeNull();
			expect(queryByText('Left')).toBeNull();
			expect(queryByText('Waiting for answer')).toBeNull();
		});
	});

	describe('speaking', () => {
		it('marks the people in the call who are speaking with a live microphone', () => {
			showInfo([member('ada'), member('bob')]);
			mockSpeakers.push({ identity: 'ada', isMicrophoneEnabled: true });
			const { queryByTestId } = renderSheet();

			expect(queryByTestId('conference-speaking-ada')).not.toBeNull();
			expect(queryByTestId('conference-speaking-bob')).toBeNull();
		});

		it('does not mark someone who is speaking while muted', () => {
			showInfo([member('ada')]);
			mockSpeakers.push({ identity: 'ada', isMicrophoneEnabled: false });
			const { queryByTestId } = renderSheet();

			expect(queryByTestId('conference-speaking-ada')).toBeNull();
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

		it('rings the call for the member who was pressed', () => {
			showInfo([member('bob', { joined: false })]);
			const { getByTestId } = renderSheet();

			fireEvent.press(getByTestId('conference-ring-bob'));

			expect(videoConferenceRing).toHaveBeenCalledWith('call1', 'bob');
		});

		it('tells the user when the ring could not be sent, and lets them try again', async () => {
			const failure = new Error('too many rings');
			(videoConferenceRing as jest.Mock).mockRejectedValueOnce(failure);
			showInfo([member('bob', { joined: false })]);
			const { getByTestId } = renderSheet();

			fireEvent.press(getByTestId('conference-ring-bob'));

			await waitFor(() => expect(showErrorAlertWithEMessage).toHaveBeenCalledWith(failure));
			await waitFor(() => expect(getByTestId('conference-ring-bob').props.accessibilityState).toMatchObject({ disabled: false }));
		});
	});
});

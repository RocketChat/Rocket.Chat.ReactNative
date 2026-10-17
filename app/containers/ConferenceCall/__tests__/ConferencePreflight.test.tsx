import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { ensureCameraPermission } from '~/lib/methods/ensureCameraPermission';
import { showToast } from '~/lib/methods/helpers/showToast';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { preflightCallId, useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { videoConferenceDecline } from '~/lib/services/restApi';
import { mockedStore } from '~/reducers/mockedStore';
import ConferencePreflight from '../ConferencePreflight';

jest.mock('expo-camera', () => ({ CameraView: 'CameraView' }));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: jest.fn() }));
jest.mock('~/lib/hooks/useSubscription', () => ({ useSubscription: jest.fn(() => ({ fname: 'general' })) }));
jest.mock('~/lib/methods/ensureCameraPermission', () => ({ ensureCameraPermission: jest.fn() }));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
jest.mock('~/lib/services/conference/ConferenceSession', () => ({ conferenceSession: { join: jest.fn() } }));
jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({ closeConferenceCall: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ videoConferenceDecline: jest.fn(() => Promise.resolve()) }));

const infoMock = useConferenceInfo as jest.Mock;
const subscriptionMock = useSubscription as jest.Mock;
const permissionMock = ensureCameraPermission as jest.Mock;

const renderPreflight = () =>
	render(
		<Provider store={mockedStore}>
			<ConferencePreflight />
		</Provider>
	);

const openNewCall = () => useConferenceCallStore.getState().open({ callId: preflightCallId('GENERAL'), rid: 'GENERAL' });
const openExistingCall = () => useConferenceCallStore.getState().open({ callId: 'call1', rid: 'GENERAL' });

describe('ConferencePreflight', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useConferenceCallStore.getState().close();
		infoMock.mockReturnValue({ info: undefined, loading: false, failed: false, reload: jest.fn() });
		permissionMock.mockResolvedValue(true);
		mockedStore.dispatch(setUser({ id: 'me', token: 'tok' }));
	});

	describe('starting a call', () => {
		beforeEach(openNewCall);

		it('offers to start a new conference named after the room', () => {
			const { getByText, getByTestId } = renderPreflight();

			expect(getByText('Start a new conference')).toBeTruthy();
			expect(getByTestId('conference-preflight-title').props.value).toBe('Meeting in "general"');
		});

		it('starts with the microphone on, the camera off, and ringing on', () => {
			const { getByTestId } = renderPreflight();

			fireEvent.press(getByTestId('conference-preflight-join'));

			expect(conferenceSession.join).toHaveBeenCalledWith({ title: 'Meeting in "general"', mic: true, cam: false });
		});

		it('uses the name the user typed, without stray spaces', () => {
			const { getByTestId } = renderPreflight();

			fireEvent.changeText(getByTestId('conference-preflight-title'), '  Standup  ');
			fireEvent.press(getByTestId('conference-preflight-join'));

			expect(conferenceSession.join).toHaveBeenCalledWith(expect.objectContaining({ title: 'Standup' }));
		});

		it('lets the Workspace name a call whose name was cleared', () => {
			const { getByTestId } = renderPreflight();

			fireEvent.changeText(getByTestId('conference-preflight-title'), '   ');
			fireEvent.press(getByTestId('conference-preflight-join'));

			expect(conferenceSession.join).toHaveBeenCalledWith(expect.objectContaining({ title: undefined }));
		});

		it('does not offer a choice about ringing people', () => {
			const { queryByTestId, queryByText } = renderPreflight();

			expect(queryByTestId('conference-preflight-ring')).toBeNull();
			expect(queryByText('Ring people')).toBeNull();
		});

		it('names the call after the room once the room has loaded', () => {
			subscriptionMock.mockReturnValueOnce(undefined);
			const { getByTestId, rerender } = renderPreflight();

			expect(getByTestId('conference-preflight-title').props.value).toBe('');

			rerender(
				<Provider store={mockedStore}>
					<ConferencePreflight />
				</Provider>
			);

			expect(getByTestId('conference-preflight-title').props.value).toBe('Meeting in "general"');
		});

		it('joins muted when the user muted the microphone first', () => {
			const { getByTestId } = renderPreflight();

			fireEvent.press(getByTestId('conference-preflight-mic'));
			fireEvent.press(getByTestId('conference-preflight-join'));

			expect(conferenceSession.join).toHaveBeenCalledWith(expect.objectContaining({ mic: false }));
		});

		it('cancels the call', () => {
			const { getByTestId } = renderPreflight();

			fireEvent.press(getByTestId('conference-preflight-cancel'));

			expect(closeConferenceCall).toHaveBeenCalledTimes(1);
		});
	});

	describe('the camera', () => {
		beforeEach(openNewCall);

		it('turns on and shows a preview once the user allows it', async () => {
			const { getByTestId, findByTestId } = renderPreflight();

			fireEvent.press(getByTestId('conference-preflight-camera'));

			expect(await findByTestId('conference-preflight-preview')).toBeTruthy();
			fireEvent.press(getByTestId('conference-preflight-join'));
			expect(conferenceSession.join).toHaveBeenCalledWith(expect.objectContaining({ cam: true }));
		});

		it('stays off, and says why, when the user refuses', async () => {
			permissionMock.mockResolvedValue(false);
			const { getByTestId, queryByTestId } = renderPreflight();

			fireEvent.press(getByTestId('conference-preflight-camera'));

			await waitFor(() => expect(showToast).toHaveBeenCalledWith('Allow camera access to turn your camera on'));
			expect(queryByTestId('conference-preflight-preview')).toBeNull();
			fireEvent.press(getByTestId('conference-preflight-join'));
			expect(conferenceSession.join).toHaveBeenCalledWith(expect.objectContaining({ cam: false }));
		});

		it('turns back off without asking again', async () => {
			const { getByTestId, queryByTestId } = renderPreflight();
			fireEvent.press(getByTestId('conference-preflight-camera'));
			await waitFor(() => expect(getByTestId('conference-preflight-preview')).toBeTruthy());

			fireEvent.press(getByTestId('conference-preflight-camera'));

			expect(queryByTestId('conference-preflight-preview')).toBeNull();
			expect(permissionMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('joining a call', () => {
		beforeEach(openExistingCall);

		it('offers to join, without asking for a name or whether to ring', () => {
			const { getByText, queryByTestId } = renderPreflight();

			expect(getByText('Join the conference')).toBeTruthy();
			expect(queryByTestId('conference-preflight-title')).toBeNull();
			expect(queryByTestId('conference-preflight-ring')).toBeNull();
		});

		it('joins the call as it is', () => {
			const { getByTestId } = renderPreflight();

			fireEvent.press(getByTestId('conference-preflight-join'));

			expect(conferenceSession.join).toHaveBeenCalledWith(expect.objectContaining({ title: undefined, mic: true, cam: false }));
		});

		it('shows who is already in the call', () => {
			infoMock.mockReturnValue({
				info: {
					users: [
						{ _id: 'ada', username: 'ada', joined: true },
						{ _id: 'bob', username: 'bob', joined: true, leftAt: '2026-10-15T08:00:00.000Z' }
					]
				},
				loading: false,
				failed: false,
				reload: jest.fn()
			});

			const { getByTestId } = renderPreflight();

			expect(getByTestId('conference-preflight-people')).toBeTruthy();
		});

		describe('cancelling', () => {
			const showMember = (rest: object) =>
				infoMock.mockReturnValue({
					info: { users: [{ _id: 'me', username: 'me', joined: false, ...rest }] },
					loading: false,
					failed: false,
					reload: jest.fn()
				});

			it('tells the Workspace the user turned down a ring', () => {
				showMember({ ringingAt: '2026-10-15T08:00:00.000Z' });
				const { getByTestId } = renderPreflight();

				fireEvent.press(getByTestId('conference-preflight-cancel'));

				expect(videoConferenceDecline).toHaveBeenCalledWith('call1');
				expect(closeConferenceCall).toHaveBeenCalledTimes(1);
			});

			it('just closes when the user was never rung', () => {
				showMember({});
				const { getByTestId } = renderPreflight();

				fireEvent.press(getByTestId('conference-preflight-cancel'));

				expect(videoConferenceDecline).not.toHaveBeenCalled();
				expect(closeConferenceCall).toHaveBeenCalledTimes(1);
			});

			it('does not decline twice', () => {
				showMember({ ringingAt: '2026-10-15T08:00:00.000Z', declined: true });
				const { getByTestId } = renderPreflight();

				fireEvent.press(getByTestId('conference-preflight-cancel'));

				expect(videoConferenceDecline).not.toHaveBeenCalled();
			});
		});

		it('says so, instead of offering to join, when the call already ended', () => {
			infoMock.mockReturnValue({
				info: { endedAt: '2026-10-15T08:00:00.000Z', users: [] },
				loading: false,
				failed: false,
				reload: jest.fn()
			});

			const { getByText, queryByTestId } = renderPreflight();

			expect(getByText('Call ended')).toBeTruthy();
			expect(queryByTestId('conference-preflight-join')).toBeNull();
		});
	});

	describe('while the call is connecting', () => {
		const connect = () => act(() => useConferenceCallStore.getState().setPhase('connecting'));

		it('shows a loader in place of the start label and ignores another press', () => {
			openNewCall();
			const { getByTestId, queryByText } = renderPreflight();
			fireEvent.press(getByTestId('conference-preflight-join'));

			connect();
			fireEvent.press(getByTestId('conference-preflight-join'));

			expect(queryByText('Start call')).toBeNull();
			expect(conferenceSession.join).toHaveBeenCalledTimes(1);
		});

		it('keeps offering a new conference once the Workspace has created the call', () => {
			openNewCall();
			const { getByTestId, getByText, queryByText } = renderPreflight();
			fireEvent.press(getByTestId('conference-preflight-join'));

			act(() => {
				useConferenceCallStore.getState().assignCall('call1', 'GENERAL');
				useConferenceCallStore.getState().setPhase('connecting');
			});

			expect(getByText('Start a new conference')).toBeTruthy();
			expect(queryByText('Join the conference')).toBeNull();
			expect(getByTestId('conference-preflight-title')).toBeTruthy();
		});

		it('locks the call name and the microphone and camera buttons', () => {
			openNewCall();
			const { getByTestId } = renderPreflight();

			connect();

			expect(getByTestId('conference-preflight-title').props.editable).toBe(false);
			expect(getByTestId('conference-preflight-mic').props.accessibilityState).toMatchObject({ disabled: true });
			expect(getByTestId('conference-preflight-camera').props.accessibilityState).toMatchObject({ disabled: true });
		});

		it('lets go of the camera so the call can use it', async () => {
			openNewCall();
			const { getByTestId, queryByTestId } = renderPreflight();
			fireEvent.press(getByTestId('conference-preflight-camera'));
			await waitFor(() => expect(getByTestId('conference-preflight-preview')).toBeTruthy());

			connect();

			expect(queryByTestId('conference-preflight-preview')).toBeNull();
		});

		it('cancels without declining the call it is already joining', () => {
			openExistingCall();
			infoMock.mockReturnValue({
				info: { users: [{ _id: 'me', username: 'me', joined: false, ringingAt: '2026-10-15T08:00:00.000Z' }] },
				loading: false,
				failed: false,
				reload: jest.fn()
			});
			const { getByTestId } = renderPreflight();

			connect();
			fireEvent.press(getByTestId('conference-preflight-cancel'));

			expect(videoConferenceDecline).not.toHaveBeenCalled();
			expect(closeConferenceCall).toHaveBeenCalledTimes(1);
		});
	});
});

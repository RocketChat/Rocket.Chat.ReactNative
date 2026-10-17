import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { removeVideoConfCall } from '~/actions/videoConf';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { hideNotification } from '~/lib/methods/helpers/notifications';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { videoConferenceDecline } from '~/lib/services/restApi';
import { mockedStore } from '~/reducers/mockedStore';
import EmbeddedCallNotification from '../EmbeddedCallNotification';

jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
	...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
	findNodeHandle: () => 42
}));
jest.mock('~/lib/hooks/useConferenceInfo', () => ({ useConferenceInfo: jest.fn() }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => false }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/helpers/notifications', () => ({ hideNotification: jest.fn() }));
jest.mock('~/lib/methods/videoConf', () => ({ videoConfJoin: jest.fn() }));
jest.mock('~/lib/services/restApi', () => ({ videoConferenceDecline: jest.fn(() => Promise.resolve({ success: true })) }));
jest.mock('~/containers/Ringer', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	const { createElement } = jest.requireActual('react');
	return {
		__esModule: true,
		default: () => createElement(MockText, { testID: 'ringer' }, 'ringing'),
		ERingerSounds: { RINGTONE: 'ringtone' }
	};
});

const infoMock = useConferenceInfo as jest.Mock;

const callInfo = (extra: object = {}) => ({
	success: true,
	endedAt: undefined,
	capabilities: { embedded: true },
	createdBy: { _id: 'ada', username: 'ada', name: 'Ada Lovelace' },
	...extra
});

const showInfo = (info: object | undefined) =>
	infoMock.mockReturnValue({ info, loading: !info, failed: false, reload: jest.fn() });

const renderNotification = () =>
	render(
		<Provider store={mockedStore}>
			<EmbeddedCallNotification notification={{ callId: 'call1', rid: 'GENERAL', uid: 'ada' }} />
		</Provider>
	);

describe('EmbeddedCallNotification', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		showInfo(callInfo());
	});

	it('shows nothing until the call is known', () => {
		showInfo(undefined);

		const { queryByTestId } = renderNotification();

		expect(queryByTestId('embedded-call-notification')).toBeNull();
	});

	it.each([
		['already ended', { endedAt: '2026-10-16T05:00:00.000Z' }],
		['not one the app can join natively', { capabilities: { embedded: false } }]
	])('shows nothing, and puts the popup away, for a call that is %s', (_, extra) => {
		showInfo(callInfo(extra));

		const { queryByTestId } = renderNotification();

		expect(queryByTestId('embedded-call-notification')).toBeNull();
		expect(hideNotification).toHaveBeenCalledTimes(1);
	});

	it('says who is calling, by the name of the call when it has one', () => {
		showInfo(callInfo({ title: 'Standup' }));

		const { getByText, getByLabelText } = renderNotification();

		expect(getByText('Standup')).toBeTruthy();
		expect(getByLabelText('Incoming call from Standup')).toBeTruthy();
	});

	it('says who is calling, by the name of the caller when the call has no name', () => {
		const { getByText, getByLabelText } = renderNotification();

		expect(getByText('Ada Lovelace')).toBeTruthy();
		expect(getByLabelText('Incoming call from Ada Lovelace')).toBeTruthy();
	});

	it('joins the call from the room it was started in when accepted', () => {
		const { getByTestId } = renderNotification();

		fireEvent.press(getByTestId('embedded-call-accept'));

		expect(videoConfJoin).toHaveBeenCalledWith('call1', undefined, undefined, { rid: 'GENERAL' });
		expect(videoConferenceDecline).not.toHaveBeenCalled();
		expect(hideNotification).toHaveBeenCalledTimes(1);
	});

	it('tells the Workspace the call was turned down when declined', () => {
		const { getByTestId } = renderNotification();

		fireEvent.press(getByTestId('embedded-call-decline'));

		expect(videoConferenceDecline).toHaveBeenCalledWith('call1');
		expect(videoConfJoin).not.toHaveBeenCalled();
	});

	it('only puts the popup away when dismissed, leaving the call open to be joined later', () => {
		const { getByTestId } = renderNotification();

		fireEvent.press(getByTestId('embedded-call-dismiss'));

		expect(videoConfJoin).not.toHaveBeenCalled();
		expect(videoConferenceDecline).not.toHaveBeenCalled();
		expect(hideNotification).toHaveBeenCalledTimes(1);
	});

	it('forgets the ringing call once the popup goes away', () => {
		const dispatch = jest.spyOn(mockedStore, 'dispatch');
		const { unmount } = renderNotification();

		unmount();

		expect(dispatch).toHaveBeenCalledWith(removeVideoConfCall({ callId: 'call1', rid: 'GENERAL', uid: 'ada' }));
	});
});

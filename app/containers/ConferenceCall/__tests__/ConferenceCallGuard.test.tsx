import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { selectServerRequest } from '~/actions/server';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { mockedStore } from '~/reducers/mockedStore';
import ConferenceCallGuard from '../ConferenceCallGuard';

jest.mock('~/lib/services/conference/conferenceCallNavigation', () => ({ closeConferenceCall: jest.fn() }));

const SERVER = 'https://open.rocket.chat';

const renderGuard = () =>
	render(
		<Provider store={mockedStore}>
			<ConferenceCallGuard />
		</Provider>
	);

describe('ConferenceCallGuard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useConferenceCallStore.getState().close();
		mockedStore.dispatch(selectServerRequest(SERVER, '8.0.0'));
	});

	it('leaves a call alone while the Workspace stays the same', () => {
		useConferenceCallStore.getState().open({ callId: 'call1', server: SERVER });

		renderGuard();

		expect(closeConferenceCall).not.toHaveBeenCalled();
	});

	it('ends a call when the user switches to another Workspace', () => {
		useConferenceCallStore.getState().open({ callId: 'call1', server: SERVER });
		renderGuard();

		act(() => {
			mockedStore.dispatch(selectServerRequest('https://other.rocket.chat', '8.0.0'));
		});

		expect(closeConferenceCall).toHaveBeenCalledTimes(1);
	});

	it('has nothing to end when no call is open', () => {
		renderGuard();

		act(() => {
			mockedStore.dispatch(selectServerRequest('https://other.rocket.chat', '8.0.0'));
		});

		expect(closeConferenceCall).not.toHaveBeenCalled();
	});
});

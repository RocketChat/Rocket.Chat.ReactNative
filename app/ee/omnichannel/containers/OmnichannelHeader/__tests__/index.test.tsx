import { act, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import OmnichannelStatus from '../index';
import { mockedStore } from '~/reducers/mockedStore';
import { initStore } from '~/lib/store/auxStore';
import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { setUser } from '~/actions/login';
import { addSettings, clearSettings, updateSettings } from '~/actions/settings';

initStore(mockedStore);

const renderHeader = () =>
	render(
		<Provider store={mockedStore}>
			<OmnichannelStatus />
		</Provider>
	);

describe('OmnichannelStatus', () => {
	beforeEach(() => {
		mockedStore.dispatch(clearSettings());
		mockedStore.dispatch(setEnterpriseModules(['omnichannel-mobile-enterprise']));
		mockedStore.dispatch(setUser({ id: 'agent', roles: ['livechat-agent'], statusLivechat: 'available' }));
	});

	it('shows the status switch to a licensed agent when Omnichannel is enabled', () => {
		mockedStore.dispatch(addSettings({ Livechat_enabled: true }));

		renderHeader();

		expect(screen.getByText('Omnichannel')).toBeTruthy();
	});

	it('hides the status switch from a licensed agent when Omnichannel is disabled', () => {
		mockedStore.dispatch(addSettings({ Livechat_enabled: false }));

		renderHeader();

		expect(screen.queryByText('Omnichannel')).toBeNull();
	});

	it('hides the status switch when an admin disables Omnichannel while the room list is open', () => {
		mockedStore.dispatch(addSettings({ Livechat_enabled: true }));
		renderHeader();

		act(() => {
			mockedStore.dispatch(updateSettings('Livechat_enabled', false));
		});

		expect(screen.queryByText('Omnichannel')).toBeNull();
	});

	it('keeps the status switch while the workspace settings have not loaded yet', () => {
		renderHeader();

		expect(screen.getByText('Omnichannel')).toBeTruthy();
	});
});

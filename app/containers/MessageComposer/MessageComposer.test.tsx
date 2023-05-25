import * as React from 'react';
import { act, fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { MessageComposer } from './MessageComposer';
import { setPermissions } from '../../actions/permissions';
import { addSettings } from '../../actions/settings';
import { selectServerRequest } from '../../actions/server';
import { setUser } from '../../actions/login';
import { mockedStore } from '../../reducers/mockedStore';
import { IPermissionsState } from '../../reducers/permissions';

const baseUrl = 'https://open.rocket.chat';
mockedStore.dispatch(selectServerRequest(baseUrl));
mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));

const permissions: IPermissionsState = { 'mobile-upload-file': ['user'] };
mockedStore.dispatch(setPermissions(permissions));
mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));

const Render = () => (
	<Provider store={mockedStore}>
		<MessageComposer rid={''} editing={false} onSendMessage={jest.fn()} sharing={false} />
	</Provider>
);

test('renders correctly', () => {
	render(<Render />);
	expect(screen.getByTestId('message-composer-input')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

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

const initialStoreState = () => {
	const baseUrl = 'https://open.rocket.chat';
	mockedStore.dispatch(selectServerRequest(baseUrl));
	mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));

	const permissions: IPermissionsState = { 'mobile-upload-file': ['user'] };
	mockedStore.dispatch(setPermissions(permissions));
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));
};
initialStoreState();

const Render = () => (
	<Provider store={mockedStore}>
		<MessageComposer rid={''} editing={false} onSendMessage={jest.fn()} sharing={false} />
	</Provider>
);

test('renders correctly', () => {
	render(<Render />);
	expect(screen.getByTestId('message-composer-input')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders correctly with audio recorder disabled', () => {
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: false }));
	render(<Render />);
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders correctly without audio upload permissions', () => {
	mockedStore.dispatch(setPermissions({}));
	render(<Render />);
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders correctly with audio recorder disabled and without audio upload permissions', () => {
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: false }));
	mockedStore.dispatch(setPermissions({}));
	render(<Render />);
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders toolbar when focused', async () => {
	initialStoreState();
	render(<Render />);
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.queryByTestId('message-composer-open-emoji')).toBeNull();
	expect(screen.queryByTestId('message-composer-markdown')).toBeNull();
	expect(screen.queryByTestId('message-composer-mention')).toBeNull();

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
	});
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-open-emoji')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-markdown')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-mention')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('send message', async () => {
	const onSendMessage = jest.fn();
	render(
		<Provider store={mockedStore}>
			<MessageComposer rid={''} editing={false} onSendMessage={onSendMessage} sharing={false} />
		</Provider>
	);
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	await act(async () => {
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
		expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
		expect(screen.getByTestId('message-composer-send')).toBeOnTheScreen();
		// await fireEvent.press(screen.getByTestId('message-composer-send'));
	});
	// await waitFor(() => expect(onSendMessage).toHaveBeenCalledTimes(1));
	// expect(onSendMessage).toHaveBeenCalledWith('test');
	expect(screen.toJSON()).toMatchSnapshot();
});

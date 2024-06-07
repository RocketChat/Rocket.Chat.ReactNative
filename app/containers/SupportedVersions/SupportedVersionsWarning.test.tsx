import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../reducers/mockedStore';
import { SupportedVersionsWarning } from './SupportedVersionsWarning';
import { setUser } from '../../actions/login';
import { setSupportedVersions } from '../../actions/supportedVersions';
import { selectServerSuccess } from '../../actions/server';

const Render = () => (
	<Provider store={mockedStore}>
		<SupportedVersionsWarning />
	</Provider>
);

const TODAY = '2023-04-01T00:00:00.000Z';
jest.useFakeTimers();
jest.setSystemTime(new Date(TODAY));

describe('SupportedVersionsWarning', () => {
	test('empty', () => {
		render(<Render />);
		expect(screen.queryByTestId('sv-warn-title')).toBeNull();
		expect(screen.queryByTestId('sv-warn-subtitle')).toBeNull();
		expect(screen.queryByTestId('sv-warn-description')).toBeNull();
		expect(screen.queryByTestId('sv-warn-button')).toBeNull();
	});

	test('render properly', () => {
		mockedStore.dispatch(
			setUser({ language: 'en', username: 'rocket.cat', emails: [{ address: 'test@test.com', verified: true }] })
		);
		mockedStore.dispatch(selectServerSuccess({ server: 'https://example.com', version: '1.0', name: 'Test Server' }));
		mockedStore.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					link: 'Docs page',
					title: 'title_token',
					subtitle: 'subtitle_token',
					description: 'description_token',
					remainingDays: 10,
					type: 'alert',
					params: {
						test_a: 'test A works',
						test_b: ':)'
					}
				},
				i18n: {
					en: {
						title_token: '{{instance_ws_name}} is running an unsupported version of Rocket.Chat',
						subtitle_token: 'Mobile and desktop app access to {{instance_domain}} will be cut off in {{remaining_days}} days.',
						description_token:
							'User: {{instance_username}} Email: {{instance_email}} Version: {{instance_version}} Extra params: {{test_a}} {{test_b}}'
					},
					'pt-BR': {
						title_token: 'Alô título',
						subtitle_token:
							'{{instance_ws_name}} {{instance_domain}} {{remaining_days}} {{instance_username}} {{instance_email}} {{instance_version}} {{test_a}} {{test_b}}'
					}
				},
				expiration: '2023-05-01T00:00:00.000Z'
			})
		);
		render(<Render />);
		expect(screen.getByText('Test Server is running an unsupported version of Rocket.Chat')).toBeOnTheScreen();
		expect(
			screen.getByText('Mobile and desktop app access to https://example.com will be cut off in 30 days.')
		).toBeOnTheScreen();
		expect(
			screen.getByText('User: rocket.cat Email: test@test.com Version: 1.0 Extra params: test A works :)')
		).toBeOnTheScreen();
		expect(screen.getByText('Learn more')).toBeOnTheScreen();
	});

	test('render another language', () => {
		mockedStore.dispatch(setUser({ language: 'pt-BR' }));
		render(<Render />);
		expect(screen.getByText('Alô título')).toBeOnTheScreen();
		expect(screen.getByText('Test Server https://example.com 30 rocket.cat test@test.com 1.0 test A works :)')).toBeOnTheScreen();
		expect(screen.queryByTestId('sv-warn-description')).toBeNull();
		expect(screen.getByText('Learn more')).toBeOnTheScreen();
	});

	test('user on unsupported language and fallback to en', () => {
		mockedStore.dispatch(setUser({ language: 'it' }));
		render(<Render />);
		expect(screen.getByText('Test Server is running an unsupported version of Rocket.Chat')).toBeOnTheScreen();
		expect(
			screen.getByText('Mobile and desktop app access to https://example.com will be cut off in 30 days.')
		).toBeOnTheScreen();
		expect(
			screen.getByText('User: rocket.cat Email: test@test.com Version: 1.0 Extra params: test A works :)')
		).toBeOnTheScreen();
		expect(screen.getByText('Learn more')).toBeOnTheScreen();
	});
});

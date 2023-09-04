import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { mockedStore } from '../../reducers/mockedStore';
import { SupportedVersionsWarning } from './SupportedVersionsWarning';
import { setUser } from '../../actions/login';
import { setSupportedVersions } from '../../actions/supportedVersions';

const Render = () => (
	<Provider store={mockedStore}>
		<SupportedVersionsWarning />
	</Provider>
);

describe('SupportedVersionsWarning', () => {
	test('empty', () => {
		render(<Render />);
		expect(screen.queryByTestId('sv-warn-title')).toBeNull();
		expect(screen.queryByTestId('sv-warn-subtitle')).toBeNull();
		expect(screen.queryByTestId('sv-warn-description')).toBeNull();
		expect(screen.queryByTestId('sv-warn-button')).toBeNull();
	});

	test('render properly', () => {
		mockedStore.dispatch(setUser({ language: 'en' }));
		mockedStore.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					link: 'Docs page',
					title: 'title_token',
					subtitle: 'subtitle_token',
					description: 'description_token',
					remainingDays: 10,
					type: 'alert'
				},
				i18n: {
					en: {
						title_token: 'Title in english',
						subtitle_token: 'Subtitle in english',
						description_token: 'description in english'
					},
					'pt-BR': {
						title_token: 'Alô título',
						subtitle_token: 'Isso está escrito em pt-BR'
					}
				}
			})
		);
		render(<Render />);
		expect(screen.getByText('Title in english')).toBeOnTheScreen();
		expect(screen.getByText('Subtitle in english')).toBeOnTheScreen();
		expect(screen.getByText('description in english')).toBeOnTheScreen();
		expect(screen.getByText('Learn more')).toBeOnTheScreen();
	});

	test('render another language', () => {
		mockedStore.dispatch(setUser({ language: 'pt-BR' }));
		render(<Render />);
		expect(screen.getByText('Alô título')).toBeOnTheScreen();
		expect(screen.getByText('Isso está escrito em pt-BR')).toBeOnTheScreen();
		expect(screen.queryByTestId('description in english')).toBeNull();
		expect(screen.getByText('Learn more')).toBeOnTheScreen(); // TODO: i18n
	});

	test('user on unsupported language and fallback to en', () => {
		mockedStore.dispatch(setUser({ language: 'it' }));
		render(<Render />);
		expect(screen.getByText('Title in english')).toBeOnTheScreen();
		expect(screen.getByText('Subtitle in english')).toBeOnTheScreen();
		expect(screen.getByText('description in english')).toBeOnTheScreen();
		expect(screen.getByText('Learn more')).toBeOnTheScreen();
	});
});

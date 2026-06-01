import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import * as stories from './LoginServices.stories';
import LoginServices from './index';
import { createMockedStore } from '../../reducers/mockedStore';
import { setLoginServices } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import { type IServices } from '../../selectors/login';
import { type IItemService } from './interfaces';

jest.mock('../../lib/services/connect', () => ({}));

generateSnapshots(stories);

jest.mock('../../i18n', () => ({
	t: (key: string) => key
}));

jest.mock('./serviceLogin', () => ({}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
	openURL: jest.fn()
}));

const SERVER = 'https://demo.rocket.chat';

const makeService = (overrides: Partial<IItemService> = {}): IItemService =>
	({
		_id: 'github',

		name: 'github',
		service: '',
		authType: 'oauth',
		buttonColor: '',
		buttonLabelColor: '',
		clientConfig: { provider: '' },
		serverURL: '',
		authorizePath: '',
		clientId: 'client-123',
		scope: '',
		...overrides
	} as IItemService);

const buildServices = (count: number, extra: Partial<IItemService> = {}): IServices => {
	const names = ['github', 'gitlab', 'google', 'facebook', 'linkedin', 'twitter', 'wordpress'] as const;
	return Object.fromEntries(
		names.slice(0, count).map(name => [name, makeService({ _id: name, name: name as any, ...extra })])
	) as unknown as IServices;
};

const Wrapper = ({ children, store }: { children: React.ReactNode; store: ReturnType<typeof createMockedStore> }) => (
	<Provider store={store}>{children}</Provider>
);

describe('LoginServices', () => {
	it('does not show expand/collapse button when services <= 3', () => {
		const store = createMockedStore();
		store.dispatch(setLoginServices(buildServices(2)));
		render(
			<Wrapper store={store}>
				<LoginServices separator />
			</Wrapper>
		);
		expect(screen.queryByText('Onboarding_more_options')).toBeNull();
	});

	it('shows expand/collapse button when separator=true and > 3 services, does not show all services', () => {
		const store = createMockedStore();
		store.dispatch(setLoginServices(buildServices(5)));
		render(
			<Wrapper store={store}>
				<LoginServices separator />
			</Wrapper>
		);
		expect(screen.queryByText('Continue_with Facebook')).toBeNull();
		expect(screen.queryByText('Continue_with Linkedin')).toBeNull();
		expect(screen.getByText('Onboarding_more_options')).toBeTruthy();
	});

	it('uncollapses and shows all services', () => {
		const store = createMockedStore();
		store.dispatch(setLoginServices(buildServices(5)));
		render(
			<Wrapper store={store}>
				<LoginServices separator />
			</Wrapper>
		);
		expect(screen.queryByText('Continue_with Facebook')).toBeNull();
		expect(screen.queryByText('Continue_with Linkedin')).toBeNull();
		expect(screen.getByText('Onboarding_more_options')).toBeTruthy();

		fireEvent.press(screen.getByText('Onboarding_more_options'));

		expect(screen.getByText('Continue_with Facebook')).toBeTruthy();
		expect(screen.getByText('Continue_with Linkedin')).toBeTruthy();
	});

	it('filters out services with hideButtonOnMobile=true and shows Login_on_web button', () => {
		const store = createMockedStore();
		const services = {
			...buildServices(2),
			hidden: makeService({ _id: 'hidden', name: 'facebook' as any, hideButtonOnMobile: true })
		} as unknown as IServices;
		store.dispatch(setLoginServices(services));
		render(
			<Wrapper store={store}>
				<LoginServices separator />
			</Wrapper>
		);

		expect(screen.queryByText('Continue_with Facebook')).toBeNull();
		expect(screen.queryByText('Onboarding_more_options')).toBeNull();
		expect(screen.getByText('Login_on_web')).toBeTruthy();
	});

	it('does not show Login_on_web button when no services are hidden', () => {
		const store = createMockedStore();
		store.dispatch(setLoginServices(buildServices(2)));
		render(
			<Wrapper store={store}>
				<LoginServices separator={false} />
			</Wrapper>
		);
		expect(screen.queryByText('Login_on_web')).toBeNull();
	});

	it('does not show Login_on_web button when collapsed and more than 3 services, shows when uncollapsed', () => {
		const store = createMockedStore();
		const services = {
			...buildServices(4),
			hidden: makeService({ _id: 'hidden', name: 'facebook' as any, hideButtonOnMobile: true })
		} as unknown as IServices;
		store.dispatch(setLoginServices(services));
		render(
			<Wrapper store={store}>
				<LoginServices separator />
			</Wrapper>
		);

		expect(screen.queryByText('Login_on_web')).toBeNull();

		fireEvent.press(screen.getByText('Onboarding_more_options'));

		expect(screen.queryByText('Login_on_web')).toBeTruthy();
	});

	it('opens Login on web URL when button is pressed', () => {
		const store = createMockedStore();
		const services = {
			...buildServices(2),
			hidden: makeService({ _id: 'hidden', name: 'facebook' as any, hideButtonOnMobile: true })
		} as unknown as IServices;
		store.dispatch(setLoginServices(services));
		store.dispatch(selectServerRequest(SERVER, '6.0.0'));
		render(
			<Wrapper store={store}>
				<LoginServices separator />
			</Wrapper>
		);

		fireEvent.press(screen.getByText('Login_on_web'));
		expect(Linking.openURL).toHaveBeenCalledWith(`${SERVER}/home?loginClient=mobile`);
	});
});

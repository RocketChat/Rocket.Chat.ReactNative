import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { Provider } from 'react-redux';

import { store } from '../../../storybook/stories';
import { ThemeContext } from '../../theme';
import { colors } from '../../lib/constants';
import ServicesSeparator from './ServicesSeparator';
import ServicesList from './ServicesList';

const services = {
	github: {
		name: 'github',
		clientId: 'github-123',
		buttonLabelText: '',
		buttonColor: '',
		buttonLabelColor: '',
		custom: false,
		authType: 'oauth'
	},
	gitlab: {
		name: 'gitlab',
		clientId: 'gitlab-123',
		buttonLabelText: '',
		buttonColor: '',
		buttonLabelColor: '',
		custom: false,
		authType: 'oauth'
	},
	google: {
		name: 'google',
		clientId: 'google-123',
		buttonLabelText: '',
		buttonColor: '',
		buttonLabelColor: '',
		custom: false,
		authType: 'oauth'
	},
	apple: {
		name: 'apple',
		clientId: 'apple-123',
		buttonLabelText: 'Sign in with Apple',
		buttonColor: '#000',
		buttonLabelColor: '#FFF',
		custom: false,
		authType: 'apple'
	}
};

const theme = 'light';

const stories = storiesOf('Login Services', module)
	.addDecorator(story => <Provider store={store}>{story()}</Provider>)
	.addDecorator(story => <ThemeContext.Provider value={{ theme, colors: colors[theme] }}>{story()}</ThemeContext.Provider>);

stories.add('ServicesSeparator', () => (
	<>
		<ServicesSeparator collapsed onPressButtonSeparator={() => {}} separator services={services} />
		<ServicesSeparator collapsed={false} onPressButtonSeparator={() => {}} separator services={services} />
	</>
));

stories.add('ServiceList', () => (
	<>
		{Object.values(services).map(service => (
			<ServicesList
				CAS_enabled={true}
				CAS_login_url={'CAS_login_url'}
				Gitlab_URL={'Gitlab_URL'}
				server={'server'}
				service={service}
				storiesTestOnPress={() => {}}
			/>
		))}
	</>
));

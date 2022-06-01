import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { Provider } from 'react-redux';
import { StyleSheet, Text, ScrollView } from 'react-native';

import { store } from '../../../storybook/stories';
import { ThemeContext } from '../../theme';
import { colors } from '../../lib/constants';
import i18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import ServicesSeparator from './ServicesSeparator';
import ButtonService from './ButtonService';

const styles = StyleSheet.create({
	serviceName: {
		...sharedStyles.textSemibold
	}
});

const services = {
	github: {
		_id: 'github',
		name: 'github',
		clientId: 'github-123',
		buttonLabelText: '',
		buttonColor: '',
		buttonLabelColor: '',
		custom: false,
		authType: 'oauth'
	},
	gitlab: {
		_id: 'gitlab',
		name: 'gitlab',
		clientId: 'gitlab-123',
		buttonLabelText: '',
		buttonColor: '',
		buttonLabelColor: '',
		custom: false,
		authType: 'oauth'
	},
	google: {
		_id: 'google',
		name: 'google',
		clientId: 'google-123',
		buttonLabelText: '',
		buttonColor: '',
		buttonLabelColor: '',
		custom: false,
		authType: 'oauth'
	},
	apple: {
		_id: 'apple',
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
	.addDecorator(story => <ThemeContext.Provider value={{ theme, colors: colors[theme] }}>{story()}</ThemeContext.Provider>)
	.addDecorator(story => <ScrollView style={sharedStyles.containerScrollView}>{story()}</ScrollView>);

stories.add('ServicesSeparator', () => (
	<>
		<ServicesSeparator collapsed onPressButtonSeparator={() => {}} separator services={services} />
		<ServicesSeparator collapsed={false} onPressButtonSeparator={() => {}} separator services={services} />
	</>
));

stories.add('ServiceList', () => (
	<>
		{Object.values(services).map(service => {
			const icon = `${service.name}-monochromatic`;
			const buttonText = (
				<>
					{i18n.t('Continue_with')} <Text style={styles.serviceName}>{service.name}</Text>
				</>
			);
			return (
				<ButtonService
					key={service._id}
					onPress={() => {}}
					backgroundColor={colors[theme].chatComponentBackground}
					buttonText={buttonText}
					icon={icon}
					name={service.name}
					authType={service.authType}
				/>
			);
		})}
	</>
));

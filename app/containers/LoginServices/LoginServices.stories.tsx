import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '../../lib/constants';
import i18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import ServicesSeparator from './ServicesSeparator';
import ButtonService from './ButtonService';
import { IServices } from '../../selectors/login';
import { TIconsName } from '../CustomIcon';

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
} as unknown as IServices;

const theme = 'light';

export default {
	title: 'Login Services'
};

export const Separators = () => (
	<>
		<ServicesSeparator collapsed onPress={() => {}} separator services={services} />
		<ServicesSeparator collapsed={false} onPress={() => {}} separator services={services} />
	</>
);

export const ServiceList = () => (
	<>
		{Object.values(services).map(service => {
			const icon = `${service.name}-monochromatic` as TIconsName;
			const buttonText = (
				<>
					{i18n.t('Continue_with')} <Text style={styles.serviceName}>{service.name}</Text>
				</>
			);
			return (
				<ButtonService
					key={service._id}
					onPress={() => {}}
					backgroundColor={colors[theme].surfaceTint}
					buttonText={buttonText}
					icon={icon}
					name={service.name}
					authType={service.authType}
				/>
			);
		})}
	</>
);

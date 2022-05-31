import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { shallowEqual } from 'react-redux';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../../theme';
import Touch from '../../utils/touch';
import I18n from '../../i18n';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { IServices } from '../../selectors/login';
import { useAppSelector } from '../../lib/hooks';
import { IItemService, IOauthProvider } from './interfaces';
import * as ServiceLogin from './serviceLogin';
import styles, { SERVICES_COLLAPSED_HEIGHT, SERVICE_HEIGHT } from './styles';
import ServicesSeparator from './ServicesSeparator';

const LoginServices = ({ separator }: { separator: boolean }): React.ReactElement => {
	const [collapsed, setCollapsed] = useState(true);
	const { theme, colors } = useTheme();

	const { Gitlab_URL, CAS_enabled, CAS_login_url } = useAppSelector(
		state => ({
			Gitlab_URL: state.settings.API_Gitlab_URL as string,
			CAS_enabled: state.settings.CAS_enabled as boolean,
			CAS_login_url: state.settings.CAS_login_url as string
		}),
		shallowEqual
	);
	const server = useAppSelector(state => state.server.server);
	const services = useAppSelector(state => state.login.services as IServices);
	const { length } = Object.values(services);

	const heightButtons = useSharedValue(SERVICES_COLLAPSED_HEIGHT);

	const animatedStyle = useAnimatedStyle(() => ({
		overflow: 'hidden',
		height: withTiming(heightButtons.value, { duration: 300, easing: Easing.inOut(Easing.quad) })
	}));

	const getSocialOauthProvider = (name: string) => {
		const oauthProviders: IOauthProvider = {
			facebook: () => ServiceLogin.onPressFacebook({ services, server }),
			github: () => ServiceLogin.onPressGithub({ services, server }),
			gitlab: () => ServiceLogin.onPressGitlab({ services, server, urlOption: Gitlab_URL }),
			google: () => ServiceLogin.onPressGoogle({ services, server }),
			linkedin: () => ServiceLogin.onPressLinkedin({ services, server }),
			'meteor-developer': () => ServiceLogin.onPressMeteor({ services, server }),
			twitter: () => ServiceLogin.onPressTwitter({ services, server }),
			wordpress: () => ServiceLogin.onPressWordpress({ services, server })
		};
		return oauthProviders[name];
	};

	const onPressButtonSeparator = () => {
		heightButtons.value = collapsed ? SERVICE_HEIGHT * length : SERVICES_COLLAPSED_HEIGHT;
		setCollapsed(prevState => !prevState);
	};

	const renderItem = (service: IItemService) => {
		let { name } = service;
		name = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `${name}-monochromatic` as TIconsName;
		const isSaml = service.service === 'saml';
		let onPress: any = () => {};

		switch (service.authType) {
			case 'oauth': {
				onPress = getSocialOauthProvider(service.name);
				break;
			}
			case 'oauth_custom': {
				onPress = () => ServiceLogin.onPressCustomOAuth({ loginService: service, server });
				break;
			}
			case 'saml': {
				onPress = () => ServiceLogin.onPressSaml({ loginService: service, server });
				break;
			}
			case 'cas': {
				onPress = () => ServiceLogin.onPressCas({ casLoginUrl: CAS_login_url, server });
				break;
			}
			case 'apple': {
				onPress = () => ServiceLogin.onPressAppleLogin();
				break;
			}
			default:
				break;
		}

		name = name.charAt(0).toUpperCase() + name.slice(1);
		let buttonText;
		if (isSaml || (service.service === 'cas' && CAS_enabled)) {
			buttonText = <Text style={[styles.serviceName, isSaml && { color: service.buttonLabelColor }]}>{name}</Text>;
		} else {
			buttonText = (
				<>
					{I18n.t('Continue_with')} <Text style={styles.serviceName}>{name}</Text>
				</>
			);
		}

		const backgroundColor = isSaml && service.buttonColor ? service.buttonColor : colors.chatComponentBackground;

		return (
			<Touch
				key={service.name}
				onPress={onPress}
				style={[styles.serviceButton, { backgroundColor }]}
				theme={theme}
				activeOpacity={0.5}
				underlayColor={colors.buttonText}>
				<View style={styles.serviceButtonContainer}>
					{service.authType === 'oauth' || service.authType === 'apple' ? (
						<CustomIcon name={icon} size={24} color={colors.titleText} style={styles.serviceIcon} />
					) : null}
					<Text style={[styles.serviceText, { color: colors.titleText }]}>{buttonText}</Text>
				</View>
			</Touch>
		);
	};

	if (length > 3 && separator) {
		return (
			<>
				<Animated.View style={animatedStyle}>
					{Object.values(services).map((service: IItemService) => renderItem(service))}
				</Animated.View>
				<ServicesSeparator
					services={services}
					separator={separator}
					collapsed={collapsed}
					onPressButtonSeparator={onPressButtonSeparator}
				/>
			</>
		);
	}
	return (
		<>
			{Object.values(services).map((service: IItemService) => renderItem(service))}
			<ServicesSeparator
				services={services}
				separator={separator}
				collapsed={collapsed}
				onPressButtonSeparator={onPressButtonSeparator}
			/>
		</>
	);
};

export default LoginServices;

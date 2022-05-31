import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { IServices } from '../../selectors/login';
import { useAppSelector } from '../../lib/hooks';
import { IItemService } from './interfaces';
import { SERVICES_COLLAPSED_HEIGHT, SERVICE_HEIGHT } from './styles';
import ServicesSeparator from './ServicesSeparator';
import ServicesList from './ServicesList';

const LoginServices = ({ separator }: { separator: boolean }): React.ReactElement => {
	const [collapsed, setCollapsed] = useState(true);

	const { Gitlab_URL, CAS_enabled, CAS_login_url } = useAppSelector(
		state => ({
			Gitlab_URL: state.settings.API_Gitlab_URL as string,
			CAS_enabled: state.settings.CAS_enabled as boolean,
			CAS_login_url: state.settings.CAS_login_url as string
		}),
		shallowEqual
	);
	const server = useAppSelector(state => state.server.server);
	const services = useAppSelector(state => state.login.services as IServices, shallowEqual);
	const { length } = Object.values(services);

	const heightButtons = useSharedValue(SERVICES_COLLAPSED_HEIGHT);

	const animatedStyle = useAnimatedStyle(() => ({
		overflow: 'hidden',
		height: withTiming(heightButtons.value, { duration: 300, easing: Easing.inOut(Easing.quad) })
	}));

	const onPressButtonSeparator = () => {
		heightButtons.value = collapsed ? SERVICE_HEIGHT * length : SERVICES_COLLAPSED_HEIGHT;
		setCollapsed(prevState => !prevState);
	};

	if (length > 3 && separator) {
		return (
			<>
				<Animated.View style={animatedStyle}>
					{Object.values(services).map((service: IItemService) => (
						<ServicesList
							CAS_enabled={CAS_enabled}
							CAS_login_url={CAS_login_url}
							Gitlab_URL={Gitlab_URL}
							server={server}
							service={service}
						/>
					))}
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
			{Object.values(services).map((service: IItemService) => (
				<ServicesList
					CAS_enabled={CAS_enabled}
					CAS_login_url={CAS_login_url}
					Gitlab_URL={Gitlab_URL}
					server={server}
					service={service}
				/>
			))}
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

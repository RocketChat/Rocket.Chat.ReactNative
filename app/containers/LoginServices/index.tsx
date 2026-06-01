import { useState, type ReactElement } from 'react';
import { shallowEqual } from 'react-redux';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { type IServices } from '../../selectors/login';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { type IItemService } from './interfaces';
import { SERVICES_COLLAPSED_HEIGHT, SERVICE_HEIGHT } from './styles';
import ServicesSeparator from './ServicesSeparator';
import ServiceList from './ServiceList';

const LoginServices = ({ separator }: { separator: boolean }): ReactElement => {
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
	const allServices = useAppSelector(state => state.login.services as IServices, shallowEqual);
	const filteredServices = Object.fromEntries(
		Object.entries(allServices).filter(([, service]) => !service.hideButtonOnMobile)
	) as IServices;
	const { length } = Object.values(filteredServices);
	const enableLoginOnWebButton = Object.values(allServices).length > length;
	console.log('filteredServices', filteredServices, 'enableLoginOnWebButton', enableLoginOnWebButton);
	console.log('allServices', allServices);
	const heightButtons = useSharedValue(SERVICES_COLLAPSED_HEIGHT);

	const animatedStyle = useAnimatedStyle(() => ({
		overflow: 'hidden',
		height: withTiming(heightButtons.value, { duration: 300, easing: Easing.inOut(Easing.quad) })
	}));

	const onPressButtonSeparator = () => {
		heightButtons.value = collapsed ? SERVICE_HEIGHT * (length + (enableLoginOnWebButton ? 1 : 0)) : SERVICES_COLLAPSED_HEIGHT;
		setCollapsed(prevState => !prevState);
	};

	if (length > 3 && separator) {
		return (
			<>
				<Animated.View style={animatedStyle}>
					<ServiceList
						services={filteredServices}
						CAS_enabled={CAS_enabled}
						CAS_login_url={CAS_login_url}
						Gitlab_URL={Gitlab_URL}
						server={server}
						collapsed={collapsed}
						showLoginOnWebButton={enableLoginOnWebButton}
					/>
				</Animated.View>
				<ServicesSeparator
					services={filteredServices}
					separator={separator}
					collapsed={collapsed}
					onPress={onPressButtonSeparator}
				/>
			</>
		);
	}
	return (
		<>
			<ServiceList
				services={filteredServices}
				CAS_enabled={CAS_enabled}
				CAS_login_url={CAS_login_url}
				Gitlab_URL={Gitlab_URL}
				server={server}
				collapsed={collapsed}
				showLoginOnWebButton={enableLoginOnWebButton}
			/>
			<ServicesSeparator
				services={filteredServices}
				separator={separator}
				collapsed={collapsed}
				onPress={onPressButtonSeparator}
			/>
		</>
	);
};

export default LoginServices;

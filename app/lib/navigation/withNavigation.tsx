import { useNavigation } from '@react-navigation/native';
import { type ComponentType } from 'react';

function withNavigation<P extends { navigation: any }>(WrappedComponent: ComponentType<P>): ComponentType<Omit<P, 'navigation'>> {
	// Screen-registration-only bridge: static API passes only { route } to screens, so no ref forwarding needed.
	const WithNavigation = (props: Omit<P, 'navigation'>) => {
		const navigation = useNavigation();
		return <WrappedComponent {...(props as P)} navigation={navigation} />;
	};
	WithNavigation.displayName = `WithNavigation(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
	return WithNavigation;
}

export default withNavigation;

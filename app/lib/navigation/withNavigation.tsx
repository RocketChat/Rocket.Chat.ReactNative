import { useNavigation } from '@react-navigation/native';
import { type ComponentType } from 'react';

// Screen-registration-only HOC: injects navigation via hook; does not forward refs (React Navigation static API renders screens without refs).
function withNavigation<P extends { navigation: any }>(WrappedComponent: ComponentType<P>): ComponentType<Omit<P, 'navigation'>> {
	const WithNavigation = (props: Omit<P, 'navigation'>) => {
		const navigation = useNavigation();
		return <WrappedComponent {...(props as P)} navigation={navigation} />;
	};
	WithNavigation.displayName = `WithNavigation(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
	return WithNavigation;
}

export default withNavigation;

import { type ComponentType } from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { withSafeAreaInsets as withSafeAreaInsetsLib, type WithSafeAreaInsetsProps } from 'react-native-safe-area-context';

import { type TNavigationOptions } from '../../definitions/navigationTypes';

export type { WithSafeAreaInsetsProps };

export function withSafeAreaInsets<T>(
	Component: ComponentType<T & WithSafeAreaInsetsProps> & TNavigationOptions
): ComponentType<Omit<T, keyof WithSafeAreaInsetsProps>> & TNavigationOptions {
	const WithInsets = withSafeAreaInsetsLib<Omit<T, keyof WithSafeAreaInsetsProps>>(Component as any);
	hoistNonReactStatics(WithInsets, Component);
	return WithInsets as unknown as ComponentType<Omit<T, keyof WithSafeAreaInsetsProps>> & TNavigationOptions;
}

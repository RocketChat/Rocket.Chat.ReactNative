import { type ComponentType } from 'react';
import { useWindowDimensions, type ScaledSize } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { type TNavigationOptions } from '../../definitions/navigationTypes';

/**
 * Bridges RN's useWindowDimensions into class components, injecting
 * width/height/scale/fontScale as props.
 */
export function withDimensions<T extends object>(
	Component: ComponentType<T> & TNavigationOptions
): ComponentType<Omit<T, keyof ScaledSize>> & TNavigationOptions {
	const DimensionsComponent = (props: Omit<T, keyof ScaledSize>) => {
		const dimensions = useWindowDimensions();
		return <Component {...(props as T)} {...dimensions} />;
	};

	hoistNonReactStatics(DimensionsComponent, Component as any);
	return DimensionsComponent as ComponentType<Omit<T, keyof ScaledSize>> & TNavigationOptions;
}

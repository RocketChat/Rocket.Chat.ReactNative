import { type ComponentType, forwardRef } from 'react';
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
	const C = Component as ComponentType<any>;
	const DimensionsComponent = forwardRef<unknown, Omit<T, keyof ScaledSize>>((props, ref) => {
		const dimensions = useWindowDimensions();
		return <C ref={ref} {...props} {...dimensions} />;
	});

	hoistNonReactStatics(DimensionsComponent, Component as any);
	return DimensionsComponent as unknown as ComponentType<Omit<T, keyof ScaledSize>> & TNavigationOptions;
}

import { Dimensions } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { type ComponentType, createContext, useContext } from 'react';

import { type TNavigationOptions } from './definitions/navigationTypes';

export interface IDimensionsContextProps {
	width: number;
	height: number;
	scale: number;
	fontScale: number;
	setDimensions?: ({
		width,
		height,
		scale,
		fontScale
	}: {
		width: number;
		height: number;
		scale: number;
		fontScale: number;
	}) => void;
}

export const DimensionsContext = createContext<IDimensionsContextProps>(Dimensions.get('window') as IDimensionsContextProps);

/**
 * @deprecated use RN's useWindowDimensions hook instead
 */
export function withDimensions<T extends object>(Component: ComponentType<T> & TNavigationOptions): typeof Component {
	const DimensionsComponent = (props: T) => (
		<DimensionsContext.Consumer>{contexts => <Component {...props} {...contexts} />}</DimensionsContext.Consumer>
	);

	hoistNonReactStatics(DimensionsComponent, Component as any);
	return DimensionsComponent;
}

/**
 * @deprecated use RN's useWindowDimensions hook instead
 */
export const useDimensions = () => useContext(DimensionsContext);

/**
 * @deprecated use RN's useWindowDimensions hook instead
 */
export const useOrientation = () => {
	const { width, height } = useContext(DimensionsContext);
	const isPortrait = height > width;
	return {
		isPortrait,
		isLandscape: !isPortrait
	};
};

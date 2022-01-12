import React from 'react';
import { Dimensions } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';

import { TNavigationOptions } from './definitions/navigationTypes';

export interface IDimensionsContextProps {
	width: number;
	height?: number;
	scale: number;
	fontScale: number;
	setDimensions: ({
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

export const DimensionsContext = React.createContext<Partial<IDimensionsContextProps>>(Dimensions.get('window'));

export function withDimensions<T extends object>(Component: React.ComponentType<T> & TNavigationOptions): typeof Component {
	const DimensionsComponent = (props: T) => (
		<DimensionsContext.Consumer>{contexts => <Component {...props} {...contexts} />}</DimensionsContext.Consumer>
	);

	hoistNonReactStatics(DimensionsComponent, Component);
	return DimensionsComponent;
}

export const useDimensions = () => React.useContext(DimensionsContext);

export const useOrientation = () => {
	const { width, height } = React.useContext(DimensionsContext);
	const isPortrait = height! > width!;
	return {
		isPortrait,
		isLandscape: !isPortrait
	};
};

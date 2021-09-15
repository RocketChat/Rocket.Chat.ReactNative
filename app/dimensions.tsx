import React from 'react';
import { Dimensions } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';

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

export function withDimensions(Component: any) {
	const DimensionsComponent = (props: any) => (
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

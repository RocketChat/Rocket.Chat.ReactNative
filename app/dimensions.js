import React from 'react';
import { Dimensions } from 'react-native';
import hoistNonReactStatics from 'hoist-non-react-statics';

export const DimensionsContext = React.createContext(Dimensions.get('window'));

export function withDimensions(Component) {
	const DimensionsComponent = props => (
		<DimensionsContext.Consumer>
			{contexts => <Component {...props} {...contexts} />}
		</DimensionsContext.Consumer>
	);
	hoistNonReactStatics(DimensionsComponent, Component);
	return DimensionsComponent;
}

export const useDimensions = () => React.useContext(DimensionsContext);

export const useOrientation = () => {
	const { width, height } = React.useContext(DimensionsContext);
	const isPortrait = height > width;
	return {
		isPortrait,
		isLandscape: !isPortrait
	};
};

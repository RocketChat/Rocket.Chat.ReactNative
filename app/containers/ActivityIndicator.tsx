import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps, StyleSheet } from 'react-native';

import { useTheme } from '../theme';
import { themes } from '../lib/constants';

interface IActivityIndicator extends ActivityIndicatorProps {
	absolute?: boolean;
}

const styles = StyleSheet.create({
	indicator: {
		padding: 16,
		flex: 1
	},
	absolute: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const RCActivityIndicator = ({ absolute, ...props }: IActivityIndicator): React.ReactElement => {
	const { theme } = useTheme();
	return (
		<ActivityIndicator
			style={[styles.indicator, absolute && styles.absolute]}
			color={themes[theme].fontSecondaryInfo}
			{...props}
		/>
	);
};

export default RCActivityIndicator;

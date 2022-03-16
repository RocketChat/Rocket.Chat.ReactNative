import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';

import { themes } from '../constants/colors';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	view: {
		flex: 1
	}
});

interface ISafeAreaView extends ViewProps {
	vertical?: boolean;
	children: React.ReactNode;
}

const SafeAreaView = React.memo(({ style, children, vertical = true, ...props }: ISafeAreaView) => {
	const { theme } = useTheme();
	return (
		<SafeAreaContext
			style={[styles.view, { backgroundColor: themes[theme].auxiliaryBackground }, style]}
			edges={vertical ? ['right', 'left'] : undefined}
			{...props}>
			{children}
		</SafeAreaContext>
	);
});

export default SafeAreaView;

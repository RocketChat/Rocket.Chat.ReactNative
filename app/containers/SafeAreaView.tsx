import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';

import { themes } from '../constants/colors';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
	view: {
		flex: 1
	}
});

interface ISafeAreaView {
	testID?: string;
	theme?: string;
	vertical?: boolean;
	style?: object;
	children: React.ReactNode;
}

const SafeAreaView = React.memo(({ style, children, testID, theme, vertical = true, ...props }: ISafeAreaView) => (
	<SafeAreaContext
		style={[styles.view, { backgroundColor: themes[theme!].auxiliaryBackground }, style]}
		edges={vertical ? ['right', 'left'] : undefined}
		testID={testID}
		{...props}>
		{children}
	</SafeAreaContext>
));

export default withTheme(SafeAreaView);

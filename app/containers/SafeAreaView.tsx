import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';

import { themes } from '../lib/constants';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	view: {
		flex: 1
	}
});

type SupportedChildren = React.ReactElement | React.ReactElement[] | null;
type TSafeAreaViewChildren = SupportedChildren | SupportedChildren[];

interface ISafeAreaView extends ViewProps {
	vertical?: boolean;
	children: TSafeAreaViewChildren;
}

const SafeAreaView = React.memo(({ style, children, vertical = true, ...props }: ISafeAreaView) => {
	const { theme } = useTheme();
	return (
		<SafeAreaContext
			style={[styles.view, { backgroundColor: themes[theme].surfaceHover }, style]}
			edges={vertical ? ['right', 'left'] : undefined}
			{...props}>
			{children}
		</SafeAreaContext>
	);
});

export default SafeAreaView;

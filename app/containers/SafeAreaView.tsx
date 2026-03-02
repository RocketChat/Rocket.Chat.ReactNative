import { StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import { memo, type ReactElement } from 'react';

import { themes } from '../lib/constants/colors';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	view: {
		flex: 1
	}
});

type SupportedChildren = ReactElement | ReactElement[] | null;
type TSafeAreaViewChildren = SupportedChildren | SupportedChildren[];

interface ISafeAreaView extends ViewProps {
	vertical?: boolean;
	children: TSafeAreaViewChildren;
}

const SafeAreaView = ({ style, children, vertical = true, ...props }: ISafeAreaView) => {
	const { theme } = useTheme();
	return (
		<SafeAreaContext
			style={[styles.view, { backgroundColor: themes[theme].surfaceHover }, style]}
			edges={vertical ? ['right', 'left'] : undefined}
			{...props}>
			{children}
		</SafeAreaContext>
	);
};

export default memo(SafeAreaView);

import { memo, type ReactElement } from 'react';
import { type ViewProps } from 'react-native';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

const styles = StyleSheet.create(theme => ({
	view: {
		flex: 1,
		backgroundColor: theme.colors.surfaceHover
	}
}));

type SupportedChildren = ReactElement | ReactElement[] | null;
type TSafeAreaViewChildren = SupportedChildren | SupportedChildren[];

interface ISafeAreaView extends ViewProps {
	vertical?: boolean;
	children: TSafeAreaViewChildren;
}

const SafeAreaView = memo(({ style, children, vertical = true, ...props }: ISafeAreaView) => (
	<SafeAreaContext style={[styles.view, style]} edges={vertical ? ['right', 'left'] : undefined} {...props}>
		{children}
	</SafeAreaContext>
));

export default SafeAreaView;

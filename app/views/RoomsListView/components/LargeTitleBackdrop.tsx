import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';

const styles = StyleSheet.create({
	backdrop: {
		position: 'absolute',
		bottom: '100%',
		left: 0,
		right: 0
	}
});

const LargeTitleBackdrop = () => {
	const { colors } = useTheme();
	const { height } = useWindowDimensions();

	if (!hasNativeHeaderBar) {
		return null;
	}

	return <View pointerEvents='none' style={[styles.backdrop, { height, backgroundColor: colors.surfaceNeutral }]} />;
};

export default LargeTitleBackdrop;

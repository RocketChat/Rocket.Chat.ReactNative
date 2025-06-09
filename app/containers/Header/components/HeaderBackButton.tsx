import { HeaderBackButtonProps, HeaderBackButton as RNHeaderBackButton } from '@react-navigation/elements';
import { Platform, StyleSheet } from 'react-native';

import { useTheme } from '../../../theme';

const styles = StyleSheet.create({
	container: {
		...Platform.select({
			ios: {
				minWidth: 34,
				marginLeft: -6
			},
			android: {
				marginHorizontal: 0,
				marginLeft: -3
			}
		})
	}
});

export const HeaderBackButton = ({ ...props }: HeaderBackButtonProps) => {
	const { colors } = useTheme();

	return <RNHeaderBackButton tintColor={colors.fontDefault} style={styles.container} testID='header-back' {...props} />;
};

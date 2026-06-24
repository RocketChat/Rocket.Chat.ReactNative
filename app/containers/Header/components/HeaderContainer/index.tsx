import { memo } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

interface IHeaderContainer extends ViewProps {
	addExtraNotchPadding?: boolean;
	isMasterDetail?: boolean;
	customLeftIcon?: boolean;
	customRightIcon?: boolean;
}

const HeaderContainer = memo(({ isMasterDetail = false, customRightIcon, customLeftIcon, children }: IHeaderContainer) => {
	'use memo';

	const insets = useSafeAreaInsets();
	const paddingTop = 4;
	const paddingBottom = 4;
	const paddingRight = isMasterDetail || !customRightIcon ? 4 : 16;

	return (
		<View
			style={[
				styles.container,
				{
					paddingBottom,
					paddingTop,
					paddingRight: paddingRight + insets.right,
					paddingLeft: insets.left + (customLeftIcon ? 10 : 4),
					gap: isMasterDetail ? 4 : 12
				}
			]}>
			{children}
		</View>
	);
});

const styles = StyleSheet.create(theme => ({
	container: {
		alignItems: 'center',
		flexDirection: 'row',
		backgroundColor: theme.colors.surfaceNeutral,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: theme.colors.strokeLight
	}
}));

export default HeaderContainer;

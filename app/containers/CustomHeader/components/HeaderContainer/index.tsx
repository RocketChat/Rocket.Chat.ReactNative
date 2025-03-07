import React from 'react';
import { useWindowDimensions, View, ViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../../theme';

interface IHeaderContainer extends ViewProps {
	addExtraNotchPadding?: boolean;
	isMasterDetail?: boolean;
	customLeftIcon?: boolean;
	customRightIcon?: boolean;
}

const HeaderContainer = ({
	addExtraNotchPadding,
	isMasterDetail,
	customRightIcon,
	customLeftIcon,
	onLayout,
	children
}: IHeaderContainer) => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { height, width } = useWindowDimensions();
	const isPortrait = height > width;
	const paddingVertical = isPortrait ? 4 : 4;
	const statusBarPadding = addExtraNotchPadding ? insets.top : 0;
	const paddingRight = isMasterDetail || !customRightIcon ? 4 : 16;

	return (
		<View
			onLayout={onLayout}
			children={children}
			style={{
				alignItems: 'center',
				flexDirection: 'row',
				paddingBottom: paddingVertical,
				paddingTop: statusBarPadding + paddingVertical,
				paddingRight: paddingRight + insets.right,
				paddingLeft: insets.left + (customLeftIcon ? 16 : 4),
				gap: isMasterDetail ? 4 : 16,
				backgroundColor: colors.surfaceNeutral,
				borderWidth: StyleSheet.hairlineWidth,
				borderColor: colors.strokeLight
			}}
		/>
	);
};

export default HeaderContainer;

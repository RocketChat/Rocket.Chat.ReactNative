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
	const paddingTop = isPortrait && !isMasterDetail ? 0 : 4;
	const paddingBottom = 4;
	const statusBarPadding = addExtraNotchPadding ? insets.top : 0;
	const paddingRight = isMasterDetail || !customRightIcon ? 4 : 16;

	return (
		<View
			onLayout={onLayout}
			children={children}
			style={{
				alignItems: 'center',
				flexDirection: 'row',
				paddingBottom,
				paddingTop: statusBarPadding + paddingTop,
				paddingRight: paddingRight + insets.right,
				paddingLeft: insets.left + (customLeftIcon ? 10 : 4),
				gap: isMasterDetail ? 4 : 12,
				backgroundColor: colors.surfaceNeutral,
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: colors.strokeLight
			}}
		/>
	);
};

export default HeaderContainer;

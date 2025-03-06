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

const HeaderContainer = (props: IHeaderContainer) => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { height, width } = useWindowDimensions();
	const isPortrait = height > width;
	const paddingBottom = isPortrait ? 12 : 4;
	const statusBarPadding = props.addExtraNotchPadding ? insets.top : 0;
	const paddingRight = props.isMasterDetail || !props.customRightIcon ? 4 : 16;

	return (
		<View
			{...props}
			style={{
				alignItems: 'center',
				flexDirection: 'row',
				paddingBottom,
				paddingTop: statusBarPadding + paddingBottom,
				paddingRight,
				paddingLeft: props.customLeftIcon ? 16 : 4,
				gap: props.isMasterDetail ? 4 : 16,
				backgroundColor: colors.surfaceNeutral,
				borderWidth: StyleSheet.hairlineWidth,
				borderColor: colors.strokeLight
			}}
		/>
	);
};

export default HeaderContainer;

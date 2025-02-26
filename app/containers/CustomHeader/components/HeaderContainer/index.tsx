import React from 'react';
import { useWindowDimensions, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../../theme';

interface IHeaderContainer extends ViewProps {
	addExtraNotchPadding?: boolean;
}

const HeaderContainer = (props: IHeaderContainer) => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { height, width } = useWindowDimensions();
	const isPortrait = height > width;
	const paddingVertical = isPortrait ? 12 : 4;
	const statusBarPadding = props.addExtraNotchPadding ? insets.top : 0;

	return (
		<View
			{...props}
			style={{
				alignItems: 'center',
				flexDirection: 'row',
				paddingVertical,
				paddingTop: statusBarPadding + paddingVertical,
				paddingRight: 16,
				gap: 16,
				backgroundColor: colors.surfaceNeutral
			}}
		/>
	);
};

export default HeaderContainer;

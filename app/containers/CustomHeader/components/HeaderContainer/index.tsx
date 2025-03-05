import React from 'react';
import { useWindowDimensions, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../../theme';

interface IHeaderContainer extends ViewProps {
	addExtraNotchadding?: boolean;
}

const HeaderContainer = (props: IHeaderContainer) => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { height, width } = useWindowDimensions();
	const isPortrait = height > width;
	const paddingBottom = isPortrait ? 12 : 4;
	const statusBarPadding = props.addExtraNotchadding ? insets.top : 0;

	return (
		<View
			{...props}
			style={{
				alignItems: 'center',
				flexDirection: 'row',
				paddingBottom,
				paddingTop: statusBarPadding + paddingBottom,
				paddingHorizontal: 16,
				gap: 16,
				backgroundColor: colors.surfaceNeutral
			}}
		/>
	);
};

export default HeaderContainer;

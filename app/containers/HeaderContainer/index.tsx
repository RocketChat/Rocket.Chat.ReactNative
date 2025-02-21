import React from 'react';
import { useWindowDimensions, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';

interface IHeaderContainer extends ViewProps {
	isMasterDetail?: boolean;
}

const HeaderContainer = (props: IHeaderContainer) => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const { height, width } = useWindowDimensions();

	const isPortrait = height > width;
	const paddingVertical = isPortrait ? 12 : 4;

	return (
		<View
			{...props}
			style={{
				flexDirection: 'row',
				paddingVertical,
				paddingTop: insets.top + paddingVertical,
				paddingHorizontal: 16,
				gap: props.isMasterDetail ? 16 : 0,
				backgroundColor: colors.surfaceNeutral
			}}
		/>
	);
};

export default HeaderContainer;

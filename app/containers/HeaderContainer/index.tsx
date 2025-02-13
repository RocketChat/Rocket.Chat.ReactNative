import React from 'react';
import { View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';

interface IHeaderContainer extends ViewProps {}

const HeaderContainer = (props: IHeaderContainer) => {
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	return (
		<View
			{...props}
			style={{
				flexDirection: 'row',
				paddingVertical: 14,
				paddingTop: insets.top,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: colors.surfaceNeutral
			}}
		/>
	);
};

export default HeaderContainer;

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { themes } from '../../constants/colors';
import { themedHeader } from '../../utils/navigation';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import { withTheme } from '../../theme';

// Get from https://github.com/react-navigation/react-navigation/blob/master/packages/stack/src/views/Header/HeaderSegment.tsx#L69
export const headerHeight = isIOS ? 44 : 56;

export const getHeaderHeight = (isLandscape: boolean) => {
	if (isIOS) {
		if (isLandscape && !isTablet) {
			return 32;
		}
		return 44;
	}
	return 56;
};

interface IHeaderTitlePosition {
	insets: {
		left: number;
		right: number;
	};
	numIconsRight: number;
}

export const getHeaderTitlePosition = ({ insets, numIconsRight }: IHeaderTitlePosition) => ({
	left: insets.left + 60,
	right: insets.right + Math.max(45 * numIconsRight, 15)
});

const styles = StyleSheet.create({
	container: {
		height: headerHeight,
		flexDirection: 'row',
		justifyContent: 'center',
		elevation: 4
	}
});

interface IHeader {
	theme: string;
	headerLeft(): void;
	headerTitle(): void;
	headerRight(): void;
}

const Header = ({ theme, headerLeft, headerTitle, headerRight }: IHeader) => (
	<SafeAreaView style={{ backgroundColor: themes[theme].headerBackground }} edges={['top', 'left', 'right']}>
		<View style={[styles.container, { ...themedHeader(theme).headerStyle }]}>
			{headerLeft ? headerLeft() : null}
			{headerTitle ? headerTitle() : null}
			{headerRight ? headerRight() : null}
		</View>
	</SafeAreaView>
);

export default withTheme(Header);

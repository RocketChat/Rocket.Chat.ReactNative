import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { themes } from '../../lib/constants';
import { themedHeader } from '../../utils/navigation';
import { isIOS, isTablet } from '../../utils/deviceInfo';
import { useTheme } from '../../theme';

export const headerHeight = isIOS ? 50 : 56;

export const getHeaderHeight = (isLandscape: boolean): number => {
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

export const getHeaderTitlePosition = ({
	insets,
	numIconsRight
}: IHeaderTitlePosition): {
	left: number;
	right: number;
} => ({
	left: insets.left,
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
	headerLeft: () => React.ReactElement | null;
	headerTitle: () => React.ReactElement;
	headerRight: () => React.ReactElement | null;
}

const Header = ({ headerLeft, headerTitle, headerRight }: IHeader): React.ReactElement => {
	const { theme } = useTheme();
	return (
		<SafeAreaView style={{ backgroundColor: themes[theme].headerBackground }} edges={['top', 'left', 'right']}>
			<View style={[styles.container, { ...themedHeader(theme).headerStyle }]}>
				{headerLeft ? headerLeft() : null}
				{headerTitle ? headerTitle() : null}
				{headerRight ? headerRight() : null}
			</View>
		</SafeAreaView>
	);
};

export default Header;

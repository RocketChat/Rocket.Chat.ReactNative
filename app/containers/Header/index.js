import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { themes } from '../../constants/colors';
import { themedHeader } from '../../utils/navigation';
import { isIOS } from '../../utils/deviceInfo';

// Get from https://github.com/react-navigation/react-navigation/blob/master/packages/stack/src/views/Header/HeaderSegment.tsx#L69
export const headerHeight = isIOS ? 44 : 56;

const styles = StyleSheet.create({
	container: {
		height: headerHeight,
		flexDirection: 'row',
		justifyContent: 'center',
		elevation: 4
	}
});

const Header = ({
	theme, headerLeft, headerTitle, headerRight
}) => (
	<SafeAreaView style={{ backgroundColor: themes[theme].headerBackground }} edges={['top', 'left', 'right']}>
		<View style={[styles.container, { ...themedHeader(theme).headerStyle }]}>
			{headerLeft ? headerLeft() : null}
			{headerTitle ? headerTitle() : null}
			{headerRight ? headerRight() : null}
		</View>
	</SafeAreaView>
);

Header.propTypes = {
	theme: PropTypes.string,
	headerLeft: PropTypes.element,
	headerTitle: PropTypes.element,
	headerRight: PropTypes.element
};

export default Header;

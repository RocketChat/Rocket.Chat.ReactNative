import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { themes } from '../../constants/colors';
import { themedHeader } from '../../utils/navigation';
import { isIOS } from '../../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		height: isIOS ? 44 : 56,
		flexDirection: 'row',
		justifyContent: 'center',
		elevation: 4
	}
});

// TODO: remove default light
const Header = ({
	theme = 'light', headerLeft, headerTitle, headerRight
}) => (
	<SafeAreaView style={{ backgroundColor: themes[theme].headerBackground }}>
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

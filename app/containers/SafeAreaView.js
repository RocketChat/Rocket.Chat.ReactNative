import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
	view: {
		flex: 1
	}
});

const SafeAreaView = React.memo(({
	style, children, testID, theme, vertical = true, ...props
}) => (
	<SafeAreaContext
		style={[styles.view, { backgroundColor: themes[theme].auxiliaryBackground }, style]}
		edges={vertical ? ['right', 'left'] : undefined}
		testID={testID}
		{...props}
	>
		{children}
	</SafeAreaContext>
));

SafeAreaView.propTypes = {
	testID: PropTypes.string,
	theme: PropTypes.string,
	vertical: PropTypes.bool,
	style: PropTypes.object,
	children: PropTypes.element
};

export default withTheme(SafeAreaView);

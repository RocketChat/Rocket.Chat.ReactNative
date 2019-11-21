import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 56,
		paddingHorizontal: 15
	},
	disabled: {
		opacity: 0.3
	},
	textContainer: {
		flex: 1,
		justifyContent: 'center'
	},
	title: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	subtitle: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

const Content = React.memo(({
	title, subtitle, disabled, testID, right, theme
}) => (
	<View style={[styles.container, disabled && styles.disabled]} testID={testID}>
		<View style={styles.textContainer}>
			<Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text>
			{subtitle
				? <Text style={[styles.subtitle, { color: themes[theme].bodyText }]}>{subtitle}</Text>
				: null
			}
		</View>
		{right ? right() : null}
	</View>
));

const Button = React.memo(({
	onPress, ...props
}) => (
	<RectButton
		onPress={onPress}
		underlayColor={themes[props.theme].bannerBackground}
		style={{ backgroundColor: themes[props.theme].focusedBackground }}
		activeOpacity={1}
		enabled={!props.disabled}
	>
		<Content {...props} />
	</RectButton>
));

const Item = React.memo(({ ...props }) => {
	if (props.onPress) {
		return <Button {...props} />;
	}
	return (
		<View style={{ backgroundColor: themes[props.theme].focusedBackground }}>
			<Content {...props} />
		</View>
	);
});

Item.propTypes = {
	onPress: PropTypes.func,
	theme: PropTypes.string
};

Content.propTypes = {
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
	right: PropTypes.func,
	disabled: PropTypes.bool,
	testID: PropTypes.string,
	theme: PropTypes.string
};

Button.propTypes = {
	onPress: PropTypes.func,
	disabled: PropTypes.bool,
	theme: PropTypes.string
};

Button.defaultProps = {
	disabled: false
};

export default Item;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../utils/touch';
import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 46,
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
	title, subtitle, disabled, testID, left, right, color, theme
}) => (
	<View style={[styles.container, disabled && styles.disabled]} testID={testID}>
		{left ? left() : null}
		<View style={styles.textContainer}>
			<Text style={[styles.title, { color: color || themes[theme].titleText }]}>{title}</Text>
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
	<Touch
		onPress={() => onPress(props.title)}
		style={{ backgroundColor: themes[props.theme].backgroundColor }}
		enabled={!props.disabled}
		theme={props.theme}
	>
		<Content {...props} />
	</Touch>
));

const Item = React.memo(({ ...props }) => {
	if (props.onPress) {
		return <Button {...props} />;
	}
	return (
		<View style={{ backgroundColor: themes[props.theme].backgroundColor }}>
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
	left: PropTypes.func,
	right: PropTypes.func,
	disabled: PropTypes.bool,
	testID: PropTypes.string,
	theme: PropTypes.string,
	color: PropTypes.string
};

Button.propTypes = {
	title: PropTypes.string,
	onPress: PropTypes.func,
	disabled: PropTypes.bool,
	theme: PropTypes.string
};

Button.defaultProps = {
	disabled: false
};

export default Item;

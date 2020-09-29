import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../utils/touch';
import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';
import { withTheme } from '../../theme';
import I18n from '../../i18n';
import { Icon } from '.';
import { paddingHorizontal } from './constants';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 46,
		paddingHorizontal
	},
	leftContainer: {
		paddingRight: paddingHorizontal
	},
	rightContainer: {
		paddingLeft: paddingHorizontal
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
	title, subtitle, disabled, testID, left, right, color, theme, translateTitle, translateSubtitle, showActionIndicator
}) => (
	<View style={[styles.container, disabled && styles.disabled]} testID={testID}>
		{left
			? (
				<View style={styles.leftContainer}>
					{left()}
				</View>
			)
			: null}
		<View style={styles.textContainer}>
			<Text style={[styles.title, { color: color || themes[theme].titleText }]} numberOfLines={1}>{translateTitle ? I18n.t(title) : title}</Text>
			{subtitle
				? <Text style={[styles.subtitle, { color: themes[theme].bodyText }]} numberOfLines={1}>{translateSubtitle ? I18n.t(subtitle) : subtitle}</Text>
				: null
			}
		</View>
		{right || showActionIndicator
			? (
				<View style={styles.rightContainer}>
					{right ? right() : null}
					{showActionIndicator ? <Icon name='chevron-right' /> : null}
				</View>
			)
			: null}
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

const ListItem = React.memo(({ ...props }) => {
	if (props.onPress) {
		return <Button {...props} />;
	}
	return (
		<View style={{ backgroundColor: themes[props.theme].backgroundColor }}>
			<Content {...props} />
		</View>
	);
});

ListItem.propTypes = {
	onPress: PropTypes.func,
	theme: PropTypes.string
};

ListItem.displayName = 'List.Item';

Content.propTypes = {
	title: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
	left: PropTypes.func,
	right: PropTypes.func,
	disabled: PropTypes.bool,
	testID: PropTypes.string,
	theme: PropTypes.string,
	color: PropTypes.string,
	translateTitle: PropTypes.bool,
	translateSubtitle: PropTypes.bool,
	showActionIndicator: PropTypes.bool
};

Content.defaultProps = {
	translateTitle: true,
	translateSubtitle: true,
	showActionIndicator: false
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

export default withTheme(ListItem);

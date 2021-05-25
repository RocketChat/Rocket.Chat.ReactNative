import React from 'react';
import {
	View, Text, StyleSheet, I18nManager
} from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../utils/touch';
import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';
import { withTheme } from '../../theme';
import I18n from '../../i18n';
import { Icon } from '.';
import { BASE_HEIGHT, ICON_SIZE, PADDING_HORIZONTAL } from './constants';
import { withDimensions } from '../../dimensions';
import { CustomIcon } from '../../lib/Icons';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: PADDING_HORIZONTAL
	},
	leftContainer: {
		paddingRight: PADDING_HORIZONTAL
	},
	rightContainer: {
		paddingLeft: PADDING_HORIZONTAL
	},
	disabled: {
		opacity: 0.3
	},
	textContainer: {
		flex: 1,
		justifyContent: 'center'
	},
	textAlertContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	alertIcon: {
		paddingLeft: 4
	},
	title: {
		flexShrink: 1,
		fontSize: 16,
		...sharedStyles.textRegular
	},
	subtitle: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	actionIndicator: {
		...I18nManager.isRTL
			? { transform: [{ rotate: '180deg' }] }
			: {}
	}
});

const Content = React.memo(({
	title, subtitle, disabled, testID, left, right, color, theme, translateTitle, translateSubtitle, showActionIndicator, fontScale, alert
}) => (
	<View style={[styles.container, disabled && styles.disabled, { height: BASE_HEIGHT * fontScale }]} testID={testID}>
		{left
			? (
				<View style={styles.leftContainer}>
					{left()}
				</View>
			)
			: null}
		<View style={styles.textContainer}>
			<View style={styles.textAlertContainer}>
				<Text style={[styles.title, { color: color || themes[theme].titleText }]} numberOfLines={1}>{translateTitle ? I18n.t(title) : title}</Text>
				{alert ? (
					<CustomIcon style={[styles.alertIcon, { color: themes[theme].dangerColor }]} size={ICON_SIZE} name='info' />
				) : null}
			</View>
			{subtitle
				? <Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>{translateSubtitle ? I18n.t(subtitle) : subtitle}</Text>
				: null
			}
		</View>
		{right || showActionIndicator
			? (
				<View style={styles.rightContainer}>
					{right ? right() : null}
					{showActionIndicator ? <Icon name='chevron-right' style={styles.actionIndicator} /> : null}
				</View>
			)
			: null}
	</View>
));

const Button = React.memo(({
	onPress, backgroundColor, underlayColor, ...props
}) => (
	<Touch
		onPress={() => onPress(props.title)}
		style={{ backgroundColor: backgroundColor || themes[props.theme].backgroundColor }}
		underlayColor={underlayColor}
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
		<View style={{ backgroundColor: props.backgroundColor || themes[props.theme].backgroundColor }}>
			<Content {...props} />
		</View>
	);
});

ListItem.propTypes = {
	onPress: PropTypes.func,
	theme: PropTypes.string,
	backgroundColor: PropTypes.string
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
	showActionIndicator: PropTypes.bool,
	fontScale: PropTypes.number,
	alert: PropTypes.bool
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
	theme: PropTypes.string,
	backgroundColor: PropTypes.string,
	underlayColor: PropTypes.string
};

Button.defaultProps = {
	disabled: false
};

export default withTheme(withDimensions(ListItem));

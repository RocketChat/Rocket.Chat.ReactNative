import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import Touch from '../../utils/touch';
import { themes } from '../../lib/constants';
import sharedStyles from '../../views/Styles';
import { TSupportedThemes, useTheme } from '../../theme';
import I18n from '../../i18n';
import { Icon } from '.';
import { BASE_HEIGHT, ICON_SIZE, PADDING_HORIZONTAL } from './constants';
import { useDimensions } from '../../dimensions';
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
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	}
});

interface IListItemContent {
	title?: string;
	subtitle?: string;
	left?: () => JSX.Element | null;
	right?: () => JSX.Element | null;
	disabled?: boolean;
	theme: TSupportedThemes;
	testID?: string;
	color?: string;
	translateTitle?: boolean;
	translateSubtitle?: boolean;
	showActionIndicator?: boolean;
	alert?: boolean;
}

const Content = React.memo(
	({
		title,
		subtitle,
		disabled,
		testID,
		left,
		right,
		color,
		alert,
		translateTitle = true,
		translateSubtitle = true,
		showActionIndicator = false,
		theme
	}: IListItemContent) => {
		const { fontScale } = useDimensions();

		return (
			<View style={[styles.container, disabled && styles.disabled, { height: BASE_HEIGHT * fontScale }]} testID={testID}>
				{left ? <View style={styles.leftContainer}>{left()}</View> : null}
				<View style={styles.textContainer}>
					<View style={styles.textAlertContainer}>
						<Text style={[styles.title, { color: color || themes[theme].titleText }]} numberOfLines={1}>
							{translateTitle && title ? I18n.t(title) : title}
						</Text>
						{alert ? (
							<CustomIcon style={[styles.alertIcon, { color: themes[theme].dangerColor }]} size={ICON_SIZE} name='info' />
						) : null}
					</View>
					{subtitle ? (
						<Text style={[styles.subtitle, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
							{translateSubtitle ? I18n.t(subtitle) : subtitle}
						</Text>
					) : null}
				</View>
				{right || showActionIndicator ? (
					<View style={styles.rightContainer}>
						{right ? right() : null}
						{showActionIndicator ? <Icon name='chevron-right' style={styles.actionIndicator} /> : null}
					</View>
				) : null}
			</View>
		);
	}
);

interface IListButtonPress extends IListItemButton {
	onPress: Function;
}

interface IListItemButton {
	title?: string;
	disabled?: boolean;
	theme: TSupportedThemes;
	backgroundColor?: string;
	underlayColor?: string;
}

const Button = React.memo(({ onPress, backgroundColor, underlayColor, ...props }: IListButtonPress) => (
	<Touch
		onPress={() => onPress(props.title)}
		style={{ backgroundColor: backgroundColor || themes[props.theme].backgroundColor }}
		underlayColor={underlayColor}
		enabled={!props.disabled}
		theme={props.theme}>
		<Content {...props} />
	</Touch>
));

interface IListItem extends Omit<IListItemContent, 'theme'>, Omit<IListItemButton, 'theme'> {
	backgroundColor?: string;
	onPress?: Function;
}

const ListItem = React.memo(({ ...props }: IListItem) => {
	const { theme } = useTheme();

	if (props.onPress) {
		const { onPress } = props;
		return <Button {...props} theme={theme} onPress={onPress} />;
	}
	return (
		<View style={{ backgroundColor: props.backgroundColor || themes[theme].backgroundColor }}>
			<Content {...props} theme={theme} />
		</View>
	);
});

ListItem.displayName = 'List.Item';

export default ListItem;

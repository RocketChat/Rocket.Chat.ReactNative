import React, { useMemo } from 'react';
import { I18nManager, StyleProp, StyleSheet, Text, TextStyle, View, AccessibilityRole } from 'react-native';

import Touch from '../Touch';
import { themes } from '../../lib/constants';
import sharedStyles from '../../views/Styles';
import { TSupportedThemes, useTheme } from '../../theme';
import I18n from '../../i18n';
import { Icon } from '.';
import { BASE_HEIGHT, ICON_SIZE, PADDING_HORIZONTAL } from './constants';
import { useDimensions } from '../../dimensions';
import { CustomIcon } from '../CustomIcon';

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
		...sharedStyles.textMedium
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
	heightContainer?: number;
	styleTitle?: StyleProp<TextStyle>;
	additionalAcessibilityLabel?: string | boolean;
	accessibilityRole?: AccessibilityRole;
	additionalAcessibilityLabelCheck?: boolean;
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
		theme,
		heightContainer,
		styleTitle,
		additionalAcessibilityLabel,
		additionalAcessibilityLabelCheck,
		accessibilityRole
	}: IListItemContent) => {
		const { fontScale } = useDimensions();

		const handleAcessibilityLabel = useMemo(() => {
			let label = '';
			if (title) {
				label = translateTitle ? I18n.t(title) : title;
			}
			if (subtitle) {
				label = translateSubtitle ? `${label} ${I18n.t(subtitle)}` : `${label} ${subtitle}`;
			}
			if (typeof additionalAcessibilityLabel === 'string') {
				label = `${label} ${additionalAcessibilityLabel}`;
			}
			if (typeof additionalAcessibilityLabel === 'boolean') {
				if (additionalAcessibilityLabelCheck) {
					label = `${label} ${additionalAcessibilityLabel ? I18n.t('Checked') : I18n.t('Unchecked')}`;
				} else {
					label = `${label} ${additionalAcessibilityLabel ? I18n.t('Enabled') : I18n.t('Disabled')}`;
				}
			}
			return label;
		}, [title, subtitle, translateTitle, translateSubtitle, additionalAcessibilityLabel, additionalAcessibilityLabelCheck]);

		return (
			<View
				style={[styles.container, disabled && styles.disabled, { height: (heightContainer || BASE_HEIGHT) * fontScale }]}
				testID={testID}
				accessible
				accessibilityLabel={handleAcessibilityLabel}
				accessibilityRole={accessibilityRole ?? 'button'}>
				{left ? <View style={styles.leftContainer}>{left()}</View> : null}
				<View style={styles.textContainer}>
					<View style={styles.textAlertContainer}>
						<Text style={[styles.title, styleTitle, { color: color || themes[theme].fontDefault }]} numberOfLines={1}>
							{translateTitle && title ? I18n.t(title) : title}
						</Text>
						{alert ? (
							<CustomIcon
								name='info'
								size={ICON_SIZE}
								color={themes[theme].buttonBackgroundDangerDefault}
								style={styles.alertIcon}
							/>
						) : null}
					</View>
					{subtitle ? (
						<Text style={[styles.subtitle, { color: themes[theme].fontSecondaryInfo }]} numberOfLines={1}>
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
		style={{ backgroundColor: backgroundColor || themes[props.theme].surfaceRoom }}
		underlayColor={underlayColor}
		enabled={!props.disabled}>
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
		<View style={{ backgroundColor: props.backgroundColor || themes[theme].surfaceRoom }}>
			<Content {...props} theme={theme} />
		</View>
	);
});

ListItem.displayName = 'List.Item';

export default ListItem;

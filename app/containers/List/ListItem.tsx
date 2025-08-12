import React, { useMemo } from 'react';
import { I18nManager, StyleProp, StyleSheet, Text, TextStyle, View, AccessibilityRole, ViewStyle } from 'react-native';

import Touch from '../Touch';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import i18n from '../../i18n';
import { Icon } from '.';
import { BASE_HEIGHT, ICON_SIZE, PADDING_HORIZONTAL } from './constants';
import { CustomIcon } from '../CustomIcon';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

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
		flex: 1,
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

interface IListTitle extends Pick<IListItemContent, 'title' | 'color' | 'translateTitle' | 'styleTitle'> {}

const ListTitle = ({ title, color, styleTitle, translateTitle }: IListTitle) => {
	const { colors } = useTheme();
	switch (typeof title) {
		case 'string':
			return (
				<Text style={[styles.title, styleTitle, { color: color || colors.fontDefault }]}>
					{translateTitle && title ? i18n.t(title) : title}
				</Text>
			);
		case 'function':
			return title();

		default:
			return null;
	}
};

interface IListItemContent {
	accessibilityLabel?: string;
	title: string | (() => JSX.Element | null);
	subtitle?: string;
	left?: () => JSX.Element | null;
	right?: () => JSX.Element | null;
	disabled?: boolean;
	testID?: string;
	color?: string;
	translateTitle?: boolean;
	translateSubtitle?: boolean;
	showActionIndicator?: boolean;
	alert?: boolean;
	heightContainer?: number;
	rightContainerStyle?: StyleProp<ViewStyle>;
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
		heightContainer,
		rightContainerStyle = {},
		styleTitle,
		additionalAcessibilityLabel,
		additionalAcessibilityLabelCheck,
		accessibilityRole,
		accessibilityLabel
	}: IListItemContent) => {
		const { fontScale } = useResponsiveLayout();
		const { colors } = useTheme();

		const handleAcessibilityLabel = useMemo(() => {
			let label = '';
			if (accessibilityLabel) {
				return accessibilityLabel;
			}
			if (typeof title === 'string') {
				label = translateTitle ? i18n.t(title) : title;
			}
			if (subtitle) {
				label = translateSubtitle ? `${label} ${i18n.t(subtitle)}` : `${label} ${subtitle}`;
			}
			if (typeof additionalAcessibilityLabel === 'string') {
				label = `${label} ${additionalAcessibilityLabel}`;
			}
			if (typeof additionalAcessibilityLabel === 'boolean') {
				if (additionalAcessibilityLabelCheck) {
					label = `${label} ${additionalAcessibilityLabel ? i18n.t('Checked') : i18n.t('Unchecked')}`;
				} else {
					label = `${label} ${additionalAcessibilityLabel ? i18n.t('Enabled') : i18n.t('Disabled')}`;
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
				{title || subtitle ? (
					<View style={styles.textContainer}>
						<View style={styles.textAlertContainer}>
							{title ? <ListTitle title={title} color={color} styleTitle={styleTitle} translateTitle={translateTitle} /> : null}
							{alert ? (
								<CustomIcon name='info' size={ICON_SIZE} color={colors.buttonBackgroundDangerDefault} style={styles.alertIcon} />
							) : null}
						</View>
						{subtitle ? (
							<Text style={[styles.subtitle, { color: colors.fontSecondaryInfo }]} numberOfLines={1}>
								{translateSubtitle ? i18n.t(subtitle) : subtitle}
							</Text>
						) : null}
					</View>
				) : null}
				{right || showActionIndicator ? (
					<View style={[styles.rightContainer, rightContainerStyle]}>
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
	title: string | (() => JSX.Element | null);
	disabled?: boolean;
	backgroundColor?: string;
	underlayColor?: string;
}

const Button = React.memo(({ onPress, backgroundColor, underlayColor, ...props }: IListButtonPress) => {
	const { colors } = useTheme();

	return (
		<Touch
			onPress={() => onPress(props.title)}
			style={{ backgroundColor: backgroundColor || colors.surfaceRoom }}
			underlayColor={underlayColor}
			enabled={!props.disabled}>
			<Content {...props} />
		</Touch>
	);
});

interface IListItem extends Omit<IListItemContent, 'theme'>, Omit<IListItemButton, 'theme'> {
	backgroundColor?: string;
	onPress?: Function;
}

const ListItem = React.memo(({ ...props }: IListItem) => {
	const { colors } = useTheme();

	if (props.onPress) {
		const { onPress } = props;
		return <Button {...props} onPress={onPress} />;
	}
	return (
		<View style={{ backgroundColor: props.backgroundColor || colors.surfaceRoom }}>
			<Content {...props} />
		</View>
	);
});

ListItem.displayName = 'List.Item';

export default ListItem;

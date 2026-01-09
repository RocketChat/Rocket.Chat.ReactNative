import React, { useMemo } from 'react';
import {
	I18nManager,
	type StyleProp,
	StyleSheet,
	Text,
	type TextStyle,
	View,
	type AccessibilityRole,
	type ViewStyle
} from 'react-native';

import Touch from '../Touch';
import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { Icon } from '.';
import { BASE_HEIGHT, ICON_SIZE, PADDING_HORIZONTAL } from './constants';
import { CustomIcon } from '../CustomIcon';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../Toast';

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
		paddingLeft: PADDING_HORIZONTAL,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
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
		...sharedStyles.textMedium
	},
	subtitle: {
		...sharedStyles.textRegular
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	}
});

interface IListTitle extends Pick<IListItemContent, 'title' | 'color' | 'translateTitle' | 'styleTitle' | 'numberOfLines'> {}

const ListTitle = ({ title, color, styleTitle, translateTitle, numberOfLines }: IListTitle) => {
	'use memo';

	const { colors } = useTheme();
	switch (typeof title) {
		case 'string':
			return (
				<Text numberOfLines={numberOfLines} style={[styles.title, styleTitle, { color: color || colors.fontDefault }]}>
					{translateTitle && title ? I18n.t(title) : title}
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
	disabledReason?: string;
	testID?: string;
	color?: string;
	translateTitle?: boolean;
	translateSubtitle?: boolean;
	showActionIndicator?: boolean;
	alert?: boolean;
	heightContainer?: number;
	rightContainerStyle?: StyleProp<ViewStyle>;
	styleTitle?: StyleProp<TextStyle>;
	additionalAccessibilityLabel?: string | boolean;
	accessibilityRole?: AccessibilityRole;
	additionalAccessibilityLabelCheck?: boolean;
	numberOfLines?: number;
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
		additionalAccessibilityLabel,
		additionalAccessibilityLabelCheck,
		accessibilityRole,
		accessibilityLabel,
		numberOfLines
	}: IListItemContent) => {
		'use memo';

		const { fontScale, scaleFontSize } = useResponsiveLayout();
		const { colors } = useTheme();

		const handleAcessibilityLabel = useMemo(() => {
			let label = '';
			if (accessibilityLabel) {
				return accessibilityLabel;
			}
			if (typeof title === 'string') {
				label = translateTitle ? I18n.t(title) : title;
			}
			if (subtitle) {
				label = translateSubtitle ? `${label} ${I18n.t(subtitle)}` : `${label} ${subtitle}`;
			}
			if (typeof additionalAccessibilityLabel === 'string') {
				label = `${label} ${additionalAccessibilityLabel}`;
			}
			if (typeof additionalAccessibilityLabel === 'boolean') {
				if (additionalAccessibilityLabelCheck) {
					label = `${label} ${additionalAccessibilityLabel ? I18n.t('Checked') : I18n.t('Unchecked')}`;
				} else {
					label = `${label} ${additionalAccessibilityLabel ? I18n.t('Enabled') : I18n.t('Disabled')}`;
				}
			}
			return label;
		}, [
			accessibilityLabel,
			title,
			subtitle,
			translateTitle,
			translateSubtitle,
			additionalAccessibilityLabel,
			additionalAccessibilityLabelCheck
		]);

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
							{title ? (
								<ListTitle
									title={title}
									color={color}
									styleTitle={[styleTitle, { fontSize: scaleFontSize(16) }]}
									translateTitle={translateTitle}
									numberOfLines={numberOfLines}
								/>
							) : null}
							{alert ? (
								<CustomIcon name='info' size={ICON_SIZE} color={colors.buttonBackgroundDangerDefault} style={styles.alertIcon} />
							) : null}
						</View>
						{subtitle ? (
							<Text style={[styles.subtitle, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(14) }]} numberOfLines={1}>
								{translateSubtitle ? I18n.t(subtitle) : subtitle}
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
	disabledReason?: string;
	backgroundColor?: string;
	underlayColor?: string;
}

const Button = React.memo(({ onPress, backgroundColor, underlayColor, ...props }: IListButtonPress) => {
	'use memo';

	const { colors } = useTheme();

	const handlePress = () => {
		if (props.disabled && props.disabledReason) {
			EventEmitter.emit(LISTENER, { message: props.disabledReason });
		} else if (!props.disabled) {
			onPress(props.title);
		}
	};

	return (
		<Touch
			onPress={handlePress}
			style={{ backgroundColor: backgroundColor || colors.surfaceRoom }}
			underlayColor={underlayColor}
			enabled={!props.disabled || !!props.disabledReason}>
			<Content {...props} />
		</Touch>
	);
});

export interface IListItem extends Omit<IListItemContent, 'theme'>, Omit<IListItemButton, 'theme'> {
	backgroundColor?: string;
	onPress?: Function;
}

const ListItem = React.memo(({ ...props }: IListItem) => {
	'use memo';

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

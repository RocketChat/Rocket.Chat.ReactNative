import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import EventEmitter from '../../lib/methods/helpers/events';
import I18n from '../../i18n';
import { TActionSheetOptionsItem } from './Provider';
import styles from './styles';
import { LISTENER } from '../Toast';
import Touch from '../Touch';

export interface IActionSheetItem {
	item: TActionSheetOptionsItem;
	hide(): void;
}

export const Item = React.memo(({ item, hide }: IActionSheetItem) => {
	'use memo';

	const enabled = item?.enabled ?? true;
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const onPress = () => {
		if (enabled) {
			hide();
			item?.onPress();
		} else {
			EventEmitter.emit(LISTENER, { message: I18n.t('You_dont_have_permission_to_perform_this_action') });
		}
	};

	let color = colors.fontDefault;
	if (item.danger) {
		color = colors.fontDanger;
	}
	if (!enabled) {
		color = colors.fontDisabled;
	}
	const height = 48 * fontScale;
	const accessibilityLabel = item?.accessibilityLabel || (item?.subtitle ? `${item.title}. ${item.subtitle}` : item.title);

	return (
		<View>
			<Touch
				accessible
				accessibilityLabel={accessibilityLabel}
				accessibilityRole='button'
				onPress={onPress}
				style={[styles.item, { backgroundColor: colors.surfaceLight, height }]}
				testID={item.testID}>
				{item.icon ? <CustomIcon name={item.icon} size={24} color={color} /> : null}
				<View style={styles.titleContainer}>
					<Text numberOfLines={1} style={[styles.title, { color, marginLeft: item.icon ? 16 : 0 }]}>
						{item.title}
					</Text>
					{item?.subtitle ? (
						<Text
							numberOfLines={1}
							style={[styles.subtitle, { color: colors.fontSecondaryInfo, marginLeft: item.icon ? 16 : 0 }]}>
							{item.subtitle}
						</Text>
					) : null}
				</View>
				{item.right ? <View style={styles.rightContainer}>{item.right ? item.right() : null}</View> : null}
			</Touch>
		</View>
	);
});

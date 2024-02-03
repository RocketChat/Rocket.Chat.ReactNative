import React from 'react';
import { Text, View } from 'react-native';

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
	const enabled = item?.enabled ?? true;
	const { colors } = useTheme();
	const onPress = () => {
		if (enabled) {
			hide();
			item?.onPress();
		} else {
			EventEmitter.emit(LISTENER, { message: I18n.t('You_dont_have_permission_to_perform_this_action') });
		}
	};

	let textColor = colors.bodyText;
	if (item.danger) {
		textColor = colors.dangerColor;
	}
	if (!enabled) {
		textColor = colors.fontDisabled;
	}

	return (
		<Touch onPress={onPress} style={[styles.item, { backgroundColor: colors.focusedBackground }]} testID={item.testID}>
			{item.icon ? <CustomIcon name={item.icon} size={20} color={textColor} /> : null}
			<View style={styles.titleContainer}>
				<Text numberOfLines={1} style={[styles.title, { color: textColor, marginLeft: item.icon ? 16 : 0 }]}>
					{item.title}
				</Text>
			</View>
			{item.right ? <View style={styles.rightContainer}>{item.right ? item.right() : null}</View> : null}
		</Touch>
	);
});

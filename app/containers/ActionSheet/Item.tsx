import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../lib/constants';
import { CustomIcon } from '../CustomIcon';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { TActionSheetOptionsItem } from './Provider';
import styles from './styles';

export interface IActionSheetItem {
	item: TActionSheetOptionsItem;
	hide(): void;
}

export const Item = React.memo(({ item, hide }: IActionSheetItem) => {
	const { theme } = useTheme();
	const onPress = () => {
		hide();
		item?.onPress();
	};

	return (
		<Button
			onPress={onPress}
			style={[styles.item, { backgroundColor: themes[theme].focusedBackground }]}
			theme={theme}
			testID={item.testID}
		>
			{item.icon ? (
				<CustomIcon name={item.icon} size={20} color={item.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
			) : null}
			<View style={styles.titleContainer}>
				<Text
					numberOfLines={1}
					style={[
						styles.title,
						{ color: item.danger ? themes[theme].dangerColor : themes[theme].bodyText, marginLeft: item.icon ? 16 : 0 }
					]}
				>
					{item.title}
				</Text>
			</View>
			{item.right ? <View style={styles.rightContainer}>{item.right ? item.right() : null}</View> : null}
		</Button>
	);
});

import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { Button } from './Button';
import styles from './styles';

interface IActionSheetItem {
	item: {
		title: string;
		icon: string;
		danger: boolean;
		testID: string;
		onPress(): void;
		right: Function;
	};
	theme: string;
	hide(): void;
}

export const Item = React.memo(({ item, hide, theme }: IActionSheetItem) => {
	const onPress = () => {
		hide();
		item?.onPress();
	};

	return (
		<Button
			onPress={onPress}
			style={[styles.item, { backgroundColor: themes[theme].focusedBackground }]}
			theme={theme}
			testID={item.testID}>
			<CustomIcon name={item.icon} size={20} color={item.danger ? themes[theme].dangerColor : themes[theme].bodyText} />
			<View style={styles.titleContainer}>
				<Text
					numberOfLines={1}
					style={[styles.title, { color: item.danger ? themes[theme].dangerColor : themes[theme].bodyText }]}>
					{item.title}
				</Text>
			</View>
			{item.right ? <View style={styles.rightContainer}>{item.right ? item.right() : null}</View> : null}
		</Button>
	);
});

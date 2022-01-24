import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { themes } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import sharedStyles from '../../Styles';
import Touch from '../../../utils/touch';
import { TServerHistory } from '../../../definitions/IServerHistory';

const styles = StyleSheet.create({
	container: {
		height: 56,
		paddingHorizontal: 15,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	content: {
		flex: 1,
		flexDirection: 'column'
	},
	server: {
		...sharedStyles.textMedium,
		fontSize: 16
	}
});

interface IItem {
	item: TServerHistory;
	theme: string;
	onPress(url: string): void;
	onDelete(item: TServerHistory): void;
}

const Item = ({ item, theme, onPress, onDelete }: IItem): JSX.Element => (
	<Touch style={styles.container} onPress={() => onPress(item.url)} theme={theme} testID={`server-history-${item.url}`}>
		<View style={styles.content}>
			<Text numberOfLines={1} style={[styles.server, { color: themes[theme].bodyText }]}>
				{item.url}
			</Text>
			<Text numberOfLines={1} style={{ color: themes[theme].auxiliaryText }}>
				{item.username}
			</Text>
		</View>
		<BorderlessButton onPress={() => onDelete(item)} testID={`server-history-delete-${item.url}`}>
			<CustomIcon name='delete' size={24} color={themes[theme].auxiliaryText} />
		</BorderlessButton>
	</Touch>
);

export default Item;

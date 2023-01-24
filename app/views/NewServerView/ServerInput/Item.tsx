import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import { themes } from '../../../lib/constants';
import { CustomIcon } from '../../../containers/CustomIcon';
import sharedStyles from '../../Styles';
import Touch from '../../../containers/Touch';
import { TServerHistoryModel } from '../../../definitions/IServerHistory';
import { TSupportedThemes } from '../../../theme';

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
	item: TServerHistoryModel;
	theme: TSupportedThemes;
	onPress(url: string): void;
	onDelete(item: TServerHistoryModel): void;
}

const Item = ({ item, theme, onPress, onDelete }: IItem): JSX.Element => (
	<Touch style={styles.container} onPress={() => onPress(item.url)} testID={`server-history-${item.url}`}>
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

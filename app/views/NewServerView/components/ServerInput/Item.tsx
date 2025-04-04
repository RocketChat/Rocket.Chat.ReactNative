import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CustomIcon } from '../../../../containers/CustomIcon';
import sharedStyles from '../../../Styles';
import Touch from '../../../../containers/Touch';
import { TServerHistoryModel } from '../../../../definitions/IServerHistory';
import { useTheme } from '../../../../theme';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 8,
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
	onPress(url: string): void;
	onDelete(item: TServerHistoryModel): void;
}

const Item = ({ item, onPress, onDelete }: IItem): JSX.Element => {
	const { colors } = useTheme();
	return (
		<Touch
			style={styles.container}
			onPress={() => onPress(item.url)}
			testID={`server-history-${item.url}`}
			accessible
			accessibilityLabel={`${item.url} ${item.username}`}>
			<View style={styles.content} accessible={false} accessibilityElementsHidden>
				<Text numberOfLines={1} style={[styles.server, { color: colors.fontDefault }]}>
					{item.url}
				</Text>
				<Text numberOfLines={1} style={{ color: colors.fontSecondaryInfo }}>
					{item.username}
				</Text>
			</View>
			<Touch onPress={() => onDelete(item)} testID={`server-history-delete-${item.url}`}>
				<CustomIcon name='delete' size={24} color={colors.fontSecondaryInfo} />
			</Touch>
		</Touch>
	);
};

export default Item;

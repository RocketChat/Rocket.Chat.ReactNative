import React from 'react';
import { Text, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';

import styles, { ROW_HEIGHT } from './styles';
import { useTheme } from '../../../../theme';
import Touchable from './Touchable';
import { TServerHistoryModel } from '../../../../definitions';

export { ROW_HEIGHT };

export interface IServersHistoryItem {
	item: TServerHistoryModel;
	onPress(): void;
	onDeletePress(): void;
}

const defaultLogo = require('../../../../static/images/logo.png');

const ServersHistoryItem = React.memo(({ item, onPress, onDeletePress }: IServersHistoryItem) => {
	const { colors } = useTheme();
	const { width } = Dimensions.get('window');

	return (
		<Touchable onPress={onPress} onDeletePress={onDeletePress} testID={`servers-history-${item.url}`} width={width}>
			<View style={styles.container}>
				<Image source={item.iconURL ? { uri: item.iconURL } : defaultLogo} style={styles.serverIcon} contentFit='contain' />

				<View style={styles.textContainer}>
					<Text numberOfLines={1} style={[styles.title, { color: colors.fontTitlesLabels }]}>
						{item.url}
					</Text>
					<Text numberOfLines={1} style={[styles.subtitle, { color: colors.fontSecondaryInfo }]}>
						{item.username}
					</Text>
				</View>
			</View>
		</Touchable>
	);
});

export default ServersHistoryItem;

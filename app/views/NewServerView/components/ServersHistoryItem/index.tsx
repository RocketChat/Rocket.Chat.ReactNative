import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import styles, { ROW_HEIGHT } from './styles';
import { useTheme } from '../../../../theme';
import { ServerItemTouchable as Touchable } from '../../../../containers/ServerItem';
import { type TServerHistoryModel } from '../../../../definitions';
import I18n from '../../../../i18n';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

export { ROW_HEIGHT };

export interface IServersHistoryItem {
	item: TServerHistoryModel;
	onPress(): void;
	onDeletePress(): void;
}

const defaultLogo = require('../../../../static/images/logo.png');

const ServersHistoryItem = React.memo(({ item, onPress, onDeletePress }: IServersHistoryItem) => {
	const { colors } = useTheme();
	const { width } = useResponsiveLayout();

	const accessibilityLabel = item.username ? `${item.url}, ${item.username}` : item.url;
	const accessibilityHint = I18n.t('Activate_to_select_server_Available_actions_delete');

	return (
		<Touchable
			onPress={onPress}
			onDeletePress={onDeletePress}
			testID={`servers-history-${item.url}`}
			width={width}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}>
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

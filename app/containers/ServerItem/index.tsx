import React from 'react';
import { Text, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';

import Radio from '../Radio';
import styles, { ROW_HEIGHT } from './styles';
import { useTheme } from '../../theme';
import Touchable from './Touchable';
import I18n from '../../i18n';

export { ROW_HEIGHT };
export { default as ServerItemTouchable } from './Touchable';
export type { IServerItemTouchableProps } from './Touchable';

export interface IServerItem {
	item: {
		id: string;
		iconURL: string;
		name: string;
		useRealName?: boolean;
	};
	onPress(): void;
	onDeletePress?(): void;
	hasCheck?: boolean;
}

const defaultLogo = require('../../static/images/logo.png');

const ServerItem = React.memo(({ item, onPress, onDeletePress, hasCheck }: IServerItem) => {
	const { colors } = useTheme();
	const { width } = Dimensions.get('window');

	const serverName = item.name || item.id;
	const accessibilityLabel = `${serverName}, ${item.id}`;
	const accessibilityHint = onDeletePress
		? I18n.t('Activate_to_select_server_Available_actions_delete')
		: I18n.t('Activate_to_select_server');

	return (
		<Touchable
			onPress={onPress}
			onDeletePress={onDeletePress || (() => {})}
			testID={`server-item-${item.id}`}
			width={width}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}>
			<View style={styles.serverItemContainer}>
				{item.iconURL ? (
					<Image
						source={{
							uri: item.iconURL
						}}
						placeholder={defaultLogo}
						style={styles.serverIcon}
						onError={() => console.log('err_loading_server_icon')}
						contentFit='contain'
					/>
				) : (
					<Image source={defaultLogo} style={styles.serverIcon} contentFit='contain' />
				)}
				<View style={styles.serverTextContainer}>
					<Text numberOfLines={1} style={[styles.serverName, { color: colors.fontTitlesLabels }]}>
						{item.name || item.id}
					</Text>
					<Text numberOfLines={1} style={[styles.serverUrl, { color: colors.fontSecondaryInfo }]}>
						{item.id}
					</Text>
				</View>
				<Radio check={hasCheck || false} size={24} />
			</View>
		</Touchable>
	);
});

export default ServerItem;

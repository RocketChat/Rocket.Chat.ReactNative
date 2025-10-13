import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import Check from '../Check';
import styles, { ROW_HEIGHT } from './styles';
import { useTheme } from '../../theme';
import Touch from '../Touch';

export { ROW_HEIGHT };

export interface IServerItem {
	item: {
		id: string;
		iconURL: string;
		name: string;
		useRealName?: boolean;
	};
	onPress(): void;
	onLongPress?(): void;
	hasCheck?: boolean;
}

const defaultLogo = require('../../static/images/logo.png');

const ServerItem = React.memo(({ item, onPress, onLongPress, hasCheck }: IServerItem) => {
	const { colors } = useTheme();
	return (
		<Touch
			onPress={onPress}
			onLongPress={() => onLongPress?.()}
			testID={`server-item-${item.id}`}
			style={{ backgroundColor: colors.surfaceRoom }}>
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
				{hasCheck ? <Check /> : null}
			</View>
		</Touch>
	);
});

export default ServerItem;

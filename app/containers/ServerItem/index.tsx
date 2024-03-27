import React from 'react';
import { Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import Check from '../Check';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../lib/constants';
import { isIOS } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';

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
	const { theme } = useTheme();
	return (
		<Pressable
			onPress={onPress}
			onLongPress={() => onLongPress?.()}
			testID={`rooms-list-header-server-${item.id}`}
			android_ripple={{ color: themes[theme].surfaceNeutral }}
			style={({ pressed }: { pressed: boolean }) => ({
				backgroundColor: isIOS && pressed ? themes[theme].surfaceNeutral : themes[theme].surfaceRoom
			})}
		>
			<View style={styles.serverItemContainer}>
				{item.iconURL ? (
					<FastImage
						source={{
							uri: item.iconURL,
							priority: FastImage.priority.high
						}}
						// @ts-ignore TODO: Remove when updating FastImage
						defaultSource={defaultLogo}
						style={styles.serverIcon}
						onError={() => console.log('err_loading_server_icon')}
					/>
				) : (
					<FastImage source={defaultLogo} style={styles.serverIcon} />
				)}
				<View style={styles.serverTextContainer}>
					<Text numberOfLines={1} style={[styles.serverName, { color: themes[theme].fontTitlesLabels }]}>
						{item.name || item.id}
					</Text>
					<Text numberOfLines={1} style={[styles.serverUrl, { color: themes[theme].fontSecondaryInfo }]}>
						{item.id}
					</Text>
				</View>
				{hasCheck ? <Check /> : null}
			</View>
		</Pressable>
	);
});

export default ServerItem;

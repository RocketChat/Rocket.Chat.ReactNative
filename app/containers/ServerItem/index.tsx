import React from 'react';
// @ts-ignore // TODO: Remove on react-native update
import { Pressable, Text, View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';

import { IServerInfo } from '../../definitions';
import Check from '../Check';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../lib/constants';
import { isIOS } from '../../utils/deviceInfo';
import { useTheme } from '../../theme';

export { ROW_HEIGHT };

interface IServerItem {
	item: IServerInfo;
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
			android_ripple={{ color: themes[theme].bannerBackground }}
			style={({ pressed }: { pressed: boolean }) => ({
				backgroundColor: isIOS && pressed ? themes[theme].bannerBackground : themes[theme].backgroundColor
			})}>
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
					<Text numberOfLines={1} style={[styles.serverName, { color: themes[theme].titleText }]}>
						{item.name || item.id}
					</Text>
					<Text numberOfLines={1} style={[styles.serverUrl, { color: themes[theme].auxiliaryText }]}>
						{item.id}
					</Text>
				</View>
				{hasCheck ? <Check /> : null}
			</View>
		</Pressable>
	);
});

export default ServerItem;

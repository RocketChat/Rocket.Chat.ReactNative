import React from 'react';
// @ts-ignore
import { Pressable, Text, View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';

import Check from '../../containers/Check';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../constants/colors';
import { isIOS } from '../../utils/deviceInfo';
import { withTheme } from '../../theme';

export { ROW_HEIGHT };

interface IServerItem {
	item: {
		id: string;
		iconURL: string;
		name: string;
	};
	onPress(): void;
	onLongPress?(): void;
	hasCheck?: boolean;
	theme?: string;
}

const defaultLogo = require('../../static/images/logo.png');

const ServerItem = React.memo(({ item, onPress, onLongPress, hasCheck, theme }: IServerItem) => (
	<Pressable
		onPress={onPress}
		onLongPress={() => onLongPress?.()}
		testID={`rooms-list-header-server-${item.id}`}
		android_ripple={{
			color: themes[theme!].bannerBackground
		}}
		style={({ pressed }: any) => ({
			backgroundColor: isIOS && pressed ? themes[theme!].bannerBackground : themes[theme!].backgroundColor
		})}>
		<View style={styles.serverItemContainer}>
			{item.iconURL ? (
				<FastImage
					source={{
						uri: item.iconURL,
						priority: FastImage.priority.high
					}}
					// @ts-ignore
					defaultSource={defaultLogo}
					style={styles.serverIcon}
					onError={() => console.log('err_loading_server_icon')}
				/>
			) : (
				<FastImage source={defaultLogo} style={styles.serverIcon} />
			)}
			<View style={styles.serverTextContainer}>
				<Text numberOfLines={1} style={[styles.serverName, { color: themes[theme!].titleText }]}>
					{item.name || item.id}
				</Text>
				<Text numberOfLines={1} style={[styles.serverUrl, { color: themes[theme!].auxiliaryText }]}>
					{item.id}
				</Text>
			</View>
			{hasCheck ? <Check theme={theme!} /> : null}
		</View>
	</Pressable>
));

export default withTheme(ServerItem);

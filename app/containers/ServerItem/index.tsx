import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import * as List from '../List/index';
import styles, { ROW_HEIGHT } from './styles';
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
	const { colors } = useTheme();

	const iconName = hasCheck ? 'radio-checked' : 'radio-unchecked';
	const iconColor = hasCheck ? colors.badgeBackgroundLevel2 : colors.strokeMedium;
	return (
		<Pressable
			accessibilityRole='radio'
			onPress={onPress}
			onLongPress={() => onLongPress?.()}
			testID={`server-item-${item.id}`}
			android_ripple={{ color: colors.surfaceNeutral }}
			style={({ pressed }: { pressed: boolean }) => ({
				backgroundColor: isIOS && pressed ? colors.surfaceNeutral : colors.surfaceRoom
			})}>
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

				<List.Icon name={iconName} color={iconColor} />
			</View>
		</Pressable>
	);
});

export default ServerItem;

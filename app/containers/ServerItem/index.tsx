import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { KeyboardExtendedPressable } from 'react-native-external-keyboard';

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
		<KeyboardExtendedPressable
			focusable={true}
			accessible={true}
			accessibilityRole='button'
			accessibilityLabel={`Server: ${item.name}`}
			accessibilityHint='Press to select server'
			accessibilityActions={[{ name: 'longpress', label: 'Long press to select server' }]}
			aria-checked={hasCheck}
			onPress={onPress}
			onLongPress={onLongPress}
			testID={`server-item-${item.id}`}
			android_ripple={{ color: themes[theme].surfaceNeutral }}
			style={({ pressed }: { pressed: boolean }) => ({
				backgroundColor: isIOS && pressed ? themes[theme].surfaceNeutral : themes[theme].surfaceRoom
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
					<Text numberOfLines={1} style={[styles.serverName, { color: themes[theme].fontTitlesLabels }]}>
						{item.name || item.id}
					</Text>
					<Text numberOfLines={1} style={[styles.serverUrl, { color: themes[theme].fontSecondaryInfo }]}>
						{item.id}
					</Text>
				</View>
				{hasCheck ? <Check /> : null}
			</View>
		</KeyboardExtendedPressable>
	);
});

export default ServerItem;

import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import I18n from '../../i18n';
import * as List from '../List/index';
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

	const iconName = hasCheck ? 'radio-checked' : 'radio-unchecked';
	const iconColor = hasCheck ? colors.badgeBackgroundLevel2 : colors.strokeMedium;
	const accessibilityLabel = `${item.name || item.id}. ${item.id}. ${I18n.t(hasCheck ? 'Selected' : 'Unselected')}`;

	return (
		<Touch
			accessible
			accessibilityLabel={accessibilityLabel}
			accessibilityRole='radio'
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

				<List.Icon name={iconName} color={iconColor} />
			</View>
		</Touch>
	);
});

export default ServerItem;

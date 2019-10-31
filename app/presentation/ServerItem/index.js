import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { RectButton } from 'react-native-gesture-handler';

import Check from '../../containers/Check';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../constants/colors';

export { ROW_HEIGHT };

const ServerItem = React.memo(({
	server, item, onPress, hasCheck, theme
}) => (
	<RectButton
		onPress={onPress}
		underlayColor={themes[theme].bannerBackground}
		style={[styles.serverItem, { backgroundColor: themes[theme].backgroundColor }]}
		activeOpacity={1}
		testID={`rooms-list-header-server-${ item.id }`}
	>
		<View style={styles.serverItemContainer}>
			{item.iconURL
				? (
					<FastImage
						source={{
							uri: item.iconURL,
							priority: FastImage.priority.high
						}}
						defaultSource={{ uri: 'logo' }}
						style={styles.serverIcon}
						onError={() => console.log('err_loading_server_icon')}
					/>
				)
				: (
					<FastImage
						source={{ uri: 'logo' }}
						style={styles.serverIcon}
					/>
				)
			}
			<View style={styles.serverTextContainer}>
				<Text style={[styles.serverName, { color: themes[theme].titleText }]}>{item.name || item.id}</Text>
				<Text style={[styles.serverUrl, { color: themes[theme].auxiliaryText }]}>{item.id}</Text>
			</View>
			{item.id === server && hasCheck ? <Check /> : null}
		</View>
	</RectButton>
));

ServerItem.propTypes = {
	onPress: PropTypes.func.isRequired,
	item: PropTypes.object.isRequired,
	hasCheck: PropTypes.bool,
	server: PropTypes.string,
	theme: PropTypes.string
};

export default ServerItem;

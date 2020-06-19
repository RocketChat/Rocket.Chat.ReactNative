import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import RocketChat from '../../lib/rocketchat';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';

const androidMarginLeft = isTablet ? 0 : 4;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginRight: isAndroid ? 15 : 5,
		marginLeft: isAndroid ? androidMarginLeft : -10,
		justifyContent: 'center'
	},
	inner: {
		alignItems: 'center',
		flexDirection: 'row',
		flex: 1
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		marginRight: 4
	},
	name: {
		...sharedStyles.textSemibold
	}
});

const Header = React.memo(({ room, theme }) => {
	let icon;
	if (room.t === 'c') {
		icon = 'hashtag';
	} else if (room.t === 'l') {
		icon = 'livechat';
	} else if (room.t === 'd') {
		icon = 'at';
	} else {
		icon = 'lock';
	}

	const textColor = themes[theme].headerTitleColor;

	return (
		<View style={styles.container}>
			<View style={styles.inner}>
				<Text numberOfLines={1} style={styles.text}>
					<Text style={[styles.text, { color: textColor }]} numberOfLines={1}>{I18n.t('Sending_to')} </Text>
					<CustomIcon
						name={icon}
						size={16}
						color={textColor}
					/>
					<Text
						style={[styles.name, { color: textColor }]}
						numberOfLines={1}
					>
						{RocketChat.getRoomTitle(room)}
					</Text>
				</Text>
			</View>
		</View>
	);
});
Header.propTypes = {
	room: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(Header);

import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import RocketChat from '../../lib/rocketchat';
import { themes } from '../../constants/colors';
import styles from './styles';

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

	return (
		<View style={styles.header}>
			<Text style={[styles.text, { color: themes[theme].bodyText }]}>{I18n.t('Sending_to')}</Text>
			<CustomIcon
				name={icon}
				size={18}
				color={themes[theme].bodyText}
			/>
			<Text
				style={[styles.name, { color: themes[theme].bodyText }]}
				numberOfLines={1}
			>
				{RocketChat.getRoomTitle(room)}
			</Text>
		</View>
	);
});
Header.propTypes = {
	room: PropTypes.object,
	theme: PropTypes.string
};

export default Header;

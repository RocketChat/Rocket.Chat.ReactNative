import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../../utils/touch';
import I18n from '../../../i18n';
import styles from '../styles';
import { themes } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import UnreadBadge from '../../../presentation/RoomItem/UnreadBadge';

const Queue = React.memo(({
	searching, goQueue, queueSize, theme
}) => {
	if (searching > 0) {
		return null;
	}
	return (
		<Touch
			onPress={goQueue}
			theme={theme}
			style={{ backgroundColor: themes[theme].headerSecondaryBackground }}
		>
			<View
				style={[
					styles.dropdownContainerHeader,
					{ borderBottomWidth: StyleSheet.hairlineWidth, borderColor: themes[theme].separatorColor, paddingRight: 12 }
				]}
			>
				<Text style={[styles.sortToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Queued_chats')}</Text>
				<UnreadBadge
					unread={queueSize}
					theme={theme}
				/>
			</View>
		</Touch>
	);
});

Queue.propTypes = {
	searching: PropTypes.bool,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	theme: PropTypes.string
};

export default withTheme(Queue);

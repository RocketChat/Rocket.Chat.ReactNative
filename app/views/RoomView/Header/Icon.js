import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { STATUS_COLORS, COLOR_TEXT_DESCRIPTION, COLOR_WHITE } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import Status from '../../../containers/Status/Status';
import { isIOS } from '../../../utils/deviceInfo';

const ICON_SIZE = 18;

const styles = StyleSheet.create({
	type: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		marginRight: 8,
		color: isIOS ? COLOR_TEXT_DESCRIPTION : COLOR_WHITE
	},
	status: {
		marginLeft: 4,
		marginRight: 12
	}
});

const Icon = React.memo(({ type, status }) => {
	if (type === 'd') {
		return <Status size={10} style={styles.status} status={status} />;
	}

	let icon;
	if (type === 'discussion') {
		icon = 'chat';
	} else if (type === 'thread') {
		icon = 'thread';
	} else if (type === 'c') {
		icon = 'hashtag';
	} else {
		icon = 'lock';
	}
	return (
		<CustomIcon
			name={icon}
			size={ICON_SIZE * 1}
			style={[
				styles.type,
				{
					width: ICON_SIZE * 1,
					height: ICON_SIZE * 1
				},
				type === 'd' && { color: STATUS_COLORS[status] }
			]}
		/>
	);
});

Icon.propTypes = {
	type: PropTypes.string,
	status: PropTypes.string
};
export default Icon;

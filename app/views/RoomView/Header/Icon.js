import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { STATUS_COLORS } from '../../../constants/colors';
import { CustomIcon } from '../../../lib/Icons';
import Status from '../../../containers/Status/Status';
import { isIOS } from '../../../utils/deviceInfo';

const ICON_SIZE = 18;

const styles = StyleSheet.create({
	type: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		marginRight: 8,
		color: isIOS ? '#9EA2A8' : '#fff'
	},
	status: {
		marginRight: 8
	}
});

const Icon = React.memo(({ type, status }) => {
	if (type === 'd') {
		return <Status size={10} style={styles.status} status={status} />;
	}

	const icon = type === 'c' ? 'hashtag' : 'lock';
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

import React from 'react';
import PropTypes from 'prop-types';

import Status from '../../containers/Status/Status';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import styles from './styles';

const TypeIcon = React.memo(({
	theme, type, prid, status, isGroupChat
}) => {
	if (type === 'd' && !isGroupChat) {
		return <Status style={styles.status} size={10} status={status} />;
	}
	return <RoomTypeIcon theme={theme} type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} />;
});

TypeIcon.propTypes = {
	theme: PropTypes.string,
	type: PropTypes.string,
	status: PropTypes.string,
	prid: PropTypes.string,
	isGroupChat: PropTypes.bool
};

export default TypeIcon;

import React from 'react';
import PropTypes from 'prop-types';

import RoomTypeIcon from '../../containers/RoomTypeIcon';

const TypeIcon = React.memo(({
	type, prid, status, isGroupChat, teamMain, size
}) => <RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} size={size} />);

TypeIcon.propTypes = {
	type: PropTypes.string,
	status: PropTypes.string,
	prid: PropTypes.string,
	isGroupChat: PropTypes.bool,
	teamMain: PropTypes.bool,
	size: PropTypes.number
};

export default TypeIcon;

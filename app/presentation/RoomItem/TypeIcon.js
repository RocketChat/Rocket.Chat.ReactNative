import React from 'react';
import PropTypes from 'prop-types';

import RoomTypeIcon from '../../containers/RoomTypeIcon';

const TypeIcon = React.memo(({
	type, prid, status, isGroupChat, teamMain
}) => <RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} teamMain={teamMain} />);

TypeIcon.propTypes = {
	type: PropTypes.string,
	status: PropTypes.string,
	prid: PropTypes.string,
	isGroupChat: PropTypes.bool,
	teamMain: PropTypes.bool
};

export default TypeIcon;

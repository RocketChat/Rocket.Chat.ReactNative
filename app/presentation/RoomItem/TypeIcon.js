import React from 'react';
import PropTypes from 'prop-types';

import RoomTypeIcon from '../../containers/RoomTypeIcon';

const TypeIcon = React.memo(({
	type, prid, status, isGroupChat
}) => <RoomTypeIcon type={prid ? 'discussion' : type} isGroupChat={isGroupChat} status={status} />);

TypeIcon.propTypes = {
	type: PropTypes.string,
	status: PropTypes.string,
	prid: PropTypes.string,
	isGroupChat: PropTypes.bool
};

export default TypeIcon;

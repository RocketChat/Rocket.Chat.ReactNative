import React from 'react';
import PropTypes from 'prop-types';

import styles from './styles';
import Status from '../../containers/status';
import RoomTypeIcon from '../../containers/RoomTypeIcon';

const Type = React.memo(({ t, rid, userId }) => {
	if (t === 'd') {
		const id = rid.replace(userId, '').trim();
		return <Status style={[styles.status]} id={id} />;
	}
	return <RoomTypeIcon type={t} size={12} />;
});
Type.propTypes = {
	t: PropTypes.string,
	rid: PropTypes.string,
	userId: PropTypes.string
};

export default Type;

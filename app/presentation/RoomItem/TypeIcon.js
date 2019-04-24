import React from 'react';
import PropTypes from 'prop-types';

import Status from '../../containers/Status';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import styles from './styles';

const TypeIcon = React.memo(({ type, id, prid }) => {
	if (type === 'd') {
		return <Status style={styles.status} size={10} id={id} />;
	}
	return <RoomTypeIcon type={prid ? 'discussion' : type} />;
});

TypeIcon.propTypes = {
	type: PropTypes.string,
	id: PropTypes.string,
	prid: PropTypes.string
};

export default TypeIcon;

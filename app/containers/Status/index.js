import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Status from './Status';

const StatusContainer = React.memo(({
	userStatus, style, size, offline
}) => {
	let status;
	if (offline) {
		status = 'offline';
	}
	status = userStatus || 'offline';
	return <Status size={size} style={style} status={status} />;
});

StatusContainer.propTypes = {
	userStatus: PropTypes.string,
	style: PropTypes.any,
	size: PropTypes.number,
	offline: PropTypes.bool
};

StatusContainer.defaultProps = {
	size: 16
};

const mapStateToProps = (state, ownProps) => ({
	offline: !state.meteor.connected,
	userStatus: state.activeUsers[ownProps.id]
});

export default connect(mapStateToProps)(StatusContainer);

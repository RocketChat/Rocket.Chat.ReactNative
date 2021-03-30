import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Status from './Status';

const StatusContainer = memo(({ style, size = 32, status }) => <Status size={size} style={style} status={status} />);

StatusContainer.propTypes = {
	style: PropTypes.any,
	size: PropTypes.number,
	status: PropTypes.string
};

const mapStateToProps = (state, ownProps) => ({
	status: state.meteor.connected ? (state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status) : 'loading'
});

export default connect(mapStateToProps)(StatusContainer);

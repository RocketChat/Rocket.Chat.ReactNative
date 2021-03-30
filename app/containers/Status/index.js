import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Status from './Status';

class StatusContainer extends React.PureComponent {
	static propTypes = {
		style: PropTypes.any,
		size: PropTypes.number,
		status: PropTypes.string
	};

	static defaultProps = {
		size: 32
	}

	render() {
		const {
			style, size, status
		} = this.props;
		return <Status size={size} style={style} status={status} />;
	}
}

const mapStateToProps = (state, ownProps) => ({
	status: state.meteor.connected ? (state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status) : 'loading'
});

export default connect(mapStateToProps)(StatusContainer);

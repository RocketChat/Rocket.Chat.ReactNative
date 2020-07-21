import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Status from './Status';
import { withTheme } from '../../theme';

class StatusContainer extends React.PureComponent {
	static propTypes = {
		style: PropTypes.any,
		size: PropTypes.number,
		status: PropTypes.string,
		theme: PropTypes.string
	};

	static defaultProps = {
		size: 16
	}

	render() {
		const {
			style, size, status, theme
		} = this.props;
		return <Status size={size} style={style} status={status} theme={theme} />;
	}
}

const mapStateToProps = (state, ownProps) => ({
	status: state.meteor.connected ? (state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status) : 'offline'
});

export default connect(mapStateToProps)(withTheme(StatusContainer));

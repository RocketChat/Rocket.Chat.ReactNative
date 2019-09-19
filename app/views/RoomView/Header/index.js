import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import Header from './Header';
import RightButtons from './RightButtons';

class RoomHeaderView extends Component {
	static propTypes = {
		title: PropTypes.string,
		type: PropTypes.string,
		prid: PropTypes.string,
		tmid: PropTypes.string,
		usersTyping: PropTypes.string,
		window: PropTypes.object,
		status: PropTypes.string,
		connecting: PropTypes.bool,
		widthOffset: PropTypes.number
	};

	shouldComponentUpdate(nextProps) {
		const { usersTyping } = this.props;
		const {
			type, title, status, window, connecting
		} = this.props;
		if (nextProps.type !== type) {
			return true;
		}
		if (nextProps.title !== title) {
			return true;
		}
		if (nextProps.status !== status) {
			return true;
		}
		if (nextProps.connecting !== connecting) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (nextProps.window.height !== window.height) {
			return true;
		}
		if (!equal(nextProps.usersTyping, usersTyping)) {
			return true;
		}
		return false;
	}

	render() {
		const {
			window, title, type, prid, tmid, widthOffset, status = 'offline', connecting, usersTyping
		} = this.props;

		return (
			<Header
				prid={prid}
				tmid={tmid}
				title={title}
				type={type}
				status={status}
				width={window.width}
				height={window.height}
				usersTyping={usersTyping}
				widthOffset={widthOffset}
				connecting={connecting}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	let status;
	const { rid, type } = ownProps;
	if (type === 'd') {
		if (state.login.user && state.login.user.id) {
			const { id: loggedUserId } = state.login.user;
			const userId = rid.replace(loggedUserId, '').trim();
			status = state.activeUsers[userId];
		}
	}

	return {
		connecting: state.meteor.connecting,
		usersTyping: state.usersTyping,
		status
	};
};

export default responsive(connect(mapStateToProps)(RoomHeaderView));

export { RightButtons };

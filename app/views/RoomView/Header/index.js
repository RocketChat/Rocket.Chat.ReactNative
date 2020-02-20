import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import Header from './Header';
import RightButtons from './RightButtons';
import { withTheme } from '../../../theme';
import RoomHeaderLeft from './RoomHeaderLeft';
import { getUserSelector } from '../../../selectors/login';

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
		theme: PropTypes.string,
		widthOffset: PropTypes.number,
		goRoomActionsView: PropTypes.func
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, title, status, window, connecting, goRoomActionsView, usersTyping, theme
		} = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
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
		if (nextProps.goRoomActionsView !== goRoomActionsView) {
			return true;
		}
		return false;
	}

	render() {
		const {
			window, title, type, prid, tmid, widthOffset, status = 'offline', connecting, usersTyping, goRoomActionsView, theme
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
				theme={theme}
				usersTyping={usersTyping}
				widthOffset={widthOffset}
				goRoomActionsView={goRoomActionsView}
				connecting={connecting}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	let status;
	const { rid, type } = ownProps;
	if (type === 'd') {
		const user = getUserSelector(state);
		if (user.id) {
			const userId = rid.replace(user.id, '').trim();
			status = state.activeUsers[userId];
		}
	}

	return {
		connecting: state.meteor.connecting,
		usersTyping: state.usersTyping,
		status
	};
};

export default responsive(connect(mapStateToProps)(withTheme(RoomHeaderView)));

export { RightButtons, RoomHeaderLeft };

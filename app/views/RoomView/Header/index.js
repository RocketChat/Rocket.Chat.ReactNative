import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import Header from './Header';
import RightButtons from './RightButtons';
import { withTheme } from '../../../theme';
import RoomHeaderLeft from './RoomHeaderLeft';
import { withDimensions } from '../../../dimensions';

class RoomHeaderView extends Component {
	static propTypes = {
		title: PropTypes.string,
		subtitle: PropTypes.string,
		type: PropTypes.string,
		prid: PropTypes.string,
		tmid: PropTypes.string,
		usersTyping: PropTypes.string,
		status: PropTypes.string,
		statusText: PropTypes.string,
		connecting: PropTypes.bool,
		theme: PropTypes.string,
		roomUserId: PropTypes.string,
		widthOffset: PropTypes.number,
		goRoomActionsView: PropTypes.func,
		width: PropTypes.number,
		height: PropTypes.number
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, title, subtitle, status, statusText, connecting, goRoomActionsView, usersTyping, theme, width, height
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
		if (nextProps.subtitle !== subtitle) {
			return true;
		}
		if (nextProps.status !== status) {
			return true;
		}
		if (nextProps.statusText !== statusText) {
			return true;
		}
		if (nextProps.connecting !== connecting) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.height !== height) {
			return true;
		}
		if (!equal(nextProps.usersTyping, usersTyping)) {
			return true;
		}
		if (nextProps.goRoomActionsView !== goRoomActionsView) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.height !== height) {
			return true;
		}
		return false;
	}

	render() {
		const {
			title, subtitle, type, prid, tmid, widthOffset, status = 'offline', statusText, connecting, usersTyping, goRoomActionsView, roomUserId, theme, width, height
		} = this.props;

		return (
			<Header
				prid={prid}
				tmid={tmid}
				title={title}
				subtitle={type === 'd' ? statusText : subtitle}
				type={type}
				status={status}
				width={width}
				height={height}
				theme={theme}
				usersTyping={usersTyping}
				widthOffset={widthOffset}
				roomUserId={roomUserId}
				goRoomActionsView={goRoomActionsView}
				connecting={connecting}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	let statusText;
	let status = 'offline';
	const { roomUserId, type, visitor = {} } = ownProps;

	if (state.meteor.connected) {
		if (type === 'd' && state.activeUsers[roomUserId]) {
			({ status, statusText } = state.activeUsers[roomUserId]);
		} else if (type === 'l' && visitor?.status) {
			({ status } = visitor);
		}
	}

	return {
		connecting: state.meteor.connecting,
		usersTyping: state.usersTyping,
		status,
		statusText
	};
};

export default connect(mapStateToProps)(withDimensions(withTheme(RoomHeaderView)));

export { RightButtons, RoomHeaderLeft };

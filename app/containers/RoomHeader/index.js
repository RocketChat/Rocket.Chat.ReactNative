import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { dequal } from 'dequal';

import RoomHeader from './RoomHeader';
import { withDimensions } from '../../dimensions';
import I18n from '../../i18n';

class RoomHeaderContainer extends Component {
	static propTypes = {
		title: PropTypes.string,
		subtitle: PropTypes.string,
		type: PropTypes.string,
		prid: PropTypes.string,
		tmid: PropTypes.string,
		teamMain: PropTypes.bool,
		usersTyping: PropTypes.string,
		status: PropTypes.string,
		statusText: PropTypes.string,
		connecting: PropTypes.bool,
		connected: PropTypes.bool,
		roomUserId: PropTypes.string,
		widthOffset: PropTypes.number,
		onPress: PropTypes.func,
		width: PropTypes.number,
		height: PropTypes.number,
		parentTitle: PropTypes.string,
		isGroupChat: PropTypes.bool,
		testID: PropTypes.string
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, title, subtitle, status, statusText, connecting, connected, onPress, usersTyping, width, height, teamMain
		} = this.props;
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
		if (nextProps.connected !== connected) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.height !== height) {
			return true;
		}
		if (!dequal(nextProps.usersTyping, usersTyping)) {
			return true;
		}
		if (nextProps.onPress !== onPress) {
			return true;
		}
		if (nextProps.teamMain !== teamMain) {
			return true;
		}
		return false;
	}

	render() {
		const {
			title,
			subtitle: subtitleProp,
			type,
			teamMain,
			prid,
			tmid,
			widthOffset,
			status = 'offline',
			statusText,
			connecting,
			connected,
			usersTyping,
			onPress,
			roomUserId,
			width,
			height,
			parentTitle,
			isGroupChat,
			testID
		} = this.props;

		let subtitle;
		if (connecting) {
			subtitle = I18n.t('Connecting');
		} else if (!connected) {
			subtitle = I18n.t('Waiting_for_network');
		} else {
			subtitle = subtitleProp;
		}

		return (
			<RoomHeader
				prid={prid}
				tmid={tmid}
				title={title}
				subtitle={type === 'd' ? statusText : subtitle}
				type={type}
				teamMain={teamMain}
				status={status}
				width={width}
				height={height}
				usersTyping={usersTyping}
				widthOffset={widthOffset}
				roomUserId={roomUserId}
				connecting={connecting}
				parentTitle={parentTitle}
				isGroupChat={isGroupChat}
				testID={testID}
				onPress={onPress}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	let statusText;
	let status = 'offline';
	const {
		roomUserId, type, visitor = {}, tmid
	} = ownProps;

	if (state.meteor.connected) {
		if ((type === 'd' || (tmid && roomUserId)) && state.activeUsers[roomUserId]) {
			({ status, statusText } = state.activeUsers[roomUserId]);
		} else if (type === 'l' && visitor?.status) {
			({ status } = visitor);
		}
	}

	return {
		connecting: state.meteor.connecting || state.server.loading,
		connected: state.meteor.connected,
		usersTyping: state.usersTyping,
		status,
		statusText
	};
};

export default connect(mapStateToProps)(withDimensions(RoomHeaderContainer));

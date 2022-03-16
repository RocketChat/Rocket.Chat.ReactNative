import { dequal } from 'dequal';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { TUserStatus } from '../../definitions/UserStatus';
import { IApplicationState } from '../../definitions';
import { withDimensions } from '../../dimensions';
import I18n from '../../i18n';
import RoomHeader from './RoomHeader';

interface IRoomHeaderContainerProps {
	title: string;
	subtitle: string;
	type: string;
	prid: string;
	tmid: string;
	teamMain: boolean;
	usersTyping: [];
	status: TUserStatus;
	statusText: string;
	connecting: boolean;
	connected: boolean;
	roomUserId: string;
	widthOffset: number;
	onPress(): void;
	width: number;
	height: number;
	parentTitle: string;
	isGroupChat: boolean;
	testID: string;
}

class RoomHeaderContainer extends Component<IRoomHeaderContainerProps, any> {
	shouldComponentUpdate(nextProps: IRoomHeaderContainerProps) {
		const { type, title, subtitle, status, statusText, connecting, connected, onPress, usersTyping, width, height, teamMain } =
			this.props;
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
			status = 'offline',
			statusText,
			connecting,
			connected,
			usersTyping,
			onPress,
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
				parentTitle={parentTitle}
				isGroupChat={isGroupChat}
				testID={testID}
				onPress={onPress}
			/>
		);
	}
}

const mapStateToProps = (state: IApplicationState, ownProps: any) => {
	let statusText = '';
	let status = 'offline';
	const { roomUserId, type, visitor = {}, tmid } = ownProps;

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
		status: status as TUserStatus,
		statusText
	};
};

export default connect(mapStateToProps)(withDimensions(RoomHeaderContainer));

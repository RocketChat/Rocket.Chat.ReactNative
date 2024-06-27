import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { IApplicationState, TUserStatus, IOmnichannelSource, IVisitor } from '../../definitions';
import { useDimensions } from '../../dimensions';
import I18n from '../../i18n';
import RoomHeader from './RoomHeader';

interface IRoomHeaderContainerProps {
	title?: string;
	subtitle?: string;
	type: string;
	prid?: string;
	tmid?: string;
	teamMain?: boolean;
	roomUserId?: string | null;
	onPress: Function;
	parentTitle?: string;
	isGroupChat?: boolean;
	testID?: string;
	sourceType?: IOmnichannelSource;
	visitor?: IVisitor;
	disabled?: boolean;
	rightButtonsWidth?: number;
}

const RoomHeaderContainer = React.memo(
	({
		isGroupChat,
		onPress,
		parentTitle,
		prid,
		roomUserId,
		subtitle: subtitleProp,
		teamMain,
		testID,
		title,
		tmid,
		type,
		sourceType,
		visitor,
		disabled,
		rightButtonsWidth
	}: IRoomHeaderContainerProps) => {
		let subtitle: string | undefined;
		let statusVisitor: TUserStatus | undefined;
		let statusText: string | undefined;
		const { width, height } = useDimensions();

		const connecting = useSelector((state: IApplicationState) => state.meteor.connecting || state.server.loading);
		const usersTyping = useSelector((state: IApplicationState) => state.usersTyping, shallowEqual);
		const connected = useSelector((state: IApplicationState) => state.meteor.connected);
		const activeUser = useSelector(
			(state: IApplicationState) => (roomUserId ? state.activeUsers?.[roomUserId] : undefined),
			shallowEqual
		);

		if (connecting) {
			subtitle = I18n.t('Connecting');
		} else if (!connected) {
			subtitle = I18n.t('Waiting_for_network');
		} else {
			subtitle = subtitleProp;
		}

		if (connected) {
			if ((type === 'd' || (tmid && roomUserId)) && activeUser) {
				const { statusText: statusTextActiveUser } = activeUser;
				statusText = statusTextActiveUser;
			} else if (type === 'l' && visitor?.status) {
				({ status: statusVisitor } = visitor);
			}
		}

		return (
			<RoomHeader
				roomUserId={roomUserId}
				prid={prid}
				tmid={tmid}
				title={title}
				subtitle={type === 'd' ? statusText : subtitle}
				type={type}
				teamMain={teamMain}
				status={statusVisitor}
				width={width}
				height={height}
				usersTyping={usersTyping}
				parentTitle={parentTitle}
				isGroupChat={isGroupChat}
				testID={testID}
				onPress={onPress}
				sourceType={sourceType}
				disabled={disabled}
				rightButtonsWidth={rightButtonsWidth}
			/>
		);
	}
);

export default RoomHeaderContainer;

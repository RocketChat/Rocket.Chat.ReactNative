import React, { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { dequal } from 'dequal';

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
	onPress(): void;
	parentTitle: string;
	isGroupChat: boolean;
	testID: string;
	sourceType?: IOmnichannelSource;
	visitor?: IVisitor;
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
		visitor
	}: IRoomHeaderContainerProps) => {
		const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
		const [status, setStatus] = useState<TUserStatus>('offline');
		const [statusText, setStatusText] = useState<string | undefined>(undefined);
		const { width, height } = useDimensions();

		const connecting = useSelector((state: IApplicationState) => state.meteor.connecting || state.server.loading);
		const usersTyping = useSelector((state: IApplicationState) => state.usersTyping, shallowEqual);
		const connected = useSelector((state: IApplicationState) => state.meteor.connected);
		const activeUser = useSelector(
			(state: IApplicationState) => (roomUserId ? state.activeUsers?.[roomUserId] : undefined),
			shallowEqual
		);

		useEffect(() => {
			if (connecting) {
				console.count(`connecting: ${connecting}`);
				setSubtitle(I18n.t('Connecting'));
			} else if (!connected) {
				console.count(`else if connected: ${connected}`);
				setSubtitle(I18n.t('Waiting_for_network'));
			} else {
				console.count(`subtitleProp: ${subtitleProp}`);
				setSubtitle(subtitleProp);
			}
		}, [connecting, connected]);

		useEffect(() => {
			if (connected) {
				console.count(`connected: ${connected}`);
				if ((type === 'd' || (tmid && roomUserId)) && activeUser) {
					const { status: statusActiveUser, statusText: statusTextActiveUser } = activeUser;
					setStatus(statusActiveUser);
					setStatusText(statusTextActiveUser);
				} else if (type === 'l' && visitor?.status) {
					const { status: statusVisitor } = visitor;
					setStatus(statusVisitor);
				}
			}
		}, [connected, activeUser]);

		console.count('RoomHeader');

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
				sourceType={sourceType}
			/>
		);
	},
	(prevProps, nextProps) => {
		if (nextProps.type !== prevProps.type) {
			return false;
		}
		if (nextProps.title !== prevProps.title) {
			return false;
		}
		if (nextProps.subtitle !== prevProps.subtitle) {
			return false;
		}
		if (!dequal(nextProps.sourceType, prevProps.sourceType)) {
			return false;
		}
		if (nextProps.onPress !== prevProps.onPress) {
			return false;
		}
		if (nextProps.teamMain !== prevProps.teamMain) {
			return false;
		}
		return true;
	}
);

export default RoomHeaderContainer;

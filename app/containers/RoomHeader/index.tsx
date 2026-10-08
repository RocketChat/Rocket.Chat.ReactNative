import { memo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import type { IApplicationState, TUserStatus, IOmnichannelSource, IVisitor, ISubscription } from '~/definitions';
import RoomHeader from './RoomHeader';
import { getConnectionSubtitle, getPresenceLabel } from './subtitle';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IRoomHeaderContainerProps {
	title?: string;
	subtitle?: string;
	type: string;
	prid?: string;
	tmid?: string;
	teamMain?: boolean;
	roomUserId?: string | null;
	onPress: () => void;
	parentTitle?: string;
	isGroupChat?: boolean;
	testID?: string;
	sourceType?: IOmnichannelSource;
	visitor?: IVisitor;
	disabled?: boolean;
	abacAttributes?: ISubscription['abacAttributes'];
}

const RoomHeaderContainer = memo(
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
		abacAttributes
	}: IRoomHeaderContainerProps) => {
		let statusVisitor: TUserStatus | undefined;
		let statusText: string | undefined;
		let statusExpiresAt: string | undefined;
		const { width, height } = useResponsiveLayout();

		const connecting = useSelector((state: IApplicationState) => state.meteor.connecting || state.server.loading);
		const usersTyping = useSelector((state: IApplicationState) => state.usersTyping, shallowEqual);
		const connected = useSelector((state: IApplicationState) => state.meteor.connected);
		const activeUser = useSelector(
			(state: IApplicationState) => (roomUserId ? state.activeUsers?.[roomUserId] : undefined),
			shallowEqual
		);

		const connectionSubtitle = getConnectionSubtitle({ connecting, connected });

		if (connected) {
			if ((type === 'd' || (tmid && roomUserId)) && activeUser) {
				statusText = getPresenceLabel(activeUser);
				statusExpiresAt = activeUser.statusExpiresAt;
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
				subtitle={connectionSubtitle ?? (type === 'd' ? statusText : subtitleProp)}
				statusExpiresAt={type === 'd' ? statusExpiresAt : undefined}
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
				abacAttributes={abacAttributes}
			/>
		);
	}
);

export default RoomHeaderContainer;

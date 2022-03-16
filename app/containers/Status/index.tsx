import React from 'react';
import { useSelector } from 'react-redux';

import { TUserStatus } from '../../definitions/UserStatus';
import { IApplicationState } from '../../definitions';
import Status from './Status';
import { IStatus } from './definition';

const StatusContainer = ({ id, style, size = 32, ...props }: Omit<IStatus, 'status'>): React.ReactElement => {
	const status = useSelector((state: IApplicationState) =>
		state.meteor.connected ? state.activeUsers[id] && state.activeUsers[id].status : 'loading'
	) as TUserStatus;
	return <Status size={size} style={style} status={status} {...props} />;
};

export default StatusContainer;

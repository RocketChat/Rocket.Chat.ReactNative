import React from 'react';
import { connect } from 'react-redux';

import { TUserStatus } from '../../definitions/UserStatus';
import { IApplicationState } from '../../definitions';
import Status from './Status';
import { IStatus } from './definition';

const StatusContainer = ({ style, size = 32, status, ...props }: IStatus) => (
	<Status size={size} style={style} status={status} {...props} />
);

const mapStateToProps = (state: IApplicationState, ownProps: IStatus) => ({
	status: state.meteor.connected
		? state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status
		: ('loading' as TUserStatus)
});

export default connect(mapStateToProps)(StatusContainer);

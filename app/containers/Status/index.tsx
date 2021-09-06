import React, { memo } from 'react';
import { connect } from 'react-redux';

import Status from './Status';

interface IStatusContainer {
	style: any;
	size: number;
	status: string;
}

const StatusContainer = memo(({ style, size = 32, status }: IStatusContainer) => (
	<Status size={size} style={style} status={status} />
));

const mapStateToProps = (state: any, ownProps: any) => ({
	status: state.meteor.connected ? state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status : 'loading'
});

export default connect(mapStateToProps)(StatusContainer);

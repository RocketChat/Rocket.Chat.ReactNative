import React, { memo } from 'react';
import { ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IApplicationState } from '../../definitions';
import Status from './Status';

interface IStatusContainer {
	id: string;
	style: ViewStyle;
	size: number;
	status: string;
}

const StatusContainer = memo(({ style, size = 32, status }: IStatusContainer) => (
	<Status size={size} style={style} status={status} />
));

const mapStateToProps = (state: IApplicationState, ownProps: IStatusContainer) => ({
	status: state.meteor.connected ? state.activeUsers[ownProps.id] && state.activeUsers[ownProps.id].status : 'loading'
});

export default connect(mapStateToProps)(StatusContainer);

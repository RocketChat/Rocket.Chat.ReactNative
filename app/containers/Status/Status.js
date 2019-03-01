import React from 'react';
import PropTypes from 'prop-types';
import { View, ViewPropTypes } from 'react-native';
import { STATUS_COLORS } from '../../constants/colors';

const Status = React.memo(({ status, size, style }) => (
	<View
		style={
			[
				style,
				{
					borderRadius: size,
					width: size,
					height: size,
					backgroundColor: STATUS_COLORS[status]
				}
			]}
	/>
));
Status.propTypes = {
	status: PropTypes.string,
	size: PropTypes.number,
	style: ViewPropTypes.style
};
Status.defaultProps = {
	status: 'offline',
	size: 16
};

export default Status;

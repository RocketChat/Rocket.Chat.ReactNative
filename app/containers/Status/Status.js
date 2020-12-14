import React from 'react';
import PropTypes from 'prop-types';
import { STATUS_COLORS } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';

const Status = React.memo(({
	status, size, style, ...props
}) => (
	<CustomIcon
		style={style}
		name={`status-${ status }`}
		size={size}
		color={STATUS_COLORS[status] ?? STATUS_COLORS.offline}
		{...props}
	/>
));
Status.propTypes = {
	status: PropTypes.string,
	size: PropTypes.number,
	style: PropTypes.any
};
Status.defaultProps = {
	status: 'offline',
	size: 32
};

export default Status;

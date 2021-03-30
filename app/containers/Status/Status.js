import React from 'react';
import PropTypes from 'prop-types';
import { CustomIcon } from '../../lib/Icons';
import { STATUS_COLORS } from '../../constants/colors';

const Status = React.memo(({
	status, size, style, ...props
}) => {
	const name = `status-${ status }`;
	const isNameValid = CustomIcon.hasIcon(name);
	const iconName = isNameValid ? name : 'status-offline';
	const calculatedStyle = [{
		width: size, height: size, textAlignVertical: 'center'
	}, style];

	return (
		<CustomIcon
			style={calculatedStyle}
			size={size}
			name={iconName}
			color={STATUS_COLORS[status] ?? STATUS_COLORS.offline}
			{...props}
		/>
	);
});

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

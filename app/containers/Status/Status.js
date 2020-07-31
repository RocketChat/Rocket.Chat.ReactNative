import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { STATUS_COLORS, themes } from '../../constants/colors';

const Status = React.memo(({
	status, size, style, theme, ...props
}) => (
	<View
		style={
			[
				style,
				{
					borderRadius: size,
					width: size,
					height: size,
					backgroundColor: STATUS_COLORS[status] ?? STATUS_COLORS.offline,
					borderColor: themes[theme].backgroundColor
				}
			]}
		{...props}
	/>
));
Status.propTypes = {
	status: PropTypes.string,
	size: PropTypes.number,
	style: PropTypes.any,
	theme: PropTypes.string
};
Status.defaultProps = {
	status: 'offline',
	size: 16,
	theme: 'light'
};

export default Status;

import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import styles from './styles';

const GeolocationIcon = React.memo(({
	RADIUS_CONTAINER, theme, WIDTH_HEIGHT_CONTAINER, WIDTH_HEIGHT_SUB, RADIUS_SUB
}) => {
	return (
		<View style={[styles.geolocation, {
			borderColor: themes[theme].tintColor,
			width: WIDTH_HEIGHT_CONTAINER,
			height: WIDTH_HEIGHT_CONTAINER,
			borderRadius: RADIUS_CONTAINER
		}]}
		>
			<View style={[
				styles.geolocationUser, {
					backgroundColor: themes[theme].tintColor,
					width: WIDTH_HEIGHT_SUB,
					height: WIDTH_HEIGHT_SUB,
					borderRadius: RADIUS_SUB
				}]}
			/>
		</View>
	);
});

export default GeolocationIcon;

GeolocationIcon.propTypes = {
	theme: PropTypes.string,
	WIDTH_HEIGHT_CONTAINER: PropTypes.number,
	WIDTH_HEIGHT_SUB: PropTypes.number,
	RADIUS_CONTAINER: PropTypes.number,
	RADIUS_SUB: PropTypes.number
};

import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute'
	}
});

const EmptyRoom = React.memo(({
	length, mounted, theme, rid
}) => {
	if ((length === 0 && mounted) || !rid) {
		return (
			<ImageBackground
				source={{ uri: `message_empty_${ theme }` }}
				style={styles.image}
			/>
		);
	}
	return null;
});

EmptyRoom.propTypes = {
	length: PropTypes.number.isRequired,
	mounted: PropTypes.bool,
	theme: PropTypes.string,
	rid: PropTypes.string
};
export default EmptyRoom;

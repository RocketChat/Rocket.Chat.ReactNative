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

const EmptyRoom = React.memo(({ length, mounted, rid }) => {
	if ((length === 0 && mounted) || !rid) {
		return <ImageBackground source={{ uri: 'message_empty' }} style={styles.image} />;
	}
	return null;
});

EmptyRoom.propTypes = {
	length: PropTypes.number.isRequired,
	rid: PropTypes.string,
	mounted: PropTypes.bool
};
export default EmptyRoom;

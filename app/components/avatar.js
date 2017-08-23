import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';


const styles = StyleSheet.create({ iconContainer: {
	height: 40,
	width: 40,
	borderRadius: 20,
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center'
},
icon: {
	fontSize: 20,
	color: '#fff'
},
avatar: {
	width: 40,
	height: 40,
	position: 'absolute'
},
avatarInitials: {
	fontSize: 20,
	color: '#ffffff'
} });


const avatar = ({ text = '', width = 25, height = 25, fontSize = 12, baseUrl,
	borderRadius = 2, style }) => {
	const { initials, color } = avatarInitialsAndColor(`${ text }`);
	return (
		<View style={[styles.iconContainer, { backgroundColor: color }, { width,
			height,
			borderRadius }, style]}
		>
			<Text style={[styles.avatarInitials, { fontSize }]}>{initials}</Text>
			{ baseUrl ? <CachedImage style={styles.avatar} source={{ uri: `${ baseUrl }/avatar/${ name }` }} /> : null}
		</View>);
};

avatar.propTypes = {
	baseUrl: PropTypes.string,
	text: PropTypes.string.isRequired,
	width: PropTypes.number,
	fontSize: PropTypes.number,
	height: PropTypes.number,
	borderRadius: PropTypes.number
};
export default avatar;

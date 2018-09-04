import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import openLink from '../../utils/openLink';
import Touch from '../../utils/touch';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 2
	},
	textContainer: {
		backgroundColor: '#F3F4F5',
		flex: 1,
		flexDirection: 'column',
		padding: 15,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		fontWeight: '500',
		color: '#1D74F5',
		fontSize: 16
	},
	description: {
		marginTop: 2,
		fontSize: 16,
		color: '#0C0D0F'
	},
	url: {
		marginTop: 4,
		fontSize: 15,
		color: '#9EA2A8'
	},
	marginTop: {
		marginTop: 4
	}
});

const onPress = (url) => {
	openLink(url);
};
const Url = ({ url, index }) => {
	if (!url) {
		return null;
	}
	return (
		<Touch onPress={() => onPress(url.url)} style={[styles.button, index > 0 && styles.marginTop]}>
			<View style={styles.textContainer}>
				<Text style={styles.title}>{url.title}</Text>
				<Text style={styles.description} numberOfLines={3}>{url.description}</Text>
				<Text style={styles.url} numberOfLines={1}>{url.url}</Text>
			</View>
		</Touch>
	);
};

Url.propTypes = {
	url: PropTypes.object.isRequired,
	index: PropTypes.number
};

export default Url;

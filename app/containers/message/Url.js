import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from 'react-native-fast-image';

import openLink from '../../utils/openLink';
import Touch from '../../utils/touch';

const styles = StyleSheet.create({
	button: {
		marginTop: 10
	},
	container: {
		flex: 1,
		flexDirection: 'column',
		borderRadius: 4,
		backgroundColor: '#F3F4F5'
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		padding: 15,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		fontWeight: '500',
		color: '#1D74F5',
		fontSize: 16,
		marginTop: 5
	},
	description: {
		marginTop: 5,
		fontSize: 16,
		color: '#0C0D0F'
	},
	url: {
		fontSize: 15,
		fontWeight: '500',
		color: '#9EA2A8'
	},
	marginTop: {
		marginTop: 4
	},
	image: {
		width: '100%',
		height: 150,
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4
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
			<View style={styles.container}>
				{url.image ? <FastImage source={{ uri: url.image }} style={styles.image} resizeMode={FastImage.resizeMode.cover} /> : null}
				<View style={styles.textContainer}>
					<Text style={styles.url} numberOfLines={1}>{url.url}</Text>
					<Text style={styles.title} numberOfLines={2}>{url.title}</Text>
					<Text style={styles.description} numberOfLines={2}>{url.description}</Text>
				</View>
			</View>
		</Touch>
	);
};

Url.propTypes = {
	url: PropTypes.object.isRequired,
	index: PropTypes.number
};

export default Url;

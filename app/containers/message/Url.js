import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import PropTypes from 'prop-types';

import QuoteMark from './QuoteMark';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 2
	},
	quoteSign: {
		borderWidth: 2,
		borderRadius: 4,
		borderColor: '#a0a0a0',
		height: '100%',
		marginRight: 5
	},
	image: {
		height: 80,
		width: 80,
		resizeMode: 'cover',
		borderRadius: 6
	},
	textContainer: {
		flex: 1,
		height: '100%',
		flexDirection: 'column',
		padding: 4,
		justifyContent: 'flex-start',
		alignItems: 'flex-start'
	},
	title: {
		fontWeight: 'bold',
		fontSize: 12
	},
	description: {
		fontSize: 12
	}
});

const onPress = (url) => {
	Linking.openURL(url);
};
const Url = ({ url }) => {
	if (!url) {
		return null;
	}
	return (
		<TouchableOpacity onPress={() => onPress(url.url)} style={styles.button}>
			<QuoteMark />
			<Image
				style={styles.image}
				source={{ uri: encodeURI(url.image) }}
			/>
			<View style={styles.textContainer}>
				<Text style={styles.title}>{url.title}</Text>
				<Text style={styles.description} numberOfLines={1}>{url.description}</Text>
			</View>
		</TouchableOpacity>
	);
};

Url.propTypes = {
	url: PropTypes.object.isRequired
};

export default Url;

import React from 'react';
import { ScrollView, View, Text, TouchableWithoutFeedback } from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';

const styles = {
	imageWrapper: {
		alignItems: 'stretch',
		flex: 1
	},
	image: {
		flex: 1
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		marginVertical: 10
	},
	title: {
		color: '#ffffff',
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '600'
	},
	description: {
		color: '#ffffff',
		textAlign: 'center',
		fontSize: 14,
		fontWeight: '500'
	}
};

export default class PhotoModal extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string.isRequired,
		description: PropTypes.string,
		image: PropTypes.string.isRequired,
		isVisible: PropTypes.bool,
		onClose: PropTypes.func.isRequired
	}
	render() {
		const {
			image, isVisible, onClose, title, description
		} = this.props;
		return (
			<Modal
				isVisible={isVisible}
				onBackdropPress={onClose}
				onBackButtonPress={onClose}
			>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>
				</TouchableWithoutFeedback>
				<View style={styles.imageWrapper}>
					<ScrollView contentContainerStyle={styles.imageWrapper} maximumZoomScale={5}>
						<TouchableWithoutFeedback onPress={onClose}>
							<FastImage
								style={styles.image}
								source={{ uri: encodeURI(image) }}
								mutable
								resizeMode='contain'
							/>
						</TouchableWithoutFeedback>
					</ScrollView>
				</View>
			</Modal>
		);
	}
}

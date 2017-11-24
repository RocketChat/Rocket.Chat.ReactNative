import React from 'react';
import { ScrollView, View, Text, TouchableWithoutFeedback } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
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
	}
};

export default class extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string.isRequired,
		image: PropTypes.string.isRequired,
		isVisible: PropTypes.bool,
		onClose: PropTypes.func.isRequired
	}
	render() {
		const {
			image, isVisible, onClose, title
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
					</View>
				</TouchableWithoutFeedback>
				<View style={styles.imageWrapper}>
					<ScrollView contentContainerStyle={styles.imageWrapper} maximumZoomScale={5}>
						<TouchableWithoutFeedback onPress={onClose}>
							<CachedImage
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

import React from 'react';
import { ScrollView, View, Dimensions, Text } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';

const deviceWidth = Dimensions.get('window').width;

const styles = {
	imageWrapper: {
		alignItems: 'stretch'
	},
	image: {
		width: deviceWidth,
		height: deviceWidth
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		marginBottom: 15
	},
	title: {
		color: '#ffffff',
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
		const { image, isVisible, onClose, title } = this.props;
		return (
			<Modal
				isVisible={isVisible}
				onBackdropPress={onClose}
				onBackButtonPress={onClose}
			>
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{title}</Text>
				</View>
				<View style={styles.imageWrapper}>
					<ScrollView contentContainerStyle={styles.imageWrapper} maximumZoomScale={1.5}>
						<CachedImage
							style={styles.image}
							source={{ uri: encodeURI(image) }}
							mutable
							resizeMode={'contain'}
						/>
					</ScrollView>
				</View>
			</Modal>
		);
	}
}

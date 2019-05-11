import React from 'react';
import {
	View, Text, TouchableWithoutFeedback, ActivityIndicator, StyleSheet, Platform, Alert, CameraRoll, PermissionsAndroid
} from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';
import { responsive } from 'react-native-responsive-ui';
import RNFetchBlob from 'rn-fetch-blob';

import { isAndroid } from '../../utils/deviceInfo';

import sharedStyles from '../../views/Styles';
import { COLOR_WHITE } from '../../constants/colors';

const styles = StyleSheet.create({
	imageWrapper: {
		flex: 1
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		marginVertical: 10
	},
	title: {
		color: COLOR_WHITE,
		textAlign: 'center',
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	description: {
		color: COLOR_WHITE,
		textAlign: 'center',
		fontSize: 14,
		...sharedStyles.textMedium
	},
	indicatorContainer: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const margin = 40;

@responsive
export default class PhotoModal extends React.PureComponent {
	static propTypes = {
		title: PropTypes.string.isRequired,
		description: PropTypes.string,
		image: PropTypes.string.isRequired,
		isVisible: PropTypes.bool,
		onClose: PropTypes.func.isRequired,
		window: PropTypes.object
	}

	saveToCameraRoll = async(image) => {
		if (Platform.OS === 'android') {
			if (await this.permission()) {
				RNFetchBlob
					.config({
						fileCache: true,
						appendExt: 'jpg'
					})
					.fetch('GET', image)
					.then((res) => {
						CameraRoll.saveToCameraRoll(res.path())
							.then(() => Alert.alert('Success', 'Photo added to camera roll!'))
							.catch(err => console.error('err:', err));
					});
			}
		} else {
			CameraRoll.saveToCameraRoll(image)
				.then(() => Alert.alert('Success', 'Photo added to camera roll!'))
				.catch(() => Alert.alert('Error', 'You declined access to camera roll!'));
		}
	}

	permission = async() => {
		if (!isAndroid) {
			return true;
		}

		const rationale = {
			title: 'Rocket.Chat needs permission',
			message: 'Rocket.Chat needs access to your storage so you can save your photos.'
		};

		const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
		return result === true || result === PermissionsAndroid.RESULTS.GRANTED;
	}

	render() {
		const {
			image, isVisible, onClose, title, description, window: { width, height }
		} = this.props;
		return (
			<Modal
				isVisible={isVisible}
				style={{ alignItems: 'center' }}
				onBackdropPress={onClose}
				onBackButtonPress={onClose}
				animationIn='fadeIn'
				animationOut='fadeOut'
			>
				<View style={{ width: width - margin, height: height - margin }}>
					<TouchableWithoutFeedback onPress={onClose}>
						<View style={styles.titleContainer}>
							<Text style={styles.title}>{title}</Text>
							<Text style={styles.description}>{description}</Text>
						</View>
					</TouchableWithoutFeedback>
					<View style={styles.imageWrapper}>
						<ImageViewer
							imageUrls={[{ url: encodeURI(image) }]}
							onClick={onClose}
							onSave={() => this.saveToCameraRoll(encodeURI(image))}
							backgroundColor='transparent'
							enableSwipeDown
							onSwipeDown={onClose}
							renderIndicator={() => { }}
							renderImage={props => <FastImage {...props} />}
							loadingRender={() => (
								<View style={[styles.indicatorContainer, { width, height }]}>
									<ActivityIndicator />
								</View>
							)}
						/>
					</View>
				</View>
			</Modal>
		);
	}
}

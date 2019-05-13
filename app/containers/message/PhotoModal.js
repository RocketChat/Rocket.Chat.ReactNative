import React from 'react';
import {
	View, Text, TouchableWithoutFeedback, ActivityIndicator, StyleSheet, CameraRoll, PermissionsAndroid
} from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';
import { responsive } from 'react-native-responsive-ui';
import RNFetchBlob from 'rn-fetch-blob';

import I18n from '../../i18n';
import { isAndroid } from '../../utils/deviceInfo';
import { showToast, showErrorAlert } from '../../utils/info';
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

	saveToCameraRoll = async() => {
		const { image } = this.props;
		let url = encodeURI(image);
		if (isAndroid) {
			const isUserGrantedPermissions = await this.permission();
			if (isUserGrantedPermissions) {
				const res = await RNFetchBlob
					.config({
						fileCache: true,
						appendExt: 'jpg'
					})
					.fetch('GET', url);
				url = res.path();
			} else {
				showErrorAlert(I18n.t('Save_To_Camera_Error'), I18n.t('Save_To_Camera_Error_Message'));
			}
		}
		try {
			await CameraRoll.saveToCameraRoll(url);
			showToast(I18n.t('Save_To_Camera_Success_Message'));
		} catch {
			showErrorAlert(I18n.t('Save_To_Camera_Error'), I18n.t('Save_To_Camera_Error_Message'));
		}
	}

	permission = async() => {
		const rationale = {
			title: I18n.t('Write_External_Permission'),
			message: I18n.t('Write_External_Permission_Message')
		};

		const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
		return result || result === PermissionsAndroid.RESULTS.GRANTED;
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
							onSave={this.saveToCameraRoll}
							backgroundColor='transparent'
							enableSwipeDown
							onSwipeDown={onClose}
							renderIndicator={() => {}}
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

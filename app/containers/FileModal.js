import React, { useState } from 'react';
import {
	View, Text, TouchableWithoutFeedback, StyleSheet, SafeAreaView
} from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import {
	FileSystem
} from 'react-native-unimodules';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Video } from 'expo-av';

import sharedStyles from '../views/Styles';
import { formatAttachmentUrl } from '../lib/utils';
import ActivityIndicator from './ActivityIndicator';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { LISTENER } from './Toast';
import EventEmitter from '../utils/events';
import I18n from '../i18n';

const styles = StyleSheet.create({
	safeArea: {
		flex: 1
	},
	modal: {
		margin: 0
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		marginVertical: 10
	},
	title: {
		textAlign: 'center',
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	description: {
		textAlign: 'center',
		fontSize: 14,
		...sharedStyles.textMedium
	},
	video: {
		flex: 1
	}
});
const handleSave = async(img) => {
	try {
		const file = `${ FileSystem.documentDirectory + img[0] + Math.floor(Math.random() * 1000) }.jpg`;
		const { uri } = await FileSystem.downloadAsync(img, file);
		await CameraRoll.saveToCameraRoll(uri);
		EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
	} catch (e) {
		EventEmitter.emit(LISTENER, { message: I18n.t('error-save-image') });
	}

	// FileSystem.downloadAsync(img, `${ FileSystem.documentDirectory + img[0] + Math.floor(Math.random() * 1000) }.jpg`)
	// 	.then(({ uri }) => {
	// 		CameraRoll.saveToCameraRoll(uri).then(() => {
	// 			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
	// 		}).catch(() => {
	// 			EventEmitter.emit(LISTENER, { message: I18n.t('error-save-image') });
	// 		});
	// 	})
	// 	.catch(() => {
	// 		EventEmitter.emit(LISTENER, { message: I18n.t('error-save-image') });
	// 	});
};

const ModalContent = React.memo(({
	attachment, onClose, user, baseUrl, theme
}) => {
	if (attachment && attachment.image_url) {
		const url = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
		return (
			<SafeAreaView style={styles.safeArea}>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].buttonText }]}>{attachment.title}</Text>
						{attachment.description ? <Text style={[styles.description, { color: themes[theme].buttonText }]}>{attachment.description}</Text> : null}
					</View>
				</TouchableWithoutFeedback>
				<ImageViewer
					imageUrls={[{ url }]}
					onClick={onClose}
					backgroundColor='transparent'
					enableSwipeDown
					onSwipeDown={onClose}
					onSave={handleSave}
					renderIndicator={() => null}
					renderImage={props => <FastImage {...props} />}
					loadingRender={() => <ActivityIndicator size='large' theme={theme} />}
				/>
			</SafeAreaView>
		);
	}
	if (attachment && attachment.video_url) {
		const [loading, setLoading] = useState(true);
		const uri = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
		return (
			<>
				<Video
					source={{ uri }}
					rate={1.0}
					volume={1.0}
					isMuted={false}
					resizeMode={Video.RESIZE_MODE_CONTAIN}
					shouldPlay
					isLooping={false}
					style={styles.video}
					useNativeControls
					onReadyForDisplay={() => setLoading(false)}
					onLoadStart={() => setLoading(true)}
					onError={console.log}
				/>
				{ loading ? <ActivityIndicator size='large' theme={theme} absolute /> : null }
			</>
		);
	}
	return null;
});

const FileModal = React.memo(({
	isVisible, onClose, attachment, user, baseUrl, theme
}) => (
	<Modal
		style={styles.modal}
		isVisible={isVisible}
		onBackdropPress={onClose}
		onBackButtonPress={onClose}
		onSwipeComplete={onClose}
		swipeDirection={['up', 'down']}
	>
		<ModalContent attachment={attachment} onClose={onClose} user={user} baseUrl={baseUrl} theme={theme} />
	</Modal>
), (prevProps, nextProps) => (
	prevProps.isVisible === nextProps.isVisible && prevProps.loading === nextProps.loading && prevProps.theme === nextProps.theme
));

FileModal.propTypes = {
	isVisible: PropTypes.bool,
	attachment: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	theme: PropTypes.string,
	onClose: PropTypes.func
};
FileModal.displayName = 'FileModal';

ModalContent.propTypes = {
	attachment: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	theme: PropTypes.string,
	onClose: PropTypes.func
};
ModalContent.displayName = 'FileModalContent';

export default withTheme(FileModal);

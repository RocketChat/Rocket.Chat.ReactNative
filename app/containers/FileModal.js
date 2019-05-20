import React from 'react';
import {
	View, Text, TouchableWithoutFeedback, ActivityIndicator, StyleSheet, SafeAreaView
} from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';
import VideoPlayer from 'react-native-video-controls';

import sharedStyles from '../views/Styles';
import { COLOR_WHITE } from '../constants/colors';
import { formatAttachmentUrl } from '../lib/utils';

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
	indicator: {
		flex: 1
	}
});

const Indicator = React.memo(() => (
	<ActivityIndicator style={styles.indicator} />
));

const ModalContent = React.memo(({
	attachment, onClose, user, baseUrl
}) => {
	if (attachment && attachment.image_url) {
		const url = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
		return (
			<SafeAreaView style={styles.safeArea}>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{attachment.title}</Text>
						{attachment.description ? <Text style={styles.description}>{attachment.description}</Text> : null}
					</View>
				</TouchableWithoutFeedback>
				<ImageViewer
					imageUrls={[{ url }]}
					onClick={onClose}
					backgroundColor='transparent'
					enableSwipeDown
					onSwipeDown={onClose}
					renderIndicator={() => null}
					renderImage={props => <FastImage {...props} />}
					loadingRender={() => <Indicator />}
				/>
			</SafeAreaView>
		);
	}
	if (attachment && attachment.video_url) {
		const uri = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
		return (
			<SafeAreaView style={styles.safeArea}>
				<VideoPlayer
					source={{ uri }}
					onBack={onClose}
					disableVolume
				/>
			</SafeAreaView>
		);
	}
	return null;
});

const FileModal = React.memo(({
	isVisible, onClose, attachment, user, baseUrl
}) => (
	<Modal
		style={styles.modal}
		isVisible={isVisible}
		onBackdropPress={onClose}
		onBackButtonPress={onClose}
		onSwipeComplete={onClose}
		swipeDirection={['up', 'left', 'right', 'down']}
	>
		<ModalContent attachment={attachment} onClose={onClose} user={user} baseUrl={baseUrl} />
	</Modal>
), (prevProps, nextProps) => prevProps.isVisible === nextProps.isVisible);

FileModal.propTypes = {
	isVisible: PropTypes.bool,
	attachment: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	onClose: PropTypes.func
};
FileModal.displayName = 'FileModal';

ModalContent.propTypes = {
	attachment: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	onClose: PropTypes.func
};
ModalContent.displayName = 'FileModalContent';

export default FileModal;

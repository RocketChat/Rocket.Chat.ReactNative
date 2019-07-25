import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';

import sharedStyles from '../views/Styles';
import { COLOR_WHITE } from '../constants/colors';
import { formatAttachmentUrl } from '../lib/utils';
import Navigation from '../lib/Navigation';

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

const ModalContent = React.memo(({
	attachment, onClose, user, baseUrl
}) => {
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
}) => {
	if (attachment && attachment.image_url) {
		const url = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
		Navigation.navigate('ImageModal', { url });
		onClose();
		return null;
	}
	return (
		<Modal
			style={styles.modal}
			isVisible={isVisible}
			onBackdropPress={onClose}
			onBackButtonPress={onClose}
			onSwipeComplete={onClose}
			swipeDirection={['up', 'left', 'right', 'down']}
			propagateSwipe
		>
			<ModalContent attachment={attachment} onClose={onClose} user={user} baseUrl={baseUrl} />
		</Modal>
	);
}, (prevProps, nextProps) => prevProps.isVisible === nextProps.isVisible);

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

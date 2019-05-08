import React from 'react';
import {
	View, Text, TouchableWithoutFeedback, ActivityIndicator, StyleSheet, SafeAreaView
} from 'react-native';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import ImageViewer from 'react-native-image-zoom-viewer';

import sharedStyles from '../views/Styles';
import { COLOR_WHITE } from '../constants/colors';
import RocketChat from '../lib/rocketchat';

const styles = StyleSheet.create({
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

const ModalContent = React.memo(({ attachment, onClose }) => {
	if (attachment && attachment.image_url) {
		const url = RocketChat.formatAttachmentUrl(attachment.image_url);
		return (
			<SafeAreaView style={{ flex: 1 }}>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{attachment.title}</Text>
						{attachment.description ? <Text style={styles.description}>{attachment.description}</Text> : null}
					</View>
				</TouchableWithoutFeedback>
				<ImageViewer
					imageUrls={[{ url: encodeURI(url) }]}
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
	return null;
});

const FileModal = React.memo(({ isVisible, onClose, attachment }) => (
	<Modal
		style={styles.modal}
		isVisible={isVisible}
		onBackdropPress={onClose}
		onBackButtonPress={onClose}
		onSwipeComplete={onClose}
		swipeDirection={['up', 'left', 'right', 'down']}
	>
		<ModalContent attachment={attachment} onClose={onClose} />
	</Modal>
), (prevProps, nextProps) => prevProps.isVisible === nextProps.isVisible);

export default FileModal;

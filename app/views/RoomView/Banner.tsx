import React from 'react';
import { Text, View } from 'react-native';
import { BorderlessButton, ScrollView } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import Markdown, { MarkdownPreview } from '../../containers/markdown';
import { CustomIcon } from '../../containers/CustomIcon';
import { themes } from '../../lib/constants';
import styles from './styles';
import { useTheme } from '../../theme';

interface IBannerProps {
	text?: string;
	title?: string;
	bannerClosed?: boolean;
	closeBanner: () => void;
	showAnnouncementModal?: boolean;
	toggleAnnouncementModal: () => void;
}

const Banner = ({ text, title, bannerClosed, closeBanner, showAnnouncementModal, toggleAnnouncementModal }: IBannerProps) => {
	const { theme } = useTheme();

	if (text && !bannerClosed) {
		return (
			<>
				<BorderlessButton
					style={[styles.bannerContainer, { backgroundColor: themes[theme].bannerBackground }]}
					testID='room-view-banner'
					onPress={toggleAnnouncementModal}
				>
					<MarkdownPreview msg={text} style={[styles.bannerText]} />
					<BorderlessButton onPress={closeBanner}>
						<CustomIcon color={themes[theme].auxiliaryText} name='close' size={20} />
					</BorderlessButton>
				</BorderlessButton>
				<Modal
					onBackdropPress={toggleAnnouncementModal}
					onBackButtonPress={toggleAnnouncementModal}
					useNativeDriver
					isVisible={showAnnouncementModal}
					animationIn='fadeIn'
					animationOut='fadeOut'
					presentationStyle='overFullScreen'
				>
					<View style={[styles.modalView, { backgroundColor: themes[theme].bannerBackground }]}>
						<Text style={[styles.bannerModalTitle, { color: themes[theme].auxiliaryText }]}>{title}</Text>
						<ScrollView style={styles.modalScrollView}>
							<Markdown msg={text} theme={theme} />
						</ScrollView>
					</View>
				</Modal>
			</>
		);
	}

	return null;
};

export default Banner;

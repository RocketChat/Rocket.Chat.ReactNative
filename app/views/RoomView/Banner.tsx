import React, { useState } from 'react';
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
}

const Banner = React.memo(
	({ text, title, bannerClosed, closeBanner }: IBannerProps) => {
		const [showModal, openModal] = useState(false);
		const { theme } = useTheme();

		const toggleModal = () => openModal(prevState => !prevState);

		if (text && !bannerClosed) {
			return (
				<>
					<BorderlessButton
						style={[styles.bannerContainer, { backgroundColor: themes[theme].surfaceNeutral }]}
						testID='room-view-banner'
						onPress={toggleModal}>
						<MarkdownPreview msg={text} style={[styles.bannerText]} />
						<BorderlessButton onPress={closeBanner} hitSlop={10}>
							<CustomIcon color={themes[theme].fontSecondaryInfo} name='close' size={20} />
						</BorderlessButton>
					</BorderlessButton>
					<Modal
						onBackdropPress={toggleModal}
						onBackButtonPress={toggleModal}
						useNativeDriver
						isVisible={showModal}
						animationIn='fadeIn'
						animationOut='fadeOut'>
						<View style={[styles.modalView, { backgroundColor: themes[theme].surfaceNeutral }]}>
							<Text style={[styles.bannerModalTitle, { color: themes[theme].fontSecondaryInfo }]}>{title}</Text>
							<ScrollView style={styles.modalScrollView}>
								<Markdown msg={text} />
							</ScrollView>
						</View>
					</Modal>
				</>
			);
		}

		return null;
	},
	(prevProps, nextProps) => prevProps.text === nextProps.text && prevProps.bannerClosed === nextProps.bannerClosed
);

export default Banner;

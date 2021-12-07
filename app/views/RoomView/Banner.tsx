import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { BorderlessButton, ScrollView } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import Markdown from '../../containers/markdown';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import styles from './styles';

interface IRoomBannerProps {
	text: string;
	title: string;
	theme: string;
	bannerClosed: boolean;
	closeBanner(): void;
	rid?: string; // TODO - verify if this props exist
}

const Banner = React.memo(
	({ text, title, theme, bannerClosed, closeBanner }: IRoomBannerProps) => {
		const [showModal, openModal] = useState(false);

		const toggleModal = () => openModal(prevState => !prevState);

		if (text && !bannerClosed) {
			return (
				<>
					<BorderlessButton
						style={[styles.bannerContainer, { backgroundColor: themes[theme].bannerBackground }]}
						testID='room-view-banner'
						onPress={toggleModal}>
						{/* @ts-ignore*/}
						<Markdown msg={text} theme={theme} numberOfLines={1} style={[styles.bannerText]} preview />
						<BorderlessButton onPress={closeBanner}>
							<CustomIcon color={themes[theme].auxiliaryText} name='close' size={20} />
						</BorderlessButton>
					</BorderlessButton>
					<Modal
						onBackdropPress={toggleModal}
						onBackButtonPress={toggleModal}
						useNativeDriver
						isVisible={showModal}
						animationIn='fadeIn'
						animationOut='fadeOut'>
						<View style={[styles.modalView, { backgroundColor: themes[theme].bannerBackground }]}>
							<Text style={[styles.bannerModalTitle, { color: themes[theme].auxiliaryText }]}>{title}</Text>
							<ScrollView style={styles.modalScrollView}>
								{/* @ts-ignore*/}
								<Markdown msg={text} theme={theme} />
							</ScrollView>
						</View>
					</Modal>
				</>
			);
		}

		return null;
	},
	(prevProps, nextProps) =>
		prevProps.text === nextProps.text && prevProps.theme === nextProps.theme && prevProps.bannerClosed === nextProps.bannerClosed
);

export default Banner;

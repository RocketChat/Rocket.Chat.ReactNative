import { memo, useState } from 'react';
import { Text } from 'react-native';
import { BorderlessButton, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import Markdown, { MarkdownPreview } from '../../../containers/markdown';
import { CustomIcon } from '../../../containers/CustomIcon';
import styles from '../styles';
import { useTheme } from '../../../theme';

interface IBannerProps {
	text?: string;
	title?: string;
	bannerClosed?: boolean;
	closeBanner: () => void;
}

const Banner = memo(
	({ text, title, bannerClosed, closeBanner }: IBannerProps) => {
		const [showModal, openModal] = useState(false);
		const { colors } = useTheme();

		const toggleModal = () => openModal(prevState => !prevState);

		if (text && !bannerClosed) {
			return (
				<>
					<BorderlessButton
						style={[styles.bannerContainer, { backgroundColor: colors.surfaceNeutral }]}
						testID='room-view-banner'
						onPress={toggleModal}>
						<MarkdownPreview msg={text} style={styles.bannerText} />
						<BorderlessButton onPress={closeBanner} hitSlop={10}>
							<CustomIcon color={colors.fontSecondaryInfo} name='close' size={20} />
						</BorderlessButton>
					</BorderlessButton>
					<Modal
						onBackdropPress={toggleModal}
						onBackButtonPress={toggleModal}
						useNativeDriver
						isVisible={showModal}
						animationIn='fadeIn'
						animationOut='fadeOut'>
						<GestureHandlerRootView style={[styles.modalView, { backgroundColor: colors.surfaceNeutral }]}>
							<Text style={[styles.bannerModalTitle, { color: colors.fontSecondaryInfo }]}>{title}</Text>
							<ScrollView style={styles.modalScrollView}>
								<Markdown msg={text} />
							</ScrollView>
						</GestureHandlerRootView>
					</Modal>
				</>
			);
		}

		return null;
	},
	(prevProps, nextProps) => prevProps.text === nextProps.text && prevProps.bannerClosed === nextProps.bannerClosed
);

export default Banner;

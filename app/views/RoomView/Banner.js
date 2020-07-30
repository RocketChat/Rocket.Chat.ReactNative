import React, { useState } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { ScrollView, BorderlessButton } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import Markdown from '../../containers/markdown';

import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import styles from './styles';

const Banner = React.memo(({
	text, title, theme, bannerClosed, closeBanner
}) => {
	const [showModal, openModal] = useState(false);

	const toggleModal = () => openModal(prevState => !prevState);

	if (text && !bannerClosed) {
		return (
			<>
				<BorderlessButton
					style={[styles.bannerContainer, { backgroundColor: themes[theme].bannerBackground }]}
					testID='room-view-banner'
					onPress={toggleModal}
				>
					<Markdown
						msg={text}
						theme={theme}
						numberOfLines={1}
						style={[styles.bannerText]}
						preview
					/>
					<BorderlessButton onPress={closeBanner}>
						<CustomIcon
							color={themes[theme].auxiliaryText}
							name='close'
							size={20}
						/>
					</BorderlessButton>
				</BorderlessButton>
				<Modal
					onBackdropPress={toggleModal}
					onBackButtonPress={toggleModal}
					useNativeDriver
					isVisible={showModal}
					animationIn='fadeIn'
					animationOut='fadeOut'
				>
					<View style={[styles.modalView, { backgroundColor: themes[theme].bannerBackground }]}>
						<Text style={[styles.bannerModalTitle, { color: themes[theme].auxiliaryText }]}>{title}</Text>
						<ScrollView style={styles.modalScrollView}>
							<Markdown
								msg={text}
								theme={theme}
							/>
						</ScrollView>
					</View>
				</Modal>
			</>
		);
	}

	return null;
}, (prevProps, nextProps) => prevProps.text === nextProps.text && prevProps.theme === nextProps.theme && prevProps.bannerClosed === nextProps.bannerClosed);

Banner.propTypes = {
	text: PropTypes.string,
	title: PropTypes.string,
	theme: PropTypes.string,
	bannerClosed: PropTypes.bool,
	closeBanner: PropTypes.func
};

export default Banner;

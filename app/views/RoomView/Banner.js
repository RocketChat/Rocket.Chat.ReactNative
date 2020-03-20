import React, { useState } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { ScrollView, BorderlessButton } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import Markdown from '../../containers/markdown';

import { themes } from '../../constants/colors';
import styles from './styles';

const Banner = React.memo(({
	text, title, theme
}) => {
	const [showModal, openModal] = useState(false);

	const toggleModal = () => openModal(prevState => !prevState);

	if (text) {
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
						preview
					/>
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
}, (prevProps, nextProps) => prevProps.text === nextProps.text && prevProps.theme === nextProps.theme);

Banner.propTypes = {
	text: PropTypes.string,
	title: PropTypes.string,
	theme: PropTypes.string
};

export default Banner;

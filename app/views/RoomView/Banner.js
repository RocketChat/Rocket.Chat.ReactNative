import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ScrollView, BorderlessButton } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';

import I18n from '../../i18n';
import Markdown from '../../containers/markdown';

import { getUserSelector } from '../../selectors/login';
import { themes } from '../../constants/colors';
import styles from './styles';

const Banner = React.memo(({
	announcement, statusText, type, theme
}) => {
	const [showModal, openModal] = useState(false);

	const toggleModal = () => openModal(prevState => !prevState);

	if (announcement || statusText) {
		return (
			<>
				<BorderlessButton
					style={[styles.announcementTextContainer, { backgroundColor: themes[theme].bannerBackground }]}
					testID='room-view-banner'
					onPress={toggleModal}
				>
					<Markdown
						msg={announcement || statusText}
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
						<Text style={[styles.announcementTitle, { color: themes[theme].auxiliaryText }]}>{type === 'd' ? I18n.t('Custom_Status') : I18n.t('Announcement')}</Text>
						<ScrollView style={styles.modalScrollView}>
							<Markdown
								msg={announcement || statusText}
								theme={theme}
							/>
						</ScrollView>
					</View>
				</Modal>
			</>
		);
	}

	return null;
}, (prevProps, nextProps) => prevProps.statusText === nextProps.statusText);

Banner.propTypes = {
	announcement: PropTypes.string,
	statusText: PropTypes.string,
	type: PropTypes.string,
	theme: PropTypes.string
};


const mapStateToProps = (state, ownProps) => {
	let statusText;
	const { rid, type } = ownProps;
	if (type === 'd') {
		const user = getUserSelector(state);
		if (user.id) {
			const userId = rid.replace(user.id, '').trim();
			statusText = state.activeUsers[userId] && state.activeUsers[userId].statusText;
		}
	}

	return {
		statusText: statusText || ownProps.statusText
	};
};

export default connect(mapStateToProps)(Banner);

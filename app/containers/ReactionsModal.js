import React from 'react';
import {
	View, Text, FlatList, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import Touchable from 'react-native-platform-touchable';

import Emoji from './message/Emoji';
import I18n from '../i18n';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import SafeAreaView from './SafeAreaView';

const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: 'transparent'
	},
	titleContainer: {
		alignItems: 'center',
		paddingVertical: 10
	},
	title: {
		textAlign: 'center',
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	reactCount: {
		fontSize: 13,
		...sharedStyles.textRegular
	},
	peopleReacted: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	peopleItemContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	emojiContainer: {
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center'
	},
	itemContainer: {
		height: 50,
		flexDirection: 'row'
	},
	listContainer: {
		flex: 1
	},
	closeButton: {
		position: 'absolute',
		left: 0,
		top: 10
	}
});
const standardEmojiStyle = { fontSize: 20 };
const customEmojiStyle = { width: 20, height: 20 };

const Item = React.memo(({
	item, user, baseUrl, getCustomEmoji, theme
}) => {
	const count = item.usernames.length;
	let usernames = item.usernames.slice(0, 3)
		.map(username => (username === user.username ? I18n.t('you') : username)).join(', ');
	if (count > 3) {
		usernames = `${ usernames } ${ I18n.t('and_more') } ${ count - 3 }`;
	} else {
		usernames = usernames.replace(/,(?=[^,]*$)/, ` ${ I18n.t('and') }`);
	}
	return (
		<View style={styles.itemContainer}>
			<View style={styles.emojiContainer}>
				<Emoji
					content={item.emoji}
					standardEmojiStyle={standardEmojiStyle}
					customEmojiStyle={customEmojiStyle}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
				/>
			</View>
			<View style={styles.peopleItemContainer}>
				<Text style={[styles.reactCount, { color: themes[theme].buttonText }]}>
					{count === 1 ? I18n.t('1_person_reacted') : I18n.t('N_people_reacted', { n: count })}
				</Text>
				<Text style={[styles.peopleReacted, { color: themes[theme].buttonText }]}>{ usernames }</Text>
			</View>
		</View>
	);
});

const ModalContent = React.memo(({
	message, onClose, ...props
}) => {
	if (message && message.reactions) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<Touchable onPress={onClose}>
					<View style={styles.titleContainer}>
						<CustomIcon
							style={[styles.closeButton, { color: themes[props.theme].buttonText }]}
							name='close'
							size={20}
						/>
						<Text style={[styles.title, { color: themes[props.theme].buttonText }]}>{I18n.t('Reactions')}</Text>
					</View>
				</Touchable>
				<FlatList
					style={styles.listContainer}
					data={message.reactions}
					renderItem={({ item }) => <Item item={item} {...props} />}
					keyExtractor={item => item.emoji}
				/>
			</SafeAreaView>
		);
	}
	return null;
});

const ReactionsModal = React.memo(({
	isVisible, onClose, theme, ...props
}) => (
	<Modal
		isVisible={isVisible}
		onBackdropPress={onClose}
		onBackButtonPress={onClose}
		backdropOpacity={0.8}
		onSwipeComplete={onClose}
		swipeDirection={['up', 'left', 'right', 'down']}
	>
		<ModalContent onClose={onClose} theme={theme} {...props} />
	</Modal>
), (prevProps, nextProps) => prevProps.isVisible === nextProps.isVisible && prevProps.theme === nextProps.theme);

ReactionsModal.propTypes = {
	isVisible: PropTypes.bool,
	onClose: PropTypes.func,
	theme: PropTypes.string
};
ReactionsModal.displayName = 'ReactionsModal';

ModalContent.propTypes = {
	message: PropTypes.object,
	onClose: PropTypes.func,
	theme: PropTypes.string
};
ModalContent.displayName = 'ReactionsModalContent';

Item.propTypes = {
	item: PropTypes.object,
	user: PropTypes.object,
	baseUrl: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};
Item.displayName = 'ReactionsModalItem';

export default withTheme(ReactionsModal);

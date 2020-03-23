import React, { useState } from 'react';
import {
	View, Text, StyleSheet, SafeAreaView
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import Touchable from 'react-native-platform-touchable';
import Emoji from './message/Emoji';
import I18n from '../i18n';
import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
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
		marginLeft: 5,
		marginTop: 5,
		...sharedStyles.textRegular
	},
	peopleReacted: {
		fontSize: 18,
		marginBottom: 10,
		...sharedStyles.textMedium
	},
	peopleItemContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	emojiContainer: {
		width: 60,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center'
	},
	itemContainer: {
		flex: 1
	},
	closeButton: {
		position: 'absolute',
		left: 0,
		top: 10
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	scrollContainer: {
		height: 90
	}
});
const standardEmojiStyle = { fontSize: 20 };
const customEmojiStyle = { width: 20, height: 20 };

const renderPeopleList = (item, theme, user) => item.usernames.map(username => (
	<Text style={[styles.peopleReacted, { color: themes[theme].buttonText }]}>
		{username === user.username ? I18n.t('you') : username}
	</Text>
));

const Item = React.memo(({
	item, baseUrl, getCustomEmoji, theme, user
}) => {
	const [users, setUsers] = useState(item[0]);
	const emojiList = item.map(emoji => (
		<View style={styles.emojiContainer}>
			<Touchable onPress={() => { setUsers(emoji); }}>
				<View style={styles.buttonContainer}>
					<Emoji
						content={emoji.emoji}
						standardEmojiStyle={standardEmojiStyle}
						customEmojiStyle={customEmojiStyle}
						baseUrl={baseUrl}
						getCustomEmoji={getCustomEmoji}
					/>
					<Text style={[styles.reactCount, { color: themes[theme].buttonText }]}>
						{emoji.usernames.length}
					</Text>
				</View>
			</Touchable>
		</View>
	));
	return (
		<View style={styles.peopleItemContainer}>
			<View style={styles.scrollContainer}>
				<ScrollView style={styles.itemContainer} horizontal showsHorizontalScrollIndicator={false}>
					{emojiList}
				</ScrollView>
			</View>
			<ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
				{renderPeopleList(users, theme, user)}
			</ScrollView>
		</View>
	);
});

const ModalContent = React.memo(({
	message, onClose, ...props
}) => {
	if (message && message.reactions) {
		return (
			<SafeAreaView style={{ flex: 1 }}>
				<Touchable onPress={onClose}>
					<View style={styles.titleContainer}>
						<CustomIcon
							style={[styles.closeButton, { color: themes[props.theme].buttonText }]}
							name='cross'
							size={20}
						/>
						<Text style={[styles.title, { color: themes[props.theme].buttonText }]}>
							{I18n.t('Reactions')}
						</Text>
					</View>
				</Touchable>
				<Item item={message.reactions} {...props} />
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

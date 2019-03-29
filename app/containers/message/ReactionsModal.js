import React from 'react';
import {
	View, Text, TouchableWithoutFeedback, FlatList, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';

import Emoji from './Emoji';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { COLOR_WHITE } from '../../constants/colors';

const styles = StyleSheet.create({
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: 10
	},
	title: {
		color: COLOR_WHITE,
		textAlign: 'center',
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	reactCount: {
		color: COLOR_WHITE,
		fontSize: 13,
		...sharedStyles.textRegular
	},
	peopleReacted: {
		color: COLOR_WHITE,
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
		top: 10,
		color: COLOR_WHITE
	}
});
const standardEmojiStyle = { fontSize: 20 };
const customEmojiStyle = { width: 20, height: 20 };

export default class ReactionsModal extends React.PureComponent {
	static propTypes = {
		isVisible: PropTypes.bool.isRequired,
		close: PropTypes.func.isRequired,
		reactions: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		customEmojis: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		])
	}

	renderItem = (item) => {
		const { user, customEmojis, baseUrl } = this.props;
		const count = item.usernames.length;
		let usernames = item.usernames.slice(0, 3)
			.map(username => (username.value === user.username ? I18n.t('you') : username.value)).join(', ');
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
						customEmojis={customEmojis}
						baseUrl={baseUrl}
					/>
				</View>
				<View style={styles.peopleItemContainer}>
					<Text style={styles.reactCount}>
						{count === 1 ? I18n.t('1_person_reacted') : I18n.t('N_people_reacted', { n: count })}
					</Text>
					<Text style={styles.peopleReacted}>{ usernames }</Text>
				</View>
			</View>
		);
	}

	render() {
		const {
			isVisible, close, reactions
		} = this.props;
		return (
			<Modal
				isVisible={isVisible}
				onBackdropPress={close}
				onBackButtonPress={close}
				backdropOpacity={0.9}
			>
				<TouchableWithoutFeedback onPress={close}>
					<View style={styles.titleContainer}>
						<CustomIcon
							style={styles.closeButton}
							name='cross'
							size={20}
							onPress={close}
						/>
						<Text style={styles.title}>{I18n.t('Reactions')}</Text>
					</View>
				</TouchableWithoutFeedback>
				<View style={styles.listContainer}>
					<FlatList
						data={reactions}
						renderItem={({ item }) => this.renderItem(item)}
						keyExtractor={item => item.emoji}
					/>
				</View>
			</Modal>
		);
	}
}

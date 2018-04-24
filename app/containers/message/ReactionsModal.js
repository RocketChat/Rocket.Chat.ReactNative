import React from 'react';
import { View, Text, TouchableWithoutFeedback, FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import Emoji from './Emoji';

const styles = StyleSheet.create({
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: 10
	},
	title: {
		color: '#ffffff',
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '600'
	},
	reactCount: {
		color: '#dddddd',
		fontSize: 10
	},
	peopleReacted: {
		color: '#ffffff',
		fontWeight: '500'
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
		color: '#ffffff'
	}
});
const standardEmojiStyle = { fontSize: 20 };
const customEmojiStyle = { width: 20, height: 20 };

@connect(state => ({
	customEmojis: state.customEmojis
}))
export default class ReactionsModal extends React.PureComponent {
	static propTypes = {
		isVisible: PropTypes.bool.isRequired,
		onClose: PropTypes.func.isRequired,
		reactions: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		customEmojis: PropTypes.object.isRequired
	}
	renderItem = (item) => {
		const count = item.usernames.length;
		let usernames = item.usernames.slice(0, 3)
			.map(username => (username.value === this.props.user.username ? 'you' : username.value)).join(', ');
		if (count > 3) {
			usernames = `${ usernames } and more ${ count - 3 }`;
		} else {
			usernames = usernames.replace(/,(?=[^,]*$)/, ' and');
		}
		return (
			<View style={styles.itemContainer}>
				<View style={styles.emojiContainer}>
					<Emoji
						content={item.emoji}
						standardEmojiStyle={standardEmojiStyle}
						customEmojiStyle={customEmojiStyle}
						customEmojis={this.props.customEmojis}
					/>
				</View>
				<View style={styles.peopleItemContainer}>
					<Text style={styles.reactCount}>
						{count === 1 ? '1 person' : `${ count } people`} reacted
					</Text>
					<Text style={styles.peopleReacted}>{ usernames }</Text>
				</View>
			</View>
		);
	}

	render() {
		const {
			isVisible, onClose, reactions
		} = this.props;
		return (
			<Modal
				isVisible={isVisible}
				onBackdropPress={onClose}
				onBackButtonPress={onClose}
				backdropOpacity={0.9}
			>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.titleContainer}>
						<Icon
							style={styles.closeButton}
							name='close'
							size={20}
							onPress={onClose}
						/>
						<Text style={styles.title}>Reactions</Text>
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

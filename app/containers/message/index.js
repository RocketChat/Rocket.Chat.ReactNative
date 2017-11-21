import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Clipboard } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown'; // eslint-disable-line
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';

import Card from './Card';
import User from './User';
import Avatar from '../Avatar';
import {
	deleteRequest,
	editInit,
	starRequest,
	permalinkRequest,
	togglePinRequest,
	setInput
} from '../../actions/messages';
import RocketChat from '../../lib/rocketchat';

const title = 'Message actions';
const options = ['Cancel', 'Reply', 'Edit', 'Permalink', 'Copy', 'Quote', 'Star Message', 'Pin Message', 'Delete'];
const CANCEL_INDEX = 0;
const DESTRUCTIVE_INDEX = 8;

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		flexShrink: 1
	},
	message: {
		padding: 12,
		paddingTop: 6,
		paddingBottom: 6,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	textInfo: {
		fontStyle: 'italic',
		color: '#a0a0a0'
	},
	editing: {
		backgroundColor: '#fff5df'
	}
});

@connect(state => ({
	message: state.messages.message,
	permalink: state.messages.permalink,
	user: state.login.user
}), dispatch => ({
	deleteRequest: message => dispatch(deleteRequest(message)),
	editInit: message => dispatch(editInit(message)),
	starRequest: message => dispatch(starRequest(message)),
	permalinkRequest: message => dispatch(permalinkRequest(message)),
	togglePinRequest: message => dispatch(togglePinRequest(message)),
	setInput: message => dispatch(setInput(message))
}))
export default class Message extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		starRequest: PropTypes.func.isRequired,
		permalinkRequest: PropTypes.func.isRequired,
		togglePinRequest: PropTypes.func.isRequired,
		setInput: PropTypes.func.isRequired,
		user: PropTypes.object.isRequired,
		message: PropTypes.object,
		permalink: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			copyPermalink: false,
			reply: false,
			quote: false
		};
		this.handleActionPress = this.handleActionPress.bind(this);
		this.showActions = this.showActions.bind(this);
	}

	async componentWillReceiveProps(nextProps) {
		if (this.props.permalink !== nextProps.permalink) {
			// copy permalink
			if (this.state.copyPermalink) {
				this.setState({ copyPermalink: false });
				await Clipboard.setString(nextProps.permalink);
				Alert.alert('Permalink copied to clipboard!');

			// quote
			} else if (this.state.quote) {
				this.setState({ quote: false });
				const msg = `[ ](${ nextProps.permalink }) `;
				this.props.setInput({ msg });

			// reply
			} else if (this.state.reply) {
				this.setState({ reply: false });
				let msg = `[ ](${ nextProps.permalink }) `;
				const room = await RocketChat.getRoom(this.props.item.rid);

				// if original message wasn't sent by current user and neither from a direct room
				if (this.props.user.username !== this.props.item.u.username && room.t !== 'd') {
					msg += `@${ this.props.item.u.username } `;
				}
				this.props.setInput({ msg });
			}
		}
	}

	isDeleted() {
		return !this.props.item.msg;
	}

	attachments() {
		return this.props.item.attachments.length ? (
			<Card
				data={this.props.item.attachments[0]}
			/>
		) : null;
	}

	showActions = () => {
		this.ActionSheet.show();
	}

	handleDelete() {
		Alert.alert(
			'Are you sure?',
			'You will not be able to recover this message!',
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'Yes, delete it!',
					style: 'destructive',
					onPress: () => this.props.deleteRequest(this.props.item)
				}
			],
			{ cancelable: false }
		);
	}

	handleEdit() {
		const { _id, msg, rid } = this.props.item;
		this.props.editInit({ _id, msg, rid });
	}

	handleCopy = async() => {
		await Clipboard.setString(this.props.item.msg);
		Alert.alert('Copied to clipboard!');
	}

	handleStar() {
		this.props.starRequest(this.props.item);
	}

	handlePermalink() {
		this.setState({ copyPermalink: true });
		this.props.permalinkRequest(this.props.item);
	}

	handleTogglePin() {
		this.props.togglePinRequest(this.props.item);
	}

	handleReply() {
		this.setState({ reply: true });
		this.props.permalinkRequest(this.props.item);
	}

	handleQuote() {
		this.setState({ quote: true });
		this.props.permalinkRequest(this.props.item);
	}

	handleActionPress = (actionIndex) => {
		// reply
		if (actionIndex === 1) {
			this.handleReply();
		// edit
		} else if (actionIndex === 2) {
			this.handleEdit();
		// permalink
		} else if (actionIndex === 3) {
			this.handlePermalink();
		// copy
		} else if (actionIndex === 4) {
			this.handleCopy();
		// quote
		} else if (actionIndex === 5) {
			this.handleQuote();
		// star
		} else if (actionIndex === 6) {
			this.handleStar();
		// toggle pin
		} else if (actionIndex === 7) {
			this.handleTogglePin();
		// delete
		} else if (actionIndex === 8) {
			this.handleDelete();
		}
	}

	renderMessageContent() {
		if (this.isDeleted()) {
			return <Text style={styles.textInfo}>Message removed</Text>;
		}

		const msg = emojify(this.props.item.msg, { output: 'unicode' });
		return (
			<Markdown>
				{msg}
			</Markdown>
		);
	}

	render() {
		const { item } = this.props;

		const extraStyle = {};
		if (item.temp) {
			extraStyle.opacity = 0.3;
		}

		const username = item.alias || item.u.username;
		const isEditing = this.props.message._id === item._id;

		return (
			<TouchableOpacity
				onLongPress={() => this.showActions()}
				disabled={this.isDeleted()}
				style={isEditing ? styles.editing : null}
			>
				<View style={[styles.message, extraStyle]}>
					<Avatar
						style={{ marginRight: 10 }}
						text={item.avatar ? '' : username}
						size={40}
						baseUrl={this.props.baseUrl}
						avatar={item.avatar}
					/>
					<View style={[styles.content]}>
						<User
							onPress={this._onPress}
							item={item}
							Message_TimeFormat={this.props.Message_TimeFormat}
							baseUrl={this.props.baseUrl}
						/>
						{this.attachments()}
						{this.renderMessageContent(item)}
					</View>
					<ActionSheet
						ref={o => this.ActionSheet = o}
						title={title}
						options={options}
						cancelButtonIndex={CANCEL_INDEX}
						destructiveButtonIndex={DESTRUCTIVE_INDEX}
						onPress={this.handleActionPress}
					/>
				</View>
			</TouchableOpacity>
		);
	}
}

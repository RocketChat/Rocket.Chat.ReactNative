import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Clipboard } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown';
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';

import Card from './Card';
import User from './User';
import Avatar from '../Avatar';
import { deleteRequest, editInit, starRequest } from '../../actions/messages';

const title = 'Message actions';
const options = ['Cancel', 'Reply', 'Edit', 'Permalink', 'Copy', 'Quote', 'Star Message', 'Delete'];
const CANCEL_INDEX = 0;
const DESTRUCTIVE_INDEX = 7;

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
	message: state.messages.message
}), dispatch => ({
	deleteRequest: message => dispatch(deleteRequest(message)),
	editInit: message => dispatch(editInit(message)),
	starRequest: message => dispatch(starRequest(message))
}))
export default class Message extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		deleteRequest: PropTypes.func.isRequired,
		editInit: PropTypes.func.isRequired,
		starRequest: PropTypes.func.isRequired,
		message: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.showActions = this.showActions.bind(this);
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

	showActions() {
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
		Alert.alert('Copied to Clipboard!');
	}

	handleStar() {
		this.props.starRequest(this.props.item);
	}

	handleActionPress = (actionIndex) => {
		if (actionIndex === 7) {
			this.handleDelete();
		} else if (actionIndex === 2) {
			this.handleEdit();
		} else if (actionIndex === 4) {
			this.handleCopy();
		} else if (actionIndex === 6) {
			this.handleStar();
		} else {
			console.log(actionIndex, this.props.item);
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

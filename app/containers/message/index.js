import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { emojify } from 'react-emojione';
import Markdown from 'react-native-easy-markdown' // eslint-disable-line
import ActionSheet from 'react-native-actionsheet';

import Card from './Card';
import User from './User';
import Avatar from '../Avatar';

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
	}
});

export default class Message extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired
	}

	constructor(props) {
		super(props);
		this.handleActionPress = this.handleActionPress.bind(this);
		this.showActions = this.showActions.bind(this);
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

	handleActionPress = (i) => {
		console.log(i);
	}

	render() {
		const { item } = this.props;

		const extraStyle = {};
		if (item.temp) {
			extraStyle.opacity = 0.3;
		}

		const msg = emojify(item.msg, { output: 'unicode' });
		const username = item.alias || item.u.username;

		return (
			<TouchableOpacity onLongPress={() => this.showActions()}>
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
						/>
						{this.attachments()}
						<Markdown>
							{msg}
						</Markdown>
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

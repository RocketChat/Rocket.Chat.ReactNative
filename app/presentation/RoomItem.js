import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { emojify } from 'react-emojione';
import { connect } from 'react-redux';
import SimpleMarkdown from 'simple-markdown';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch/index'; //eslint-disable-line
import Markdown from '../containers/message/Markdown';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: 'flex-start',
		borderBottomWidth: 0.5,
		borderBottomColor: '#ddd'
	},
	number: {
		minWidth: 25,
		borderRadius: 4,
		backgroundColor: '#1d74f5',
		color: '#fff',
		overflow: 'hidden',
		fontSize: 14,
		paddingVertical: 4,
		paddingHorizontal: 5,

		textAlign: 'center',
		alignItems: 'center',
		justifyContent: 'center'
	},
	roomNameView: {
		flex: 1,
		height: '100%',
		marginLeft: 16,
		marginRight: 4
	},
	roomName: {
		flex: 1,
		fontSize: 18,
		color: '#444',
		fontWeight: 'bold',
		marginRight: 8
	},
	lastMessage: {
		flex: 1,
		flexShrink: 1,
		marginRight: 8
	},
	alert: {
		fontWeight: 'bold'
	},
	favorite: {
		// backgroundColor: '#eee'
	},
	row: {
		width: '100%',
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	update: {
		fontSize: 10,
		color: '#888',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
const markdownStyle = { block: { marginBottom: 0, flexWrap: 'wrap', flexDirection: 'row' } };

const parseInline = (parse, content, state) => {
	const isCurrentlyInline = state.inline || false;
	state.inline = true;
	const result = parse(content, state);
	state.inline = isCurrentlyInline;
	return result;
};
const parseCaptureInline = (capture, parse, state) => ({ content: parseInline(parse, capture[1], state) });
const customRules = {
	strong: {
		order: -4,
		match: SimpleMarkdown.inlineRegex(/^\*\*([\s\S]+?)\*\*(?!\*)/),
		parse: parseCaptureInline,
		react: (node, output, state) => ({
			type: 'strong',
			key: state.key,
			props: {
				children: output(node.content, state)
			}
		})
	},
	text: {
		order: -3,
		match: SimpleMarkdown.inlineRegex(/^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff]|\n\n| {2,}\n|\w+:\S|$)/),
		parse: capture => ({ content: capture[0] }),
		react: node => node.content
	}
};

const renderNumber = (unread, userMentions) => {
	if (!unread || unread <= 0) {
		return;
	}

	if (unread >= 1000) {
		unread = '999+';
	}

	if (userMentions > 0) {
		unread = `@ ${ unread }`;
	}

	return (
		<Text style={styles.number}>
			{ unread }
		</Text>
	);
};

@connect(state => ({
	StoreLastMessage: state.settings.Store_Last_Message,
	customEmojis: state.customEmojis
}))
export default class RoomItem extends React.PureComponent {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		StoreLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.instanceOf(Date),
		lastMessage: PropTypes.object,
		favorite: PropTypes.bool,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		baseUrl: PropTypes.string,
		onPress: PropTypes.func,
		customEmojis: PropTypes.object
	}

	get icon() {
		const { type, name, baseUrl } = this.props;
		return <Avatar text={name} baseUrl={baseUrl} size={56} type={type} />;
	}

	get lastMessage() {
		const {
			lastMessage, alert
		} = this.props;

		if (!this.props.StoreLastMessage) {
			return '';
		}

		let msg = lastMessage ? `${ lastMessage.u.username }: ${ emojify(lastMessage.msg, { output: 'unicode' }) }` : 'No Message';
		if (alert) {
			msg = `**${ msg }**`;
		}
		return msg;
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: '[Yesterday]',
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			favorite, unread, userMentions, name, _updatedAt, customEmojis, baseUrl
		} = this.props;

		const date = this.formatDate(_updatedAt);

		let accessibilityLabel = name;
		if (unread === 1) {
			accessibilityLabel += `, ${ unread } alert`;
		} else if (unread > 1) {
			accessibilityLabel += `, ${ unread } alerts`;
		}

		if (userMentions > 0) {
			accessibilityLabel += ', you were mentioned';
		}

		accessibilityLabel += `, last message ${ date }`;

		return (
			<Touch onPress={this.props.onPress} underlayColor='#FFFFFF' activeOpacity={0.5} accessibilityLabel={accessibilityLabel} accessibilityTraits='selected'>
				<View style={[styles.container, favorite && styles.favorite]}>
					{this.icon}
					<View style={styles.roomNameView}>
						<View style={styles.row}>
							<Text style={styles.roomName} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
							{_updatedAt ? <Text style={styles.update} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
						</View>
						<View style={styles.row}>
							<Markdown
								msg={this.lastMessage}
								customEmojis={customEmojis}
								baseUrl={baseUrl}
								style={styles.lastMessage}
								markdownStyle={markdownStyle}
								customRules={customRules}
								renderInline
							/>
							{renderNumber(unread, userMentions)}
						</View>
					</View>
				</View>
			</Touch>
		);
	}
}

import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, ViewPropTypes } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { connect } from 'react-redux';
import SimpleMarkdown from 'simple-markdown';

import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch/index'; //eslint-disable-line
import Markdown from '../containers/message/Markdown';
import RoomTypeIcon from '../containers/RoomTypeIcon';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: 'center',
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
		marginRight: 8
	},
	lastMessage: {
		flex: 1,
		flexShrink: 1,
		marginRight: 8,
		maxHeight: 20,
		overflow: 'hidden',
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'flex-start'
	},
	alert: {
		fontWeight: 'bold'
	},
	favorite: {
		// backgroundColor: '#eee'
	},
	row: {
		// width: '100%',
		// flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'flex-end'
	},
	firstRow: {
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
	},
	updateAlert: {
		color: '#1d74f5'
	},
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderWidth: 3,
		borderColor: '#fff'
	},
	type: {
		marginRight: 5,
		marginTop: 3
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

const attrs = ['name', 'unread', 'userMentions', 'alert', 'showLastMessage', 'type'];
@connect(state => ({
	user: state.login && state.login.user,
	StoreLastMessage: state.settings.Store_Last_Message
}))
export default class RoomItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		StoreLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.instanceOf(Date),
		lastMessage: PropTypes.object,
		showLastMessage: PropTypes.bool,
		favorite: PropTypes.bool,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		id: PropTypes.string,
		onPress: PropTypes.func,
		onLongPress: PropTypes.func,
		user: PropTypes.object,
		avatarSize: PropTypes.number,
		statusStyle: ViewPropTypes.style,
		testID: PropTypes.string
	}

	static defaultProps = {
		showLastMessage: true,
		avatarSize: 46
	}
	shouldComponentUpdate(nextProps) {
		const oldlastMessage = this.props.lastMessage;
		const newLastmessage = nextProps.lastMessage;

		if (oldlastMessage && newLastmessage && oldlastMessage.ts.toGMTString() !== newLastmessage.ts.toGMTString()) {
			return true;
		}
		if (this.props._updatedAt && nextProps._updatedAt && nextProps._updatedAt.toGMTString() !== this.props._updatedAt.toGMTString()) {
			return true;
		}
		return attrs.some(key => nextProps[key] !== this.props[key]);
	}
	get icon() {
		const {
			type, name, id, avatarSize, statusStyle
		} = this.props;
		return (<Avatar text={name} size={avatarSize} type={type}>{type === 'd' ? <Status style={[styles.status, statusStyle]} id={id} /> : null }</Avatar>);
	}

	get lastMessage() {
		const {
			lastMessage, type, showLastMessage
		} = this.props;

		if (!this.props.StoreLastMessage || !showLastMessage) {
			return '';
		}
		if (!lastMessage) {
			return 'No Message';
		}

		let prefix = '';

		if (lastMessage.u.username === this.props.user.username) {
			prefix = 'You: ';
		}	else if (type !== 'd') {
			prefix = `${ lastMessage.u.username }: `;
		}

		const msg = `${ prefix }${ lastMessage.msg.replace(/[\n\t\r]/igm, '') }`;
		const maxChars = 35;
		return `${ msg.slice(0, maxChars) }${ msg.replace(/:[a-z0-9]+:/gi, ':::').length > maxChars ? '...' : '' }`;
	}

	get type() {
		const icon = {
			c: 'pound',
			p: 'lock',
			l: 'account',
			d: 'at'
		}[this.props.type];
		return <Icon name={icon} size={15} style={styles.type} />;
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: '[Yesterday]',
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			favorite, unread, userMentions, name, _updatedAt, alert, type, testID
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

		if (date) {
			accessibilityLabel += `, last message ${ date }`;
		}

		return (
			<Touch
				onPress={this.props.onPress}
				onLongPress={this.props.onLongPress}
				underlayColor='#FFFFFF'
				activeOpacity={0.5}
				accessibilityLabel={accessibilityLabel}
				accessibilityTraits='selected'
				testID={testID}
			>
				<View style={[styles.container, favorite && styles.favorite]}>
					{this.icon}
					<View style={styles.roomNameView}>
						<View style={styles.firstRow}>
							<RoomTypeIcon type={type} />
							<Text style={[styles.roomName, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
							{_updatedAt ? <Text style={[styles.update, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
						</View>
						<View style={styles.row}>
							<Markdown
								msg={this.lastMessage}
								style={styles.lastMessage}
								markdownStyle={markdownStyle}
								customRules={customRules}
								renderInline
								numberOfLines={1}
							/>
							{renderNumber(unread, userMentions)}
						</View>
					</View>
				</View>
			</Touch>
		);
	}
}

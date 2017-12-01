import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';

import Markdown from './Markdown';
import QuoteMark from './QuoteMark';
import Avatar from '../Avatar';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
		alignSelf: 'flex-end'
	},
	quoteSign: {
		borderWidth: 2,
		borderRadius: 4,
		borderColor: '#a0a0a0',
		height: '100%',
		marginRight: 5
	},
	attachmentContainer: {
		flex: 1,
		flexDirection: 'column'
	},
	authorContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		margin: 2
	},
	time: {
		fontSize: 10,
		fontWeight: 'normal',
		color: '#888',
		marginLeft: 5
	}
});

const onPress = (attachment) => {
	const url = attachment.title_link || attachment.author_link;
	if (!url) {
		return;
	}
	Linking.openURL(attachment.title_link || attachment.author_link);
};
const Reply = ({ attachment, timeFormat }) => {
	if (!attachment) {
		return null;
	}

	const renderAvatar = () => {
		if (!attachment.author_icon && !attachment.author_name) {
			return null;
		}
		return (
			<Avatar
				style={styles.avatar}
				text={attachment.author_name}
				size={16}
				avatar={attachment.author_icon}
			/>
		);
	};

	const renderAuthor = () => (
		attachment.author_name ? <Text style={{ fontWeight: 'bold' }}>{attachment.author_name}</Text> : null
	);

	const renderTime = () => {
		const time = attachment.ts ? moment(attachment.ts).format(timeFormat) : null;
		return time ? <Text style={styles.time}>{ time }</Text> : null;
	};

	const renderText = () => (
		attachment.text ? <Markdown msg={attachment.text} /> : null
	);

	return (
		<TouchableOpacity
			onPress={() => onPress(attachment)}
			style={styles.button}
		>
			<QuoteMark color={attachment.color} />
			<View style={styles.attachmentContainer}>
				<View style={styles.authorContainer}>
					<Text>
						{renderAvatar()} &nbsp; {renderAuthor()} {renderTime()}
					</Text>
				</View>
				{renderText()}
				{attachment.attachments.map(attach => <Reply attachment={attach} timeFormat={timeFormat} />)}
			</View>
		</TouchableOpacity>
	);
};

Reply.propTypes = {
	attachment: PropTypes.object.isRequired,
	timeFormat: PropTypes.string.isRequired
};

export default Reply;

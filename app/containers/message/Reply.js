import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';

import Markdown from './Markdown';
import QuoteMark from './QuoteMark';
import Avatar from '../Avatar';
import openLink from '../../utils/openLink';


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
	author: {
		fontWeight: 'bold',
		marginHorizontal: 5,
		flex: 1
	},
	time: {
		fontSize: 10,
		fontWeight: 'normal',
		color: '#888',
		marginLeft: 5
	},
	fieldsContainer: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	fieldContainer: {
		flexDirection: 'column',
		padding: 10
	},
	fieldTitle: {
		fontWeight: 'bold'
	}
});

const onPress = (attachment) => {
	const url = attachment.title_link || attachment.author_link;
	if (!url) {
		return;
	}
	openLink(attachment.title_link || attachment.author_link);
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
				text={attachment.author_name}
				size={16}
			/>
		);
	};

	const renderAuthor = () => (
		attachment.author_name ? <Text style={styles.author}>{attachment.author_name}</Text> : null
	);

	const renderTime = () => {
		const time = attachment.ts ? moment(attachment.ts).format(timeFormat) : null;
		return time ? <Text style={styles.time}>{ time }</Text> : null;
	};

	const renderTitle = () => {
		if (!(attachment.author_icon || attachment.author_name || attachment.ts)) {
			return null;
		}
		return (
			<View style={styles.authorContainer}>
				{renderAvatar()}
				{renderAuthor()}
				{renderTime()}
			</View>
		);
	};

	const renderText = () => (
		attachment.text ? <Markdown msg={attachment.text} /> : null
	);

	const renderFields = () => {
		if (!attachment.fields) {
			return null;
		}

		return (
			<View style={styles.fieldsContainer}>
				{attachment.fields.map(field => (
					<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
						<Text style={styles.fieldTitle}>{field.title}</Text>
						<Text>{field.value}</Text>
					</View>
				))}
			</View>
		);
	};

	return (
		<TouchableOpacity
			onPress={() => onPress(attachment)}
			style={styles.button}
		>
			<QuoteMark color={attachment.color} />
			<View style={styles.attachmentContainer}>
				{renderTitle()}
				{renderText()}
				{renderFields()}
				{attachment.attachments ?
					attachment.attachments
						.map(attach => <Reply key={attach.text} attachment={attach} timeFormat={timeFormat} />)
					: null
				}
			</View>
		</TouchableOpacity>
	);
};

Reply.propTypes = {
	attachment: PropTypes.object.isRequired,
	timeFormat: PropTypes.string.isRequired
};

export default Reply;

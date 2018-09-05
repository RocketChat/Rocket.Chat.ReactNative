import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';

import Markdown from './Markdown';
import openLink from '../../utils/openLink';
import Touch from '../../utils/touch';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 15,
		alignSelf: 'flex-end'
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		flexDirection: 'column',
		backgroundColor: '#f3f4f5',
		padding: 15
	},
	authorContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	author: {
		color: '#1d74f5',
		fontSize: 18,
		fontWeight: '500',
		marginRight: 10
	},
	time: {
		fontSize: 14,
		fontWeight: 'normal',
		color: '#9ea2a8',
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
	},
	marginTop: {
		marginTop: 4
	}
});

const onPress = (attachment) => {
	const url = attachment.title_link || attachment.author_link;
	if (!url) {
		return;
	}
	openLink(attachment.title_link || attachment.author_link);
};

const Reply = ({
	attachment, timeFormat, baseUrl, customEmojis, user, index
}) => {
	if (!attachment) {
		return null;
	}

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
				{renderAuthor()}
				{renderTime()}
			</View>
		);
	};

	const renderText = () => (
		attachment.text ? <Markdown msg={attachment.text} customEmojis={customEmojis} baseUrl={baseUrl} username={user.username} /> : null
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
		<Touch
			onPress={() => onPress(attachment)}
			style={[styles.button, index > 0 && styles.marginTop]}
		>
			<View style={styles.attachmentContainer}>
				{renderTitle()}
				{renderText()}
				{renderFields()}
			</View>
		</Touch>
	);
};

Reply.propTypes = {
	attachment: PropTypes.object.isRequired,
	timeFormat: PropTypes.string.isRequired,
	baseUrl: PropTypes.string.isRequired,
	customEmojis: PropTypes.object.isRequired,
	user: PropTypes.object.isRequired,
	index: PropTypes.number
};

export default Reply;

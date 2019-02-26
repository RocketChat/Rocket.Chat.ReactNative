import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { RectButton } from 'react-native-gesture-handler';

import Markdown from './Markdown';
import openLink from '../../utils/openLink';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 15,
		alignSelf: 'flex-end',
		backgroundColor: '#f3f4f5',
		borderRadius: 4
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		flexDirection: 'column',
		padding: 15
	},
	authorContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	author: {
		flex: 1,
		color: '#0C0D0F',
		fontSize: 16,
		fontWeight: '500',
		marginRight: 10
	},
	time: {
		fontSize: 12,
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

const onPress = (attachment, baseUrl, user) => {
	let url = attachment.title_link || attachment.author_link;
	if (!url) {
		return;
	}
	if (attachment.type === 'file') {
		url = `${ baseUrl }${ url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
	}
	openLink(url);
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

	const renderText = () => {
		const text = attachment.text || attachment.title;
		if (text) {
			return (
				<Markdown
					msg={text}
					customEmojis={customEmojis}
					baseUrl={baseUrl}
					username={user.username}
				/>
			);
		}
	};

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
		<RectButton
			onPress={() => onPress(attachment, baseUrl, user)}
			style={[styles.button, index > 0 && styles.marginTop]}
			activeOpacity={0.5}
			underlayColor='#fff'
		>
			<View style={styles.attachmentContainer}>
				{renderTitle()}
				{renderText()}
				{renderFields()}
			</View>
		</RectButton>
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

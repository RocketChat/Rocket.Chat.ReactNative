import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { RectButton } from 'react-native-gesture-handler';

import Markdown from './Markdown';
import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import { COLOR_BACKGROUND_CONTAINER, COLOR_BORDER, COLOR_WHITE } from '../../constants/colors';
import Image from './Image';
import Video from './Video';
import Audio from './Audio';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
		alignSelf: 'flex-end',
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderColor: COLOR_BORDER,
		borderWidth: 1,
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
		fontSize: 16,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		marginLeft: 10,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular,
		fontWeight: '300'
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
		fontSize: 14,
		...sharedStyles.textColorNormal,
		...sharedStyles.textSemibold
	},
	fieldValue: {
		fontSize: 14,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
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
						<Text style={styles.fieldValue}>{field.value}</Text>
					</View>
				))}
			</View>
		);
	};
	const renderAttachments = () => {
		if (attachment.attachments.length === 0) {
			return null;
		}

		return attachment.attachments.map((attach) => {
			if (attach.image_url) {
				return <Image key={attach.image_url} file={attach} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
			} else if (attach.video_url) {
				return <Video key={attach.video_url} file={attach} baseUrl={baseUrl} user={user} customEmojis={customEmojis} />;
			} else if (attach.audio_url) {
				return <Audio key={attach.audio_url} file={attach} baseUrl={baseUrl} user={user} customEmojis={customEmojis} />;
			} else {
				return null;
			}
		});
	};

	return (
		<RectButton
			onPress={() => onPress(attachment, baseUrl, user)}
			style={[styles.button, index > 0 && styles.marginTop]}
			activeOpacity={0.5}
			underlayColor={COLOR_WHITE}
		>
			<View style={styles.attachmentContainer}>
				{renderTitle()}
				{renderText()}
				{renderAttachments()}
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

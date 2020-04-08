import React from 'react';
import PropTypes from 'prop-types';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-navigation';

import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import TextInput from '../containers/TextInput';
import KeyboardView from '../presentation/KeyboardView';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';

import sharedStyles from './Styles';
import Button from '../containers/Button';
import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import scrollPersistTaps from '../utils/scrollPersistTaps';

const styles = StyleSheet.create({
	title: {
		fontSize: 20,
		paddingVertical: 10,
		...sharedStyles.textMedium
	}
});

const Title = ({ title, theme }) => <Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text>;
Title.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

const LivechatEditView = ({ navigation, theme }) => {
	const params = {};

	const livechat = navigation.getParam('livechat', {});
	const visitor = navigation.getParam('visitor', {});

	const submit = async() => {
		const userData = { _id: visitor._id };

		const { _id, sms } = livechat;
		const roomData = { _id };

		if (params.name) {
			userData.name = params.name;
		}
		if (params.email) {
			userData.email = params.email;
		}
		if (params.phone) {
			userData.phone = params.phone;
		}

		if (params.topic) {
			roomData.topic = params.topic;
		}

		if (sms) {
			delete userData.phone;
		}

		const { error } = await RocketChat.editLivechat(userData, roomData);
		if (error) {
			EventEmitter.emit(LISTENER, { message: error });
		} else {
			EventEmitter.emit(LISTENER, { message: I18n.t('Saved') });
			navigation.goBack();
		}
	};

	const onChangeText = (key, text) => { params[key] = text; };

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<ScrollView style={sharedStyles.containerScrollView} {...scrollPersistTaps}>
				<SafeAreaView style={sharedStyles.container} forceInset={{ vertical: 'never' }}>
					<Title
						title={visitor.username}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Name')}
						defaultValue={visitor.name}
						onChangeText={text => onChangeText('name', text)}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Email')}
						defaultValue={visitor.visitorEmails[0]?.address}
						onChangeText={text => onChangeText('email', text)}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Phone')}
						defaultValue={visitor.phone[0]?.phoneNumber}
						onChangeText={text => onChangeText('phone', text)}
						theme={theme}
					/>
					{Object.entries(visitor.livechatData).map(([key, value]) => (
						<TextInput
							label={key}
							defaultValue={value}
							onChangeText={text => onChangeText(key, text)}
							theme={theme}
						/>
					))}
					<Title
						title={I18n.t('Conversation')}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Topic')}
						defaultValue={livechat.topic}
						onChangeText={text => onChangeText('topic', text)}
						theme={theme}
					/>
					{Object.entries(livechat.livechatData).map(([key, value]) => (
						<TextInput
							label={key}
							defaultValue={value}
							theme={theme}
						/>
					))}
					<Button
						title={I18n.t('Save')}
						onPress={submit}
						theme={theme}
					/>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};
LivechatEditView.propTypes = {
	navigation: PropTypes.object,
	theme: PropTypes.string
};
LivechatEditView.navigationOptions = {
	title: I18n.t('Livechat_edit')
};

export default withTheme(LivechatEditView);

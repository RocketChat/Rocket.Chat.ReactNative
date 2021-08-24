import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import TextInput from '../containers/TextInput';
import KeyboardView from '../presentation/KeyboardView';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';

import sharedStyles from './Styles';
import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { getUserSelector } from '../selectors/login';
import Chips from '../containers/UIKit/MultiSelect/Chips';
import Button from '../containers/Button';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	container: {
		padding: 16
	},
	title: {
		fontSize: 20,
		paddingVertical: 10,
		...sharedStyles.textMedium
	}
});

const Title = ({ title, theme }) => (title ? <Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text> : null);
Title.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

const LivechatEditView = ({
	user, navigation, route, theme
}) => {
	const [customFields, setCustomFields] = useState({});
	const [availableUserTags, setAvailableUserTags] = useState([]);

	const params = {};
	const inputs = {};

	const livechat = route.params?.room ?? {};
	const visitor = route.params?.roomUser ?? {};

	const getCustomFields = async() => {
		const result = await RocketChat.getCustomFields();
		if (result.success && result.customFields?.length) {
			const visitorCustomFields = result.customFields
				.filter(field => field.visibility !== 'hidden' && field.scope === 'visitor')
				.map(field => ({ [field._id]: (visitor.livechatData && visitor.livechatData[field._id]) || '' }))
				.reduce((ret, field) => ({ [field]: field, ...ret }));

			const livechatCustomFields = result.customFields
				.filter(field => field.visibility !== 'hidden' && field.scope === 'room')
				.map(field => ({ [field._id]: (livechat.livechatData && livechat.livechatData[field._id]) || '' }))
				.reduce((ret, field) => ({ [field]: field, ...ret }));

			return setCustomFields({ visitor: visitorCustomFields, livechat: livechatCustomFields });
		}
	};

	const [tagParam, setTags] = useState(livechat?.tags || []);

	useEffect(() => {
		setTags([...tagParam, ...availableUserTags]);
	}, [availableUserTags]);

	const getTagsList = async(agentDepartments) => {
		const tags = await RocketChat.getTagsList();
		const isAdmin = ['admin', 'livechat-manager'].find(role => user.roles.includes(role));
		const availableTags = tags
			.filter(({ departments }) => isAdmin || (departments.length === 0 || departments.some(i => agentDepartments.indexOf(i) > -1)))
			.map(({ name }) => name);
		setAvailableUserTags(availableTags);
	};

	const getAgentDepartments = async() => {
		const result = await RocketChat.getAgentDepartments(visitor?._id);
		if (result.success) {
			const agentDepartments = result.departments.map(dept => dept.departmentId);
			getTagsList(agentDepartments);
		}
	};

	const submit = async() => {
		const userData = { _id: visitor?._id };

		const { rid, sms } = livechat;
		const roomData = { _id: rid };

		if (params.name) {
			userData.name = params.name;
		}
		if (params.email) {
			userData.email = params.email;
		}
		if (params.phone) {
			userData.phone = params.phone;
		}

		userData.livechatData = {};
		Object.entries(customFields?.visitor || {}).forEach(([key]) => {
			if (params[key] || params[key] === '') {
				userData.livechatData[key] = params[key];
			}
		});

		if (params.topic) {
			roomData.topic = params.topic;
		}

		roomData.tags = tagParam;

		roomData.livechatData = {};
		Object.entries(customFields?.livechat || {}).forEach(([key]) => {
			if (params[key] || params[key] === '') {
				roomData.livechatData[key] = params[key];
			}
		});

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

	useEffect(() => {
		getAgentDepartments();
		getCustomFields();
	}, []);

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<ScrollView {...scrollPersistTaps} style={styles.container}>
				<SafeAreaView>
					<Title
						title={visitor?.username}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Name')}
						defaultValue={visitor?.name}
						onChangeText={text => onChangeText('name', text)}
						onSubmitEditing={() => { inputs.name.focus(); }}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Email')}
						inputRef={(e) => { inputs.name = e; }}
						defaultValue={visitor?.visitorEmails && visitor?.visitorEmails[0]?.address}
						onChangeText={text => onChangeText('email', text)}
						onSubmitEditing={() => { inputs.phone.focus(); }}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Phone')}
						inputRef={(e) => { inputs.phone = e; }}
						defaultValue={visitor?.phone && visitor?.phone[0]?.phoneNumber}
						onChangeText={text => onChangeText('phone', text)}
						onSubmitEditing={() => {
							const keys = Object.keys(customFields?.visitor || {});
							if (keys.length > 0) {
								const key = keys.pop();
								inputs[key].focus();
							} else {
								inputs.topic.focus();
							}
						}}
						theme={theme}
					/>
					{Object.entries(customFields?.visitor || {}).map(([key, value], index, array) => (
						<TextInput
							label={key}
							defaultValue={value}
							inputRef={(e) => { inputs[key] = e; }}
							onChangeText={text => onChangeText(key, text)}
							onSubmitEditing={() => {
								if (array.length - 1 > index) {
									return inputs[array[index + 1]].focus();
								}
								inputs.topic.focus();
							}}
							theme={theme}
						/>
					))}
					<Title
						title={I18n.t('Conversation')}
						theme={theme}
					/>
					<TextInput
						label={I18n.t('Topic')}
						inputRef={(e) => { inputs.topic = e; }}
						defaultValue={livechat?.topic}
						onChangeText={text => onChangeText('topic', text)}
						onSubmitEditing={() => inputs.tags.focus()}
						theme={theme}
					/>

					<TextInput
						inputRef={(e) => { inputs.tags = e; }}
						label={I18n.t('Tags')}
						iconRight='add'
						onIconRightPress={() => {
							const lastText = inputs.tags._lastNativeText || '';
							if (lastText.length) {
								setTags([...tagParam.filter(t => t !== lastText), lastText]);
								inputs.tags.clear();
							}
						}}
						onSubmitEditing={() => {
							const keys = Object.keys(customFields?.livechat || {});
							if (keys.length > 0) {
								const key = keys.pop();
								inputs[key].focus();
							} else {
								submit();
							}
						}}
						theme={theme}
					/>
					<Chips
						items={tagParam.map(tag => ({ text: { text: tag }, value: tag }))}
						onSelect={tag => setTags(tagParam.filter(t => t !== tag.value) || [])}
						style={{ backgroundColor: themes[theme].backgroundColor }}
						theme={theme}
					/>

					{Object.entries(customFields?.livechat || {}).map(([key, value], index, array) => (
						<TextInput
							label={key}
							defaultValue={value}
							inputRef={(e) => { inputs[key] = e; }}
							onChangeText={text => onChangeText(key, text)}
							onSubmitEditing={() => {
								if (array.length - 1 > index) {
									return inputs[array[index + 1]].focus();
								}
								submit();
							}}
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
	user: PropTypes.object,
	navigation: PropTypes.object,
	route: PropTypes.object,
	theme: PropTypes.string
};
LivechatEditView.navigationOptions = ({
	title: I18n.t('Livechat_edit')
});

const mapStateToProps = state => ({
	server: state.server.server,
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(LivechatEditView));

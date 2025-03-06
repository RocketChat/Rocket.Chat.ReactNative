import React, { useEffect, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux';
import { BlockContext } from '@rocket.chat/ui-kit';

import log from '../lib/methods/helpers/log';
import { TSupportedThemes, withTheme } from '../theme';
import { themes } from '../lib/constants';
import { FormTextInput } from '../containers/TextInput';
import KeyboardView from '../containers/KeyboardView';
import I18n from '../i18n';
import { LISTENER } from '../containers/Toast';
import EventEmitter from '../lib/methods/helpers/events';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import { getUserSelector } from '../selectors/login';
import Button from '../containers/Button';
import SafeAreaView from '../containers/SafeAreaView';
import { MultiSelect } from '../containers/UIKit/MultiSelect';
import { ICustomFields, IInputsRefs, TParams, ITitle, ILivechat } from '../definitions/ILivechatEditView';
import { IApplicationState, IUser } from '../definitions';
import { ChatsStackParamList } from '../stacks/types';
import sharedStyles from './Styles';
import { Services } from '../lib/services';
import { usePermissions } from '../lib/hooks';

const styles = StyleSheet.create({
	container: {
		padding: 16
	},
	title: {
		fontSize: 20,
		paddingVertical: 10,
		...sharedStyles.textMedium
	},
	label: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	multiSelect: {
		marginBottom: 10
	}
});

interface ILivechatEditViewProps {
	user: IUser;
	navigation: NativeStackNavigationProp<ChatsStackParamList, 'LivechatEditView'>;
	route: RouteProp<ChatsStackParamList, 'LivechatEditView'>;
	theme: TSupportedThemes;
	editOmnichannelContact: string[] | undefined;
	editLivechatRoomCustomfields: string[] | undefined;
}

const Title = ({ title, theme }: ITitle) =>
	title ? <Text style={[styles.title, { color: themes[theme].fontTitlesLabels }]}>{title}</Text> : null;

const LivechatEditView = ({ user, navigation, route, theme }: ILivechatEditViewProps) => {
	const [customFields, setCustomFields] = useState<ICustomFields>({});
	const [availableUserTags, setAvailableUserTags] = useState<string[]>([]);

	const params = {} as TParams;
	const inputs = {} as IInputsRefs;

	const livechat = (route.params?.room ?? {}) as ILivechat;
	const visitor = route.params?.roomUser ?? {};

	const [editOmnichannelContactPermission, editLivechatRoomCustomFieldsPermission] = usePermissions(
		['edit-omnichannel-contact', 'edit-livechat-room-customfields'],
		livechat.rid
	);

	const getCustomFields = async () => {
		const result = await Services.getCustomFields();
		if (result.success && result.customFields?.length) {
			const visitorCustomFields = result.customFields
				.filter(field => field.visibility !== 'hidden' && field.scope === 'visitor')
				.map(field => ({ [field._id]: (visitor.livechatData && visitor.livechatData[field._id]) || '' }))
				.reduce((ret, field) => ({ ...field, ...ret }), {});

			const livechatCustomFields = result.customFields
				.filter(field => field.visibility !== 'hidden' && field.scope === 'room')
				.map(field => ({ [field._id]: (livechat.livechatData && livechat.livechatData[field._id]) || '' }))
				.reduce((ret, field) => ({ ...field, ...ret }), {});

			return setCustomFields({ visitor: visitorCustomFields, livechat: livechatCustomFields });
		}
	};

	const [tagParam, setTags] = useState(livechat?.tags || []);
	const [tagParamSelected, setTagParamSelected] = useState(livechat?.tags || []);

	const tagOptions = tagParam.map((tag: string) => ({ text: { text: tag }, value: tag }));
	const tagValues = Array.isArray(tagParamSelected)
		? tagOptions.filter((option: any) => tagParamSelected.includes(option.value))
		: [];

	useEffect(() => {
		const arr = [...tagParam, ...availableUserTags];
		const uniqueArray = arr.filter((val, i) => arr.indexOf(val) === i);
		setTags(uniqueArray);
	}, [availableUserTags]);

	const handleGetTagsList = async (agentDepartments: string[]) => {
		const tags = await Services.getTagsList();
		const isAdmin = ['admin', 'livechat-manager'].find(role => user.roles?.includes(role));
		const availableTags = tags
			.filter(({ departments }) => isAdmin || departments.length === 0 || departments.some(i => agentDepartments.indexOf(i) > -1))
			.map(({ name }) => name);
		setAvailableUserTags(availableTags);
	};

	const handleGetAgentDepartments = async () => {
		try {
			const result = await Services.getAgentDepartments(visitor?._id);
			if (result.success) {
				const agentDepartments = result.departments.map(dept => dept.departmentId);
				handleGetTagsList(agentDepartments);
			}
		} catch {
			// do nothing
		}
	};

	const submit = async () => {
		try {
			const userData = { _id: visitor?._id } as TParams;

			const { rid } = livechat;
			const sms = livechat?.sms;

			const roomData = { _id: rid } as TParams;

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

			roomData.tags = tagParamSelected;

			roomData.livechatData = {};
			Object.entries(customFields?.livechat || {}).forEach(([key]) => {
				if (params[key] || params[key] === '') {
					roomData.livechatData[key] = params[key];
				}
			});

			if (sms) {
				delete userData.phone;
			}

			const { error } = await Services.editLivechat(userData, roomData);
			if (error) {
				EventEmitter.emit(LISTENER, { message: error });
			} else {
				EventEmitter.emit(LISTENER, { message: I18n.t('Saved') });
				navigation.goBack();
			}
		} catch (e) {
			log(e);
		}
	};

	const onChangeText = (key: string, text: string) => {
		params[key] = text;
	};

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Edit')
		});
		handleGetAgentDepartments();
		getCustomFields();
	}, []);

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].surfaceHover }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}>
			<ScrollView {...scrollPersistTaps} style={styles.container}>
				<SafeAreaView>
					<Title title={visitor?.username} theme={theme} />
					<FormTextInput
						label={I18n.t('Name')}
						defaultValue={visitor?.name}
						onChangeText={text => onChangeText('name', text)}
						onSubmitEditing={() => {
							inputs.name?.focus();
						}}
						editable={!!editOmnichannelContactPermission}
					/>
					<FormTextInput
						label={I18n.t('Email')}
						inputRef={e => {
							inputs.name = e;
						}}
						defaultValue={visitor?.visitorEmails && visitor?.visitorEmails[0]?.address}
						onChangeText={text => onChangeText('email', text)}
						onSubmitEditing={() => {
							inputs.phone?.focus();
						}}
						editable={!!editOmnichannelContactPermission}
					/>
					<FormTextInput
						label={I18n.t('Phone')}
						inputRef={e => {
							inputs.phone = e;
						}}
						defaultValue={visitor?.phone && visitor?.phone[0]?.phoneNumber}
						onChangeText={text => onChangeText('phone', text)}
						onSubmitEditing={() => {
							const keys = Object.keys(customFields?.visitor || {});
							if (keys.length > 0) {
								const key = keys[0];
								inputs[key]?.focus();
							} else {
								inputs.topic?.focus();
							}
						}}
						editable={!!editOmnichannelContactPermission}
					/>
					{Object.entries(customFields?.visitor || {}).map(([key, value], index, array) => (
						<FormTextInput
							label={key}
							defaultValue={value}
							inputRef={e => {
								inputs[key] = e;
							}}
							onChangeText={text => onChangeText(key, text)}
							onSubmitEditing={() => {
								if (array.length - 1 > index) {
									return inputs[array[index + 1][0]]?.focus();
								}
								inputs.topic?.focus();
							}}
							editable={!!editOmnichannelContactPermission}
						/>
					))}
					<Title title={I18n.t('Conversation')} theme={theme} />
					<FormTextInput
						label={I18n.t('Topic')}
						inputRef={e => {
							inputs.topic = e;
						}}
						defaultValue={livechat?.topic}
						onChangeText={text => onChangeText('topic', text)}
						editable={!!editLivechatRoomCustomFieldsPermission}
					/>

					<Text style={[styles.label, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Tags')}</Text>
					<MultiSelect
						options={tagOptions}
						onChange={({ value }: { value: string[] }) => {
							setTagParamSelected([...value]);
						}}
						placeholder={{ text: I18n.t('Tags') }}
						value={tagValues}
						context={BlockContext.FORM}
						multiselect
						disabled={!editLivechatRoomCustomFieldsPermission}
						inputStyle={styles.multiSelect}
					/>

					{Object.entries(customFields?.livechat || {}).map(([key, value], index, array: any) => (
						<FormTextInput
							label={key}
							defaultValue={value}
							inputRef={e => {
								inputs[key] = e;
							}}
							onChangeText={text => onChangeText(key, text)}
							onSubmitEditing={() => {
								if (array.length - 1 > index) {
									return inputs[array[index + 1]]?.focus();
								}
								submit();
							}}
							editable={!!editLivechatRoomCustomFieldsPermission}
						/>
					))}

					<Button title={I18n.t('Save')} onPress={submit} />
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(LivechatEditView));

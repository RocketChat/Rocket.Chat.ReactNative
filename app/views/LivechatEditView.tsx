import React, { useEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TextInput as RNTextInput } from 'react-native';
import { connect } from 'react-redux';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import TextInput from '../containers/TextInput';
import KeyboardView from '../presentation/KeyboardView';
import RocketChat from '../lib/rocketchat';
import I18n from '../i18n';
import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { getUserSelector } from '../selectors/login';
import Button from '../containers/Button';
import SafeAreaView from '../containers/SafeAreaView';
import { MultiSelect } from '../containers/UIKit/MultiSelect';
import { IVisitor } from '../definitions/IVisitor';
import { ITagsOmnichannel } from '../definitions/ITagsOmnichannel';
import { IApplicationState, ISubscription } from '../definitions';
import { ChatsStackParamList } from '../stacks/types';
import sharedStyles from './Styles';

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

interface ITitle {
	title: string;
	theme: string;
}

interface IField {
	_id: string;
	visibility: string;
	scope: string;
}

interface IInputs {
	[key: string]: string | string[] | undefined;
	name: string;
	email: string;
	phone?: string;
	topic: string;
	tag: string[];
}

type TParams = IVisitor & IInputs;

interface ILivechat extends ISubscription {
	// Param dynamic depends on server
	sms?: string;
}

interface IInputsRefs {
	[index: string]: RNTextInput | null;
	name: RNTextInput | null;
	phone: RNTextInput | null;
	topic: RNTextInput | null;
}

interface ICustomFields {
	visitor?: { [key: string]: string };
	livechat?: { [key: string]: string };
}
interface ILivechatEditViewProps {
	// TODO: Refactor when migrate models
	user: any;
	navigation: StackNavigationProp<ChatsStackParamList, 'LivechatEditView'>;
	route: RouteProp<ChatsStackParamList, 'LivechatEditView'>;
	theme: string;
	editOmnichannelContact: string[] | undefined;
	editLivechatRoomCustomfields: string[] | undefined;
}

const Title = ({ title, theme }: ITitle) =>
	title ? <Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text> : null;

const LivechatEditView = ({
	user,
	navigation,
	route,
	theme,
	editOmnichannelContact,
	editLivechatRoomCustomfields
}: ILivechatEditViewProps) => {
	const [customFields, setCustomFields] = useState<ICustomFields>({});
	const [availableUserTags, setAvailableUserTags] = useState<string[]>([]);
	const [permissions, setPermissions] = useState([]);

	const params = {} as TParams;
	const inputs = {} as IInputsRefs;

	const livechat = (route.params?.room ?? {}) as ILivechat;
	const visitor = route.params?.roomUser ?? {};

	const getCustomFields = async () => {
		const result = await RocketChat.getCustomFields();
		if (result.success && result.customFields?.length) {
			const visitorCustomFields = result.customFields
				.filter((field: IField) => field.visibility !== 'hidden' && field.scope === 'visitor')
				.map((field: IField) => ({ [field._id]: (visitor.livechatData && visitor.livechatData[field._id]) || '' }))
				.reduce((ret: IField, field: IField) => ({ ...field, ...ret }));

			const livechatCustomFields = result.customFields
				.filter((field: IField) => field.visibility !== 'hidden' && field.scope === 'room')
				.map((field: IField) => ({ [field._id]: (livechat.livechatData && livechat.livechatData[field._id]) || '' }))
				.reduce((ret: IField, field: IField) => ({ ...field, ...ret }));

			return setCustomFields({ visitor: visitorCustomFields, livechat: livechatCustomFields });
		}
	};

	const [tagParam, setTags] = useState(livechat?.tags || []);
	const [tagParamSelected, setTagParamSelected] = useState(livechat?.tags || []);

	useEffect(() => {
		const arr = [...tagParam, ...availableUserTags];
		const uniqueArray = arr.filter((val, i) => arr.indexOf(val) === i);
		setTags(uniqueArray);
	}, [availableUserTags]);

	const getTagsList = async (agentDepartments: string[]) => {
		const tags: ITagsOmnichannel[] = await RocketChat.getTagsList();
		const isAdmin = ['admin', 'livechat-manager'].find(role => user.roles.includes(role));
		const availableTags = tags
			.filter(({ departments }) => isAdmin || departments.length === 0 || departments.some(i => agentDepartments.indexOf(i) > -1))
			.map(({ name }) => name);
		setAvailableUserTags(availableTags);
	};

	const getAgentDepartments = async () => {
		const result = await RocketChat.getAgentDepartments(visitor?._id);
		if (result.success) {
			const agentDepartments = result.departments.map((dept: { departmentId: string }) => dept.departmentId);
			getTagsList(agentDepartments);
		}
	};

	const submit = async () => {
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

		const { error } = await RocketChat.editLivechat(userData, roomData);
		if (error) {
			EventEmitter.emit(LISTENER, { message: error });
		} else {
			EventEmitter.emit(LISTENER, { message: I18n.t('Saved') });
			navigation.goBack();
		}
	};

	const onChangeText = (key: string, text: string) => {
		params[key] = text;
	};

	const getPermissions = async () => {
		const permissionsArray = await RocketChat.hasPermission([editOmnichannelContact, editLivechatRoomCustomfields], livechat.rid);
		setPermissions(permissionsArray);
	};

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Edit')
		});
		getAgentDepartments();
		getCustomFields();
		getPermissions();
	}, []);

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].auxiliaryBackground }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}>
			<ScrollView {...scrollPersistTaps} style={styles.container}>
				<SafeAreaView>
					<Title title={visitor?.username} theme={theme} />
					<TextInput
						label={I18n.t('Name')}
						defaultValue={visitor?.name}
						onChangeText={text => onChangeText('name', text)}
						onSubmitEditing={() => {
							inputs.name?.focus();
						}}
						theme={theme}
						editable={!!permissions[0]}
					/>
					<TextInput
						label={I18n.t('Email')}
						inputRef={e => {
							inputs.name = e;
						}}
						defaultValue={visitor?.visitorEmails && visitor?.visitorEmails[0]?.address}
						onChangeText={text => onChangeText('email', text)}
						onSubmitEditing={() => {
							inputs.phone?.focus();
						}}
						theme={theme}
						editable={!!permissions[0]}
					/>
					<TextInput
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
						theme={theme}
						editable={!!permissions[0]}
					/>
					{Object.entries(customFields?.visitor || {}).map(([key, value], index, array) => (
						<TextInput
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
							theme={theme}
							editable={!!permissions[0]}
						/>
					))}
					<Title title={I18n.t('Conversation')} theme={theme} />
					<TextInput
						label={I18n.t('Topic')}
						inputRef={e => {
							inputs.topic = e;
						}}
						defaultValue={livechat?.topic}
						onChangeText={text => onChangeText('topic', text)}
						theme={theme}
						editable={!!permissions[1]}
					/>

					<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t('Tags')}</Text>
					<MultiSelect
						options={tagParam.map((tag: string) => ({ text: { text: tag }, value: tag }))}
						onChange={({ value }: { value: string[] }) => {
							setTagParamSelected([...value]);
						}}
						placeholder={{ text: I18n.t('Tags') }}
						value={tagParamSelected}
						context={BLOCK_CONTEXT.FORM}
						multiselect
						theme={theme}
						disabled={!permissions[1]}
						inputStyle={styles.multiSelect}
					/>

					{Object.entries(customFields?.livechat || {}).map(([key, value], index, array: any) => (
						<TextInput
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
							theme={theme}
							editable={!!permissions[1]}
						/>
					))}

					<Button title={I18n.t('Save')} onPress={submit} theme={theme} />
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	user: getUserSelector(state),
	editOmnichannelContact: state.permissions['edit-omnichannel-contact'],
	editLivechatRoomCustomfields: state.permissions['edit-livechat-room-customfields']
});

export default connect(mapStateToProps)(withTheme(LivechatEditView));

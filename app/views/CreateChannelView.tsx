import React, { memo, useCallback, useLayoutEffect, useState } from 'react';
import { shallowEqual, useDispatch } from 'react-redux';
import { FlatList, ScrollView, StyleSheet, Switch, Text, View, SwitchProps } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAppSelector, usePermissions } from '../lib/hooks';
import SearchBox from '../containers/SearchBox';
import Loading from '../containers/Loading';
import { createChannelRequest } from '../actions/createChannel';
import { removeUser as removeUserAction } from '../actions/selectedUsers';
import KeyboardView from '../containers/KeyboardView';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { SWITCH_TRACK_COLOR, themes } from '../lib/constants';
import { useTheme } from '../theme';
import { Review } from '../lib/methods/helpers/review';
import { events, logEvent } from '../lib/methods/helpers/log';
import SafeAreaView from '../containers/SafeAreaView';
import sharedStyles from './Styles';
import { ChatsStackParamList } from '../stacks/types';
import Chip from '../containers/Chip';
import Button from '../containers/Button';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	switchContainer: {
		minHeight: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 16,
		maxHeight: 80,
		marginBottom: 8
	},
	switchTextContainer: {
		flex: 1,
		marginRight: 8
	},
	label: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	hint: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	invitedHeader: {
		marginTop: 18,
		marginHorizontal: 15,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedCount: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	buttonCreate: {
		marginHorizontal: 16,
		marginTop: 24
	}
});

interface IOtherUser {
	_id: string;
	name: string;
	fname: string;
}

interface ISwitch extends SwitchProps {
	id: string;
	label: string;
	hint: string;
}

const RenderItem = memo(
	({ item, removeUser, useRealName }: { item: IOtherUser; useRealName: boolean; removeUser: (item: IOtherUser) => void }) => {
		const name = useRealName && item.fname ? item.fname : item.name;
		const username = item.name;

		return (
			<Chip text={name} avatar={username} onPress={() => removeUser(item)} testID={`create-channel-view-item-${item.name}`} />
		);
	},
	shallowEqual
);

const RenderSwitch = memo(({ id, value, label, hint, onValueChange, disabled = false }: ISwitch) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.switchContainer, { backgroundColor: colors.backgroundColor }]}>
			<View style={styles.switchTextContainer}>
				<Text style={[styles.label, { color: colors.titleText }]}>{I18n.t(label)}</Text>
				<Text style={[styles.hint, { color: colors.auxiliaryText }]}>{I18n.t(hint)}</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				testID={`create-channel-${id}`}
				trackColor={SWITCH_TRACK_COLOR}
				disabled={disabled}
			/>
		</View>
	);
}, shallowEqual);

const CreateChannelView = () => {
	const [channelName, setChannelName] = useState('');
	const [type, setType] = useState(true);
	const [readOnly, setReadOnly] = useState(false);
	const [encrypted, setEncrypted] = useState(false);
	const [broadcast, setBroadcast] = useState(false);

	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'CreateChannelView'>>();
	const { params } = useRoute<RouteProp<ChatsStackParamList, 'CreateChannelView'>>();
	const isTeam = params?.isTeam || false;
	const teamId = params?.teamId;
	const { theme } = useTheme();
	const dispatch = useDispatch();

	const { encryptionEnabled, isFetching, useRealName, users } = useAppSelector(
		state => ({
			isFetching: state.createChannel.isFetching,
			encryptionEnabled: state.encryption.enabled,
			users: state.selectedUsers.users,
			useRealName: state.settings.UI_Use_Real_Name as boolean
		}),
		shallowEqual
	);

	const permissions = usePermissions(['create-c', 'create-p']);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')
		});
	}, [isTeam, navigation]);

	const submit = () => {
		if (!channelName.trim() || isFetching) {
			return;
		}

		// transform users object into array of usernames
		const usersMapped = users.map(user => user.name);

		// create channel or team
		const data = {
			name: channelName,
			users: usersMapped,
			type,
			readOnly,
			broadcast,
			encrypted,
			isTeam,
			teamId
		};
		dispatch(createChannelRequest(data));
		Review.pushPositiveEvent();
	};

	const onValueChangeType = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_TYPE);
			// If we set the channel as public, encrypted status should be false
			setType(value);
			setEncrypted(value && encrypted);
		},
		[encrypted]
	);

	const renderType = () => {
		const isDisabled = permissions.filter(r => r === true).length <= 1;

		let hint = '';
		if (isTeam && type) {
			hint = 'Team_hint_private';
		}
		if (isTeam && !type) {
			hint = 'Team_hint_public';
		}
		if (!isTeam && type) {
			hint = 'Channel_hint_private';
		}
		if (!isTeam && !type) {
			hint = 'Channel_hint_public';
		}

		return (
			<RenderSwitch
				id={'type'}
				value={permissions[1] ? type : false}
				disabled={isDisabled}
				label={'Private'}
				hint={hint}
				onValueChange={onValueChangeType}
			/>
		);
	};

	const onValueChangeReadOnly = useCallback((value: boolean) => {
		logEvent(events.CR_TOGGLE_READ_ONLY);
		setReadOnly(value);
	}, []);

	const renderReadOnly = () => {
		let hint = '';
		if (readOnly) {
			hint = 'Read_only_hint';
		}
		if (isTeam && !readOnly) {
			hint = 'Team_hint_not_read_only';
		}
		if (!isTeam && !readOnly) {
			hint = 'Channel_hint_not_read_only';
		}

		return (
			<RenderSwitch
				id={'readonly'}
				value={readOnly}
				label={'Read_Only'}
				hint={hint}
				onValueChange={onValueChangeReadOnly}
				disabled={broadcast}
			/>
		);
	};

	const onValueChangeEncrypted = useCallback((value: boolean) => {
		logEvent(events.CR_TOGGLE_ENCRYPTED);
		setEncrypted(value);
	}, []);

	const renderEncrypted = () => {
		if (!encryptionEnabled) {
			return null;
		}

		let hint = '';
		if (isTeam && type) {
			hint = 'Team_hint_encrypted';
		}
		if (isTeam && !type) {
			hint = 'Team_hint_encrypted_not_available';
		}
		if (!isTeam && type) {
			hint = 'Channel_hint_encrypted';
		}
		if (!isTeam && !type) {
			hint = 'Channel_hint_encrypted_not_available';
		}

		return (
			<RenderSwitch
				id={'encrypted'}
				value={encrypted}
				label={'Encrypted'}
				hint={hint}
				onValueChange={onValueChangeEncrypted}
				disabled={!type}
			/>
		);
	};

	const onValueChangeBroadcast = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_BROADCAST);
			setBroadcast(value);
			setReadOnly(value ? true : readOnly);
		},
		[readOnly]
	);

	const renderBroadcast = () => (
		<RenderSwitch
			id={'broadcast'}
			value={broadcast}
			label={'Broadcast'}
			hint={'Broadcast_hint'}
			onValueChange={onValueChangeBroadcast}
		/>
	);

	const removeUser = useCallback(
		(user: IOtherUser) => {
			dispatch(removeUserAction(user));
		},
		[dispatch]
	);

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].backgroundColor }}
			contentContainerStyle={[sharedStyles.container, styles.container]}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='create-channel-view'>
				<ScrollView {...scrollPersistTaps}>
					<View style={{ borderColor: themes[theme].separatorColor }}>
						<SearchBox
							label={isTeam ? I18n.t('Team_Name') : I18n.t('Channel_Name')}
							onChangeText={setChannelName}
							testID='create-channel-name'
							returnKeyType='done'
						/>
						{renderType()}
						{renderReadOnly()}
						{renderEncrypted()}
						{renderBroadcast()}
					</View>
					{users.length > 0 ? (
						<>
							<View style={styles.invitedHeader}>
								<Text style={[styles.invitedCount, { color: themes[theme].auxiliaryText }]}>
									{I18n.t('N_Selected_members', { n: users.length })}
								</Text>
							</View>
							<FlatList
								data={users}
								extraData={users}
								keyExtractor={item => item._id}
								style={[
									styles.list,
									{
										backgroundColor: themes[theme].backgroundColor,
										borderColor: themes[theme].separatorColor
									}
								]}
								contentContainerStyle={{ paddingLeft: 16 }}
								renderItem={({ item }) => <RenderItem removeUser={removeUser} useRealName={useRealName} item={item} />}
								keyboardShouldPersistTaps='always'
								horizontal
							/>
						</>
					) : null}
					<Button
						title={isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')}
						type='primary'
						onPress={submit}
						disabled={!(channelName.trim().length > 0)}
						testID='create-channel-submit'
						loading={isFetching}
						style={styles.buttonCreate}
					/>
					<Loading visible={isFetching} />
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default CreateChannelView;

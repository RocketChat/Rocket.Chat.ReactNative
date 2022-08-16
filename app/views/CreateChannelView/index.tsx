import React, { memo, useCallback, useLayoutEffect, useState } from 'react';
import { shallowEqual, useDispatch } from 'react-redux';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm } from 'react-hook-form';

import { useAppSelector } from '../../lib/hooks';
import Loading from '../../containers/Loading';
import { createChannelRequest } from '../../actions/createChannel';
import { removeUser as removeUserAction } from '../../actions/selectedUsers';
import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { Review } from '../../lib/methods/helpers/review';
import { events, logEvent } from '../../lib/methods/helpers/log';
import SafeAreaView from '../../containers/SafeAreaView';
import sharedStyles from '../Styles';
import { ChatsStackParamList } from '../../stacks/types';
import Chip from '../../containers/Chip';
import Button from '../../containers/Button';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { RenderSwitch } from './RenderSwitch';
import { RenderType } from './RenderType';
import { RenderReadOnly } from './RenderReadOnly';
import { RenderEncrypted } from './RenderEncrypted';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
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

const Item = memo(
	({ item, removeUser, useRealName }: { item: IOtherUser; useRealName: boolean; removeUser: (item: IOtherUser) => void }) => {
		const name = useRealName && item.fname ? item.fname : item.name;
		const username = item.name;

		return (
			<Chip text={name} avatar={username} onPress={() => removeUser(item)} testID={`create-channel-view-item-${item.name}`} />
		);
	},
	shallowEqual
);

const CreateChannelView = () => {
	const {
		control,
		handleSubmit,
		formState: { isDirty }
	} = useForm<{ channelName: string }>({ defaultValues: { channelName: '' } });

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

	useLayoutEffect(() => {
		navigation.setOptions({
			title: isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')
		});
	}, [isTeam, navigation]);

	const submit = ({ channelName }: { channelName: string }) => {
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

	const onValueChangeReadOnly = useCallback((value: boolean) => {
		logEvent(events.CR_TOGGLE_READ_ONLY);
		setReadOnly(value);
	}, []);

	const onValueChangeEncrypted = useCallback((value: boolean) => {
		logEvent(events.CR_TOGGLE_ENCRYPTED);
		setEncrypted(value);
	}, []);

	const onValueChangeBroadcast = (value: boolean) => {
		logEvent(events.CR_TOGGLE_BROADCAST);
		setBroadcast(value);
		setReadOnly(value ? true : readOnly);
	};

	const removeUser = useCallback(
		(user: IOtherUser) => {
			dispatch(removeUserAction(user));
		},
		[dispatch]
	);

	console.count('👻 CreateChannelView');

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].backgroundColor }}
			contentContainerStyle={[sharedStyles.container, styles.container]}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='create-channel-view'>
				<ScrollView {...scrollPersistTaps}>
					<View style={{ borderColor: themes[theme].separatorColor, paddingHorizontal: 16, marginTop: 16 }}>
						<ControlledFormTextInput
							label={isTeam ? I18n.t('Team_Name') : I18n.t('Channel_Name')}
							testID='create-channel-name'
							returnKeyType='done'
							containerStyle={{ marginBottom: 32 }}
							name={'channelName'}
							control={control}
						/>
						<RenderType isTeam={isTeam} type={type} onValueChangeType={onValueChangeType} />
						<RenderReadOnly
							broadcast={broadcast}
							isTeam={isTeam}
							readOnly={readOnly}
							onValueChangeReadOnly={onValueChangeReadOnly}
						/>
						<RenderEncrypted
							encryptionEnabled={encryptionEnabled}
							isTeam={isTeam}
							type={type}
							encrypted={encrypted}
							onValueChangeEncrypted={onValueChangeEncrypted}
						/>
						<RenderSwitch
							id={'broadcast'}
							value={broadcast}
							label={'Broadcast'}
							hint={'Broadcast_hint'}
							onValueChange={onValueChangeBroadcast}
						/>
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
								renderItem={({ item }) => <Item removeUser={removeUser} useRealName={useRealName} item={item} />}
								keyboardShouldPersistTaps='always'
								horizontal
							/>
						</>
					) : null}
					<Button
						title={isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')}
						type='primary'
						onPress={handleSubmit(submit)}
						disabled={!isDirty}
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

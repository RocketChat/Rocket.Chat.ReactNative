import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { getUserSelector } from '../../selectors/login';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { createDiscussionRequest, ICreateDiscussionRequestData } from '../../actions/createDiscussion';
import SafeAreaView from '../../containers/SafeAreaView';
import { events, logEvent } from '../../lib/methods/helpers/log';
import styles from './styles';
import SelectUsers from './SelectUsers';
import SelectChannel from './SelectChannel';
import { ICreateChannelViewProps, IResult, IError } from './interfaces';
import { ISearchLocal, ISubscription } from '../../definitions';
import { E2E_ROOM_TYPES } from '../../lib/constants';
import { getRoomTitle } from '../../lib/methods/helpers';
import * as List from '../../containers/List';
import Switch from '../../containers/Switch';
import Button from '../../containers/Button';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import handleSubmitEvent from './utils/handleSubmitEvent';
import useA11yErrorAnnouncement from '../../lib/hooks/useA11yErrorAnnouncement';

const schema = yup.object().shape({
	name: yup.string().required(I18n.t('Discussion_name_required'))
});

const CreateDiscussionView = ({ route, navigation }: ICreateChannelViewProps) => {
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const {
		server,
		error,
		blockUnauthenticatedAccess,
		encryptionEnabled,
		failure,
		isMasterDetail,
		loading,
		result,
		serverVersion,
		user
	} = useAppSelector(state => ({
		user: getUserSelector(state),
		server: state.server.server,
		error: state.createDiscussion.error as IError,
		failure: state.createDiscussion.failure,
		loading: state.createDiscussion.isFetching,
		result: state.createDiscussion.result as IResult,
		blockUnauthenticatedAccess: !!(state.settings.Accounts_AvatarBlockUnauthenticatedAccess || true),
		serverVersion: state.server.version as string,
		isMasterDetail: state.app.isMasterDetail,
		encryptionEnabled: state.encryption.enabled
	}));

	const [channel, setChannel] = useState<ISubscription | ISearchLocal>(route.params?.channel);
	const [encrypted, setEncrypted] = useState<boolean>(encryptionEnabled);
	const [users, setUsers] = useState<string[]>([]);

	const message = route.params?.message;
	const {
		control,
		handleSubmit,
		watch,
		formState: { errors }
	} = useForm({
		defaultValues: {
			name: message?.msg || ''
		},
		resolver: yupResolver(schema)
	});

	const inputValues = watch();
	const prevLoading = useRef<boolean>(loading);
	const isEncryptionEnabled = encryptionEnabled && E2E_ROOM_TYPES[channel?.t];

	const selectChannel = ({ value }: { value: ISearchLocal }) => {
		logEvent(events.CD_SELECT_CHANNEL);
		setChannel(value);
		setEncrypted(value?.encrypted);
	};

	const selectUsers = ({ value }: { value: string[] }) => {
		logEvent(events.CD_SELECT_USERS);
		setUsers(value);
	};

	const onEncryptedChange = (value: boolean) => {
		logEvent(events.CD_TOGGLE_ENCRY);
		setEncrypted(value);
	};

	const submit = () => {
		const pmid = message?.id;
		const reply = '';
		const { name: t_name } = inputValues;

		if (!t_name || !channel.prid || !channel.rid) {
			return;
		}

		const params: ICreateDiscussionRequestData = {
			prid: ('prid' in channel && channel.prid) || channel.rid,
			pmid,
			t_name,
			reply,
			users
		};
		if (isEncryptionEnabled) {
			params.encrypted = encrypted ?? false;
		}

		dispatch(createDiscussionRequest(params));
	};

	useA11yErrorAnnouncement({ errors, inputValues });

	useEffect(() => {
		if (loading === prevLoading.current) {
			prevLoading.current = loading;
			return;
		}

		handleSubmitEvent({ loading, failure, isMasterDetail, error, result });
		prevLoading.current = loading;
	}, [loading]);

	useLayoutEffect(() => {
		const showCloseModal = route.params?.showCloseModal;
		navigation.setOptions({
			title: I18n.t('Create_Discussion'),
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} /> : undefined
		});
	}, [navigation, route]);

	return (
		<KeyboardView style={styles.container} backgroundColor={colors.surfaceHover}>
			<StatusBar />
			<SafeAreaView testID='create-discussion-view'>
				<ScrollView {...scrollPersistTaps}>
					<Text style={[styles.description, { color: colors.fontDefault }]}>{I18n.t('Discussion_Desc')}</Text>
					<View style={styles.form}>
						<SelectChannel
							server={server}
							userId={user.id}
							token={user.token}
							initial={channel && { text: getRoomTitle(channel) }}
							onChannelSelect={selectChannel}
							blockUnauthenticatedAccess={blockUnauthenticatedAccess}
							serverVersion={serverVersion}
						/>
						<ControlledFormTextInput
							control={control}
							name='name'
							required
							error={errors.name?.message}
							label={I18n.t('Discussion_name')}
							testID='multi-select-discussion-name'
							containerStyle={styles.inputStyle}
						/>
						<SelectUsers
							server={server}
							userId={user.id}
							token={user.token}
							selected={users}
							onUserSelect={selectUsers}
							blockUnauthenticatedAccess={blockUnauthenticatedAccess}
							serverVersion={serverVersion}
						/>
					</View>

					{isEncryptionEnabled ? (
						<>
							<List.Item
								title='Encrypted'
								testID='room-actions-encrypt'
								right={() => <Switch value={encrypted} onValueChange={onEncryptedChange} />}
								additionalAcessibilityLabel={encrypted}
							/>
						</>
					) : null}

					<Button
						testID='create-discussion-submit'
						style={{ marginTop: 36 }}
						title={I18n.t('Create_Discussion')}
						onPress={handleSubmit(submit)}
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default CreateDiscussionView;

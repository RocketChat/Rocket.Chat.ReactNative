import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { UseFormSetValue } from 'react-hook-form';

import { useAppSelector } from '../../../lib/hooks';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { SwitchItem } from './SwitchItem';
import { SwitchItemType } from './SwitchItemType';
import { SwitchItemReadOnly } from './SwitchItemReadOnly';
import { SwitchItemEncrypted } from './SwitchItemEncrypted';
import { IFormData } from '..';

const styles = StyleSheet.create({
	container: {
		gap: 12,
		paddingVertical: 12
	}
});

export const RoomSettings = ({
	isTeam,
	setValue,
	createChannelPermission,
	createPrivateChannelPermission,
	e2eEnabledDefaultPrivateRooms
}: {
	isTeam: boolean;
	setValue: UseFormSetValue<IFormData>;
	createChannelPermission: boolean;
	createPrivateChannelPermission: boolean;
	e2eEnabledDefaultPrivateRooms: boolean;
}) => {
	const [type, setType] = useState(true);
	const [readOnly, setReadOnly] = useState(false);
	const [encrypted, setEncrypted] = useState(e2eEnabledDefaultPrivateRooms);
	const [broadcast, setBroadcast] = useState(false);

	const { encryptionEnabled } = useAppSelector(state => ({
		encryptionEnabled: state.encryption.enabled
	}));

	const onValueChangeType = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_TYPE);
			// If we set the channel as public, encrypted status should be false
			setType(value);
			setValue('type', value);
			setEncrypted(value && encrypted);
			setValue('encrypted', value && encrypted);
		},
		[encrypted]
	);

	const onValueChangeReadOnly = useCallback((value: boolean) => {
		logEvent(events.CR_TOGGLE_READ_ONLY);
		setReadOnly(value);
		setValue('readOnly', value);
	}, []);

	const onValueChangeEncrypted = useCallback((value: boolean) => {
		logEvent(events.CR_TOGGLE_ENCRYPTED);
		setEncrypted(value);
		setValue('encrypted', value);
	}, []);

	const onValueChangeBroadcast = (value: boolean) => {
		logEvent(events.CR_TOGGLE_BROADCAST);
		setBroadcast(value);
		setValue('broadcast', value);
		setReadOnly(value ? true : readOnly);
		setValue('readOnly', value ? true : readOnly);
	};

	const isDisabled = [createChannelPermission, createPrivateChannelPermission].filter(r => r === true).length <= 1;

	return (
		<View style={styles.container}>
			<SwitchItemType
				isTeam={isTeam}
				type={createPrivateChannelPermission ? type : false}
				onValueChangeType={onValueChangeType}
				isDisabled={isDisabled}
			/>
			<SwitchItem
				id={'broadcast'}
				value={broadcast}
				label={'Broadcast'}
				hint={'Broadcast_hint'}
				onValueChange={onValueChangeBroadcast}
			/>
			<SwitchItemReadOnly
				broadcast={broadcast}
				isTeam={isTeam}
				readOnly={readOnly}
				onValueChangeReadOnly={onValueChangeReadOnly}
			/>
			<SwitchItemEncrypted
				encryptionEnabled={encryptionEnabled}
				isTeam={isTeam}
				type={type}
				encrypted={encrypted}
				onValueChangeEncrypted={onValueChangeEncrypted}
			/>
		</View>
	);
};

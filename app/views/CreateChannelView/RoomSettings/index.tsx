import React, { useCallback, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { useAppSelector } from '../../../lib/hooks';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { SwitchItem } from './SwitchItem';
import { SwitchItemType } from './SwitchItemType';
import { SwitchItemReadOnly } from './SwitchItemReadOnly';
import { SwitchItemEncrypted } from './SwitchItemEncrypted';
import { IFormData } from '..';

export const RoomSettings = ({
	isTeam,
	setValue,
	createChannelPermission,
	createPrivateChannelPermission
}: {
	isTeam: boolean;
	setValue: UseFormSetValue<IFormData>;
	createChannelPermission: boolean;
	createPrivateChannelPermission: boolean;
}) => {
	const [type, setType] = useState(true);
	const [readOnly, setReadOnly] = useState(false);
	const [encrypted, setEncrypted] = useState(false);
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
		<>
			<SwitchItemType
				isTeam={isTeam}
				type={createPrivateChannelPermission ? type : false}
				onValueChangeType={onValueChangeType}
				isDisabled={isDisabled}
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
			<SwitchItem
				id={'broadcast'}
				value={broadcast}
				label={'Broadcast'}
				hint={'Broadcast_hint'}
				onValueChange={onValueChangeBroadcast}
			/>
		</>
	);
};

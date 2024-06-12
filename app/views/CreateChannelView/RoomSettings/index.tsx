import React, { useCallback, useMemo, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { IFormData } from '..';
import { useSetting } from '../../../lib/hooks/useSetting';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { SwitchItem } from './SwitchItem';
import { SwitchItemEncrypted } from './SwitchItemEncrypted';
import { SwitchItemReadOnly } from './SwitchItemReadOnly';
import { SwitchItemType } from './SwitchItemType';

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
	const e2eEnabled = useSetting<boolean>('E2E_Enable');
	const e2eEnabledForPrivateByDefault = useSetting<boolean>('E2E_Enabled_Default_PrivateRooms');

	const [type, setType] = useState(true);
	const [readOnly, setReadOnly] = useState(false);
	const [encrypted, setEncrypted] = useState(e2eEnabledForPrivateByDefault);
	const [broadcast, setBroadcast] = useState(false);

	const canOnlyCreateOneType = useMemo(() => {
		if (!createChannelPermission && createPrivateChannelPermission) return 'p';
		if (createChannelPermission && !createPrivateChannelPermission) return 'c';
		return false;
	}, [createChannelPermission, createPrivateChannelPermission]);

	const isPrivate = useMemo(() => (canOnlyCreateOneType ? canOnlyCreateOneType === 'p' : true), [canOnlyCreateOneType]);
	const e2eDisabled = useMemo(() => !isPrivate || broadcast || !e2eEnabled, [e2eEnabled, broadcast, isPrivate]);

	const onValueChangeType = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_TYPE);
			setType(value);
			setValue('type', value);
			const newEncryptedValue = value && encrypted;
			setEncrypted(newEncryptedValue);
			setValue('encrypted', newEncryptedValue);
		},
		[encrypted, setValue]
	);

	const onValueChangeReadOnly = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_READ_ONLY);
			setReadOnly(value);
			setValue('readOnly', value);
		},
		[setValue]
	);

	const onValueChangeEncrypted = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_ENCRYPTED);
			setEncrypted(value);
			setValue('encrypted', value);
		},
		[setValue]
	);

	const onValueChangeBroadcast = useCallback(
		(value: boolean) => {
			logEvent(events.CR_TOGGLE_BROADCAST);
			setBroadcast(value);
			setValue('broadcast', value);
			const newReadOnlyValue = value ? true : readOnly;
			setReadOnly(newReadOnlyValue);
			setValue('readOnly', newReadOnlyValue);
			if (encrypted && value) {
				setEncrypted(false);
				setValue('encrypted', false);
			}
		},
		[encrypted, readOnly, setValue]
	);

	const isDisabled = useMemo(
		() => [createChannelPermission, createPrivateChannelPermission].filter(Boolean).length <= 1,
		[createChannelPermission, createPrivateChannelPermission]
	);

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
				encryptionDisabled={e2eDisabled}
				isTeam={isTeam}
				type={type}
				encrypted={encrypted}
				disabled={e2eEnabledForPrivateByDefault}
				onValueChangeEncrypted={onValueChangeEncrypted}
			/>
			<SwitchItem
				id='broadcast'
				value={broadcast}
				label='Broadcast'
				hint='Broadcast_hint'
				onValueChange={onValueChangeBroadcast}
			/>
		</>
	);
};

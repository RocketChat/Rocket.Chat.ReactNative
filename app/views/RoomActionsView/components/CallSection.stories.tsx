import React from 'react';
import { View, StyleSheet } from 'react-native';

import CallSection from './CallSection';
import type { ISubscription, TSubscriptionModel } from '../../../definitions';
import { SubscriptionType } from '../../../definitions';
import { clearEnterpriseModules, setEnterpriseModules } from '../../../actions/enterpriseModules';
import { setPermissions } from '../../../actions/permissions';
import { setUser } from '../../../actions/login';
import { mockedStore } from '../../../reducers/mockedStore';
import { addSettings } from '../../../actions/settings';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		minHeight: 200
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

const createMockRoom = (overrides: Partial<ISubscription> = {}): TSubscriptionModel =>
	({
		_id: 'room1',
		rid: 'room1',
		id: 'room1',
		t: SubscriptionType.DIRECT,
		name: 'john.doe',
		fname: 'John Doe',
		uids: ['abc', 'user123'],
		ls: new Date(),
		ts: new Date(),
		lm: '',
		lr: '',
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		tunread: [],
		open: true,
		alert: false,
		f: false,
		archived: false,
		roomUpdatedAt: new Date(),
		ro: false,
		...overrides
	} as TSubscriptionModel);

const withVoiceAndVideoCallEnabled = (Story: React.ComponentType) => {
	mockedStore.dispatch(setEnterpriseModules(['teams-voip']));
	mockedStore.dispatch(addSettings({ VideoConf_Enable_DMs: true }));
	mockedStore.dispatch(
		setPermissions({
			'allow-internal-voice-calls': ['user'],
			'allow-external-voice-calls': ['user'],
			'call-management': ['user']
		})
	);
	mockedStore.dispatch(setUser({ roles: ['user'] }));
	return <Story />;
};

const withVoiceCallDisabled = (Story: React.ComponentType) => {
	mockedStore.dispatch(clearEnterpriseModules());
	return <Story />;
};

export default {
	title: 'RoomActionsView/CallSection',
	component: CallSection,
	decorators: [withVoiceAndVideoCallEnabled]
};

export const Default = () => (
	<Wrapper>
		<CallSection room={createMockRoom()} disabled={false} />
	</Wrapper>
);

export const Disabled = () => (
	<Wrapper>
		<CallSection room={createMockRoom()} disabled={true} />
	</Wrapper>
);

export const NoVoiceCall = {
	render: () => (
		<Wrapper>
			<CallSection room={createMockRoom()} disabled={false} />
		</Wrapper>
	),
	decorators: [withVoiceCallDisabled]
};

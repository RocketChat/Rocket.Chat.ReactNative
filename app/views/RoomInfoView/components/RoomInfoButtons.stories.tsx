import React from 'react';
import { View, StyleSheet } from 'react-native';

import { RoomInfoButtons, RoomInfoVideoConfOverrideContext } from './RoomInfoButtons';
import type { ISubscription } from '../../../definitions';
import { SubscriptionType } from '../../../definitions';
import { clearEnterpriseModules, setEnterpriseModules } from '../../../actions/enterpriseModules';
import { setPermissions } from '../../../actions/permissions';
import { setUser } from '../../../actions/login';
import { mockedStore } from '../../../reducers/mockedStore';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		minHeight: 200
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

const createMockRoom = (overrides: Partial<ISubscription> = {}): ISubscription =>
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
	} as ISubscription);

const defaultHandlers = {
	handleCreateDirectMessage: () => {},
	handleIgnoreUser: () => {},
	handleBlockUser: () => {},
	handleReportUser: () => {},
	showActionSheet: () => {}
};

const withVoiceCallEnabled = (Story: React.ComponentType) => {
	mockedStore.dispatch(setEnterpriseModules(['teams-voip']));
	mockedStore.dispatch(
		setPermissions({
			'allow-internal-voice-calls': ['user'],
			'allow-external-voice-calls': ['user']
		})
	);
	mockedStore.dispatch(setUser({ roles: ['user'] }));
	return <Story />;
};

const withVideoCallEnabled = (Story: React.ComponentType) => (
	<RoomInfoVideoConfOverrideContext.Provider
		value={{
			callEnabled: true,
			disabledTooltip: false,
			showInitCallActionSheet: async () => {}
		}}>
		<Story />
	</RoomInfoVideoConfOverrideContext.Provider>
);

export default {
	title: 'RoomInfoView/RoomInfoButtons',
	component: RoomInfoButtons,
	decorators: [withVoiceCallEnabled, withVideoCallEnabled]
};

export const Default = () => (
	<Wrapper>
		<RoomInfoButtons
			rid='room1'
			room={createMockRoom()}
			roomUserId='user123'
			isDirect={true}
			fromRid='room1'
			roomFromRid={undefined}
			serverVersion='7.0.0'
			itsMe={false}
			{...defaultHandlers}
		/>
	</Wrapper>
);

export const ItsMe = () => (
	<Wrapper>
		<RoomInfoButtons
			rid='room1'
			room={createMockRoom()}
			roomUserId='abc'
			isDirect={true}
			fromRid='room1'
			roomFromRid={undefined}
			serverVersion='7.0.0'
			itsMe={true}
			{...defaultHandlers}
		/>
	</Wrapper>
);

export const WithRoomFromRid = () => (
	<Wrapper>
		<RoomInfoButtons
			rid='room1'
			room={createMockRoom()}
			roomUserId='user123'
			isDirect={true}
			fromRid='room1'
			roomFromRid={createMockRoom()}
			serverVersion='7.0.0'
			itsMe={false}
			{...defaultHandlers}
		/>
	</Wrapper>
);

export const WithIgnoredUser = () => (
	<Wrapper>
		<RoomInfoButtons
			rid='room1'
			room={createMockRoom({ ignored: ['user123'] })}
			roomUserId='user123'
			isDirect={true}
			fromRid='room1'
			roomFromRid={undefined}
			serverVersion='7.0.0'
			itsMe={false}
			{...defaultHandlers}
		/>
	</Wrapper>
);

export const WithBlockedUser = () => (
	<Wrapper>
		<RoomInfoButtons
			rid='room1'
			room={createMockRoom({ blocker: true })}
			roomUserId='user123'
			isDirect={true}
			fromRid='room1'
			roomFromRid={undefined}
			serverVersion='7.0.0'
			itsMe={false}
			{...defaultHandlers}
		/>
	</Wrapper>
);

const withVoiceCallDisabled = (Story: React.ComponentType) => {
	mockedStore.dispatch(clearEnterpriseModules());
	return <Story />;
};

export const OlderServer = {
	render: () => (
		<Wrapper>
			<RoomInfoButtons
				rid='room1'
				room={createMockRoom()}
				roomUserId='user123'
				isDirect={true}
				fromRid='room1'
				roomFromRid={undefined}
				serverVersion='5.0.0'
				itsMe={false}
				{...defaultHandlers}
			/>
		</Wrapper>
	),
	decorators: [withVoiceCallDisabled]
};

export const NoVoiceCall = {
	render: () => (
		<Wrapper>
			<RoomInfoButtons
				rid='room1'
				room={createMockRoom()}
				roomUserId='user123'
				isDirect={true}
				fromRid='room1'
				roomFromRid={undefined}
				serverVersion='7.0.0'
				itsMe={false}
				{...defaultHandlers}
			/>
		</Wrapper>
	),
	decorators: [withVoiceCallDisabled]
};

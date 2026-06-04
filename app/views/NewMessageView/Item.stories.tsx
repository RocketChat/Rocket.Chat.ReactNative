import React from 'react';
import { View, StyleSheet } from 'react-native';

import Item from './Item';
import { mockedStore } from '../../reducers/mockedStore';
import { setUser } from '../../actions/login';
import { setPermissions } from '../../actions/permissions';
import { setEnterpriseModules } from '../../actions/enterpriseModules';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		flex: 1,
		minHeight: 100
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

const withVoiceCallEnabled = (Story: React.ComponentType) => {
	mockedStore.dispatch(setEnterpriseModules(['teams-voip']));
	mockedStore.dispatch(setPermissions({ 'allow-internal-voice-calls': ['user'], 'allow-external-voice-calls': ['user'] }));
	mockedStore.dispatch(setUser({ roles: ['user'] }));
	return <Story />;
};

const withVoiceCallDisabled = (Story: React.ComponentType) => {
	mockedStore.dispatch(setEnterpriseModules([]));
	mockedStore.dispatch(setPermissions({ 'allow-internal-voice-calls': [], 'allow-external-voice-calls': [] }));
	mockedStore.dispatch(setUser({ roles: ['user'] }));
	return <Story />;
};

export default {
	title: 'NewMessageView/Item',
	component: Item,
	decorators: [withVoiceCallEnabled]
};

export const Default = () => (
	<Wrapper>
		<Item
			userId='user123'
			name='John Doe'
			username='john.doe'
			onPress={() => {}}
			onLongPress={() => {}}
			testID='new-message-view-item-john.doe'
		/>
	</Wrapper>
);

export const LongName = () => (
	<Wrapper>
		<Item
			userId='user123'
			name='Very Long Display Name That Might Get Truncated'
			username='long.name'
			onPress={() => {}}
			testID='new-message-view-item-long.name'
		/>
	</Wrapper>
);

export const NoVoiceCallPermission = {
	render: () => (
		<Wrapper>
			<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
		</Wrapper>
	),
	decorators: [withVoiceCallDisabled]
};

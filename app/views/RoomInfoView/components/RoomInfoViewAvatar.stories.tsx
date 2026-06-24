import { type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import RoomInfoViewAvatar from './RoomInfoViewAvatar';
import { SubscriptionType } from '../../../definitions';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		backgroundColor: '#ffffff',
		minHeight: 200,
		alignItems: 'center'
	}
});

const Wrapper = ({ children }: { children: ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'RoomInfoView/RoomInfoViewAvatar',
	component: RoomInfoViewAvatar
};

export const Default = () => (
	<Wrapper>
		<RoomInfoViewAvatar
			showEdit={false}
			type={SubscriptionType.DIRECT}
			username='john.doe'
			rid='rid1'
			handleEditAvatar={() => {}}
		/>
	</Wrapper>
);

export const WithEdit = () => (
	<Wrapper>
		<RoomInfoViewAvatar showEdit type={SubscriptionType.DIRECT} username='john.doe' rid='rid1' handleEditAvatar={() => {}} />
	</Wrapper>
);

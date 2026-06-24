import { type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import RoomInfoViewTitle from './RoomInfoViewTitle';
import { SubscriptionType } from '../../../definitions';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		backgroundColor: '#ffffff',
		minHeight: 200
	}
});

const Wrapper = ({ children }: { children: ReactNode }) => <View style={styles.container}>{children}</View>;

const futureExpiry = new Date(Date.now() + 3600000).toISOString();

export default {
	title: 'RoomInfoView/RoomInfoViewTitle',
	component: RoomInfoViewTitle
};

export const DM_Status = () => (
	<>
		<Wrapper>
			<RoomInfoViewTitle name='John Doe' username='john.doe' userId='user1' status='online' type={SubscriptionType.DIRECT} />
		</Wrapper>
		<Wrapper>
			<RoomInfoViewTitle name='John Doe' username='john.doe' userId='user2' status='away' type={SubscriptionType.DIRECT} />
		</Wrapper>
		<Wrapper>
			<RoomInfoViewTitle name='John Doe' username='john.doe' userId='user3' status='busy' type={SubscriptionType.DIRECT} />
		</Wrapper>
		<Wrapper>
			<RoomInfoViewTitle name='John Doe' username='john.doe' userId='user4' status='offline' type={SubscriptionType.DIRECT} />
		</Wrapper>
		<Wrapper>
			<RoomInfoViewTitle
				name='John Doe'
				username='john.doe'
				userId='user5'
				status='online'
				statusText='In a meeting'
				type={SubscriptionType.DIRECT}
			/>
		</Wrapper>
		<Wrapper>
			<RoomInfoViewTitle
				name='John Doe'
				username='john.doe'
				userId='user6'
				status='online'
				statusText='In a meeting'
				statusExpiresAt={futureExpiry}
				type={SubscriptionType.DIRECT}
			/>
		</Wrapper>
		<Wrapper>
			<RoomInfoViewTitle
				name='Jane Smith'
				username='jane.smith'
				userId='user7'
				status='busy'
				statusText='On call'
				type={SubscriptionType.DIRECT}
			/>
		</Wrapper>
	</>
);

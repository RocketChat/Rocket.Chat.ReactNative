import { StyleSheet, View } from 'react-native';

import User from '../User';
import Thread from '../Thread';
import Reactions from '../Reactions';
import Broadcast from '../Broadcast';
import MessageTime from '../Time';
import { ContentLayout } from './ContentLayout';
import { useStartsWithAttachment } from './useStartsWithAttachment';

const styles = StyleSheet.create({
	body: {
		gap: 4
	},
	bodyStartsWithAttachment: {
		gap: 4,
		paddingTop: 4
	}
});

const StandardLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	const startsWithAttachment = useStartsWithAttachment();

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<View style={startsWithAttachment ? styles.bodyStartsWithAttachment : styles.body}>
				<ContentLayout />
				<Thread />
				<Reactions />
				<Broadcast />
			</View>
		</>
	);
};

export default StandardLayout;

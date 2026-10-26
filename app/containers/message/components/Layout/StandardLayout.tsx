import { View } from 'react-native';

import User from '../User';
import Thread from '../Thread';
import Reactions from '../Reactions';
import Broadcast from '../Broadcast';
import MessageTime from '../Time';
import { ContentLayout } from './ContentLayout';

const StandardLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<View style={{ gap: 4 }}>
				<ContentLayout />
				<Thread />
				<Reactions />
				<Broadcast />
			</View>
		</>
	);
};

export default StandardLayout;

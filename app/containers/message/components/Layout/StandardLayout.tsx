import { View } from 'react-native';

import User from '../User';
import Thread from '../Thread';
import Reactions from '../Reactions';
import Broadcast from '../Broadcast';
import MessageTime from '../Time';
import { AttachmentLayout } from './AttachmentLayout';

const StandardLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<View style={{ gap: 4 }}>
				<AttachmentLayout />
				<Thread />
				<Reactions />
				<Broadcast />
			</View>
		</>
	);
};

export default StandardLayout;

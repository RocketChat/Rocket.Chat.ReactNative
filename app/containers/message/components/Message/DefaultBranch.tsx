import { View } from 'react-native';

import User from '../User';
import Thread from '../Thread';
import Reactions from '../Reactions';
import Broadcast from '../Broadcast';
import MessageTime from '../Time';
import { BranchAttachmentContent } from './BranchAttachmentContent';

const DefaultBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<View style={{ gap: 4 }}>
				<BranchAttachmentContent />
				<Thread />
				<Reactions />
				<Broadcast />
			</View>
		</>
	);
};

DefaultBranch.displayName = 'MessageDefaultBranch';

export default DefaultBranch;

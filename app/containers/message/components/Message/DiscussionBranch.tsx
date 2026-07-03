import User from '../User';
import Discussion from '../Discussion';
import MessageTime from '../Time';

const DiscussionBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<Discussion />
		</>
	);
};

DiscussionBranch.displayName = 'MessageDiscussionBranch';

export default DiscussionBranch;

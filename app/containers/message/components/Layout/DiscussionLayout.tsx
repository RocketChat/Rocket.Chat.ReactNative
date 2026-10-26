import User from '../User';
import Discussion from '../Discussion';
import MessageTime from '../Time';

const DiscussionLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<Discussion />
		</>
	);
};

export default DiscussionLayout;

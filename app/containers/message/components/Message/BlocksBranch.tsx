import User from '../User';
import Blocks from '../Blocks';
import Thread from '../Thread';
import Reactions from '../Reactions';
import MessageTime from '../Time';

const BlocksBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			<Blocks />
			<Thread />
			<Reactions />
			{showTimeLarge ? <MessageTime /> : null}
		</>
	);
};

BlocksBranch.displayName = 'MessageBlocksBranch';

export default BlocksBranch;

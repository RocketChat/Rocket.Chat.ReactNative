import User from '../User';
import Content from '../Content';
import CallButton from '../CallButton';
import MessageTime from '../Time';

const JitsiBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			<Content isInfo />
			<CallButton />
			{showTimeLarge ? <MessageTime /> : null}
		</>
	);
};

export default JitsiBranch;

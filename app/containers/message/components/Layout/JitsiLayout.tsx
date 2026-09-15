import User from '../User';
import Content from '../Content';
import CallButton from '../CallButton';
import MessageTime from '../Time';

const JitsiLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	return (
		<>
			<User />
			<Content isInfo />
			<CallButton />
			{showTimeLarge ? <MessageTime /> : null}
		</>
	);
};

export default JitsiLayout;

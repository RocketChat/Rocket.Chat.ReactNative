import User from '../User';
import MessageTime from '../Time';
import { ContentLayout } from './ContentLayout';

const PreviewLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<ContentLayout />
		</>
	);
};

export default PreviewLayout;

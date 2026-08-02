import User from '../User';
import MessageTime from '../Time';
import { ContentLayout } from './ContentLayout';

const PreviewLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<ContentLayout />
		</>
	);
};

export default PreviewLayout;

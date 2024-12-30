import { useActionSheet } from '../../../containers/ActionSheet';
import StartCallActionSheet from './StartCallActionSheet';

export const useStartCall = ({ rid, ruid }: { rid: string; ruid: string }) => {
	const { showActionSheet } = useActionSheet();

	const startCall = () => {
		showActionSheet({
			children: <StartCallActionSheet rid={rid} ruid={ruid} />
		});
	};

	return {
		startCall
	};
};

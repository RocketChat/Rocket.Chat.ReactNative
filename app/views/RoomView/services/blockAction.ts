import { triggerBlockAction } from '../../../lib/methods/triggerActions';
import { ContainerTypes } from '../../../containers/UIKit/interfaces';

export const blockAction = ({
	actionId,
	appId,
	value,
	blockId,
	rid,
	mid
}: {
	actionId: string;
	appId: string;
	value: any;
	blockId: string;
	rid: string;
	mid: string;
}): ReturnType<typeof triggerBlockAction> =>
	triggerBlockAction({
		blockId,
		actionId,
		value,
		mid,
		rid,
		appId,
		container: {
			type: ContainerTypes.MESSAGE,
			id: mid
		}
	});

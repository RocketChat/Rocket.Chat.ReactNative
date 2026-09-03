import { triggerBlockAction } from '../../../lib/methods/triggerActions';
import { ContainerTypes, type ITriggerBlockAction } from '../../../containers/UIKit/interfaces';

type TBlockActionParams = Omit<ITriggerBlockAction, 'container' | 'mid'> & { mid: string };

export const blockAction = (params: TBlockActionParams): ReturnType<typeof triggerBlockAction> =>
	triggerBlockAction({
		...params,
		container: {
			type: ContainerTypes.MESSAGE,
			id: params.mid
		}
	});

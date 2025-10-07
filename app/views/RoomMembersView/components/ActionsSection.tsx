import React from 'react';

import { TSubscriptionModel } from '../../../definitions';

interface IActionsSection {
        rid: TSubscriptionModel['rid'];
        t: TSubscriptionModel['t'];
        joined: boolean;
}

export default function ActionsSection({}: IActionsSection): React.ReactElement | null {
        return null;
}

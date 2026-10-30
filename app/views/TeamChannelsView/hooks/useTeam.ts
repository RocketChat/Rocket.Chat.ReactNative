import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import { type TSubscriptionModel } from '~/definitions';
import I18n from '~/i18n';
import database from '~/lib/database';
import { useAppNavigation } from '~/lib/hooks/navigation';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { type ChatsStackParamList } from '~/stacks/types';

const findTeamMain = async (teamId: string) => {
	const teamSubscriptions = (await database.active
		.get('subscriptions')
		.query(Q.where('team_id', Q.eq(teamId)))
		.fetch()) as TSubscriptionModel[];
	return teamSubscriptions.find(subscription => subscription.teamMain);
};

export const useTeam = (teamId: string) => {
	const navigation = useAppNavigation<ChatsStackParamList, 'TeamChannelsView'>();
	const [team, setTeam] = useState<TSubscriptionModel | null>(null);

	useEffect(() => {
		let isCancelled = false;
		const failNotFound = () => {
			if (isCancelled) {
				return;
			}
			navigation.pop();
			showErrorAlert(I18n.t('Team_not_found'));
		};

		findTeamMain(teamId)
			.then(teamMain => (teamMain ? setTeam(teamMain) : failNotFound()))
			.catch(failNotFound);
		return () => {
			isCancelled = true;
		};
	}, [teamId, navigation]);

	return team;
};

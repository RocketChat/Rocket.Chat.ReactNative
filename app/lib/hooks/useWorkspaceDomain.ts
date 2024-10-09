import parse from 'url-parse';

import { useAppSelector } from "./useAppSelector"

export const useWorkspaceDomain = (): string => {
	const { Site_Url } = useAppSelector(state => ({
		Site_Url: state.settings.Site_Url as string
	}));

	return new parse(Site_Url).hostname;
};
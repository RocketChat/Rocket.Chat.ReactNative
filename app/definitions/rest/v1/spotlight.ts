import { type ISpotlight } from '~/definitions/ISpotlight';

export type SpotlightEndpoints = {
	spotlight: {
		GET: (params: { query: string; usernames?: string; type?: string; rid?: string }) => ISpotlight;
	};
};

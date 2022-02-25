export type E2eEndpoints = {
	'e2e.setUserPublicAndPrivateKeys': {
		POST: (params: { public_key: string; private_key: string }) => void;
	};
};

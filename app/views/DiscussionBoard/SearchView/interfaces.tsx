export type searchResultProps = {
	title: string;
	description?: string;
};

export type searchItemProps = {
	item: searchResultProps;
	index: number;
};

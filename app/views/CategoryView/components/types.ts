export interface ISectionPill {
	header: string;
	title: string;
	selected: boolean;
	onSelect: (header: string, title: string) => void;
}

export interface ISectionPills {
	sections: { header: string; title: string }[];
	selectedHeader: string;
	onSelect: (header: string, title: string) => void;
}

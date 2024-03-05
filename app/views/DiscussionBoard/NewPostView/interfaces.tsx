export type BoardDropdownModalProps = {
	show: boolean;
	close: () => void;
	data: any[];
	onSelect: (data: any) => void;
};

export type ReadyToPostModalProps = {
	show: boolean;
	close: () => void;
	onPost: () => void;
};

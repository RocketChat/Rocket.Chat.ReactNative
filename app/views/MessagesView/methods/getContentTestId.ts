interface IGetContentTestId {
	screenName: string;
}

const getContentTestId = ({ screenName }: IGetContentTestId): string | undefined => {
	switch (screenName) {
		case 'Files':
			return 'room-files-view';
		case 'Mentions':
			return 'mentioned-messages-view';
		case 'Starred':
			return 'starred-messages-view';
		case 'Pinned':
			return 'pinned-messages-view';
	}
};

export default getContentTestId;

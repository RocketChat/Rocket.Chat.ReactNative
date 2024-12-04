const getActionIcon = (screenName: string) => {
	switch (screenName) {
		case 'Starred':
			return 'star-filled';

		case 'Pinned':
			return 'pin';
	}
};

export default getActionIcon;

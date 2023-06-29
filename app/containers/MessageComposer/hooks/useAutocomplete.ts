import { useEffect, useState } from 'react';

import { IAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';

export const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState<IAutocompleteItem[]>([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			if (type === '@' || type === '#') {
				const res = await search({ text, filterRooms: type === '#', filterUsers: type === '@', rid });
				const parsedRes = res.map(item => ({
					// @ts-ignore
					id: item.rid || item._id,
					// @ts-ignore
					title: item.fname || item.name || item.username,
					// @ts-ignore
					subtitle: item.username || item.name,
					// @ts-ignore
					outside: item.outside
				}));
				setItems(parsedRes);
			}
		};
		getAutocomplete();
	}, [text, type, rid]);
	return items;
};

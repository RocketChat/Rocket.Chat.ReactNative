import { useEffect, useState } from 'react';

import { IAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';

export const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState<IAutocompleteItem[]>([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			if (type === '@') {
				const res = await search({ text, filterRooms: false, filterUsers: true, rid });
				// @ts-ignore
				const parsedRes = res.map(item => ({ id: item.rid || item._id, title: item.username, subtitle: item.name }));
				setItems(parsedRes);
			}
		};
		getAutocomplete();
	}, [text, type, rid]);
	return items;
};

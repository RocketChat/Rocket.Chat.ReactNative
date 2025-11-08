const getBlockValueString = (v: any): string => {
	if (!v) return 'null';
	if (typeof v === 'string') return v;
	if (typeof v?.value === 'string') return v.value;
	if (Array.isArray(v)) return v.map(getBlockValueString).join('');
	return JSON.stringify(v).slice(0, 20);
};
export default getBlockValueString;

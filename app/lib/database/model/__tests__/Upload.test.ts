import Upload from '../Upload';
import appSchema from '../../schema/app';

const toCamelCase = (column: string) => column.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

describe('Upload model', () => {
	it('hands back everything a retry needs, caption and image size included', () => {
		const stored = {
			id: 'a.jpg-GENERAL',
			subscription: { id: 'GENERAL' },
			path: '/cache/a.jpg',
			name: 'a.jpg',
			tmid: 'threadId',
			description: 'alt text',
			size: 2048,
			type: 'image/jpeg',
			store: 'Uploads',
			msg: 'the caption',
			width: 640,
			height: 480
		};

		expect(Upload.prototype.asPlain.call(stored)).toEqual({
			id: 'a.jpg-GENERAL',
			rid: 'GENERAL',
			path: '/cache/a.jpg',
			name: 'a.jpg',
			tmid: 'threadId',
			description: 'alt text',
			size: 2048,
			type: 'image/jpeg',
			store: 'Uploads',
			msg: 'the caption',
			width: 640,
			height: 480
		});
	});

	it('has a field for every column of the uploads table', () => {
		const columns = appSchema.tables.uploads.columnArray.map(({ name }) => name).filter(name => name !== 'rid');

		const missing = columns.filter(name => !(toCamelCase(name) in Upload.prototype));

		expect(missing).toEqual([]);
	});
});

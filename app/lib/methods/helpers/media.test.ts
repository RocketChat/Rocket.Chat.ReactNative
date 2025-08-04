import { canUploadFile } from './media';

describe('canUploadFile', () => {
	const baseFile = {
		path: '/some/path/image.png',
		size: 1024,
		mime: 'image/png',
		filename: 'test.png'
	};

	it('should allow file upload when allowList has no spaces and MIME is valid', () => {
		const result = canUploadFile({
			file: baseFile,
			allowList: 'image/png,image/jpeg',
			maxFileSize: 2048,
			permissionToUploadFile: true
		});
		expect(result.success).toBe(true);
	});

	it('should allow file upload when allowList contains spaces between MIME types', () => {
		const result = canUploadFile({
			file: baseFile,
			allowList: 'image/png, image/jpeg, image/*',
			maxFileSize: 2048,
			permissionToUploadFile: true
		});
		expect(result.success).toBe(true);
	});

	it('should deny file upload when MIME is not in allowList', () => {
		const result = canUploadFile({
			file: baseFile,
			allowList: 'application/pdf, image/jpeg',
			maxFileSize: 2048,
			permissionToUploadFile: true
		});
		expect(result.success).toBe(false);
		expect(result.error).toBe('error-invalid-file-type');
	});

	it('should allow file upload when wildcard matches MIME type', () => {
		const result = canUploadFile({
			file: baseFile,
			allowList: 'image/*,application/pdf',
			maxFileSize: 2048,
			permissionToUploadFile: true
		});
		expect(result.success).toBe(true);
	});

	it('should deny file upload if file size exceeds maxFileSize', () => {
		const result = canUploadFile({
			file: { ...baseFile, size: 5000 },
			allowList: 'image/png,image/jpeg',
			maxFileSize: 1024,
			permissionToUploadFile: true
		});
		expect(result.success).toBe(false);
		expect(result.error).toBe('error-file-too-large');
	});

	it('should deny file upload if permission is false', () => {
		const result = canUploadFile({
			file: baseFile,
			allowList: 'image/png,image/jpeg',
			maxFileSize: 2048,
			permissionToUploadFile: false
		});
		expect(result.success).toBe(false);
		expect(result.error).toBe('error-not-permission-to-upload-file');
	});

	it('should allow file upload if allowList is "*" (wildcard)', () => {
		const result = canUploadFile({
			file: baseFile,
			allowList: '*',
			maxFileSize: 2048,
			permissionToUploadFile: true
		});
		expect(result.success).toBe(true);
	});
});

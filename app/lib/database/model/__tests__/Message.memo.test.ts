import fs from 'fs';
import path from 'path';

// MessageStore's Object.is/useShallow bail-outs depend on every @json field returning a stable
// reference for an unchanged record. That stability comes only from WatermelonDB's `{ memo: true }`
// decorator option (app/containers/message/stores/MessageStore.tsx:62-67). This is a source
// characterization test: it can't observe the runtime accessor without an LDB mock, so it guards
// the textual invariant instead.
const messageSource = fs.readFileSync(path.join(__dirname, '../Message.js'), 'utf8');

describe('Message.js @json memo invariant', () => {
	const jsonDeclarations = messageSource.match(/@json\([^)]*\)/g) ?? [];

	// Positive control: a regex that matches nothing would let every assertion below pass vacuously.
	it('finds the expected number of @json fields', () => {
		expect(jsonDeclarations.length).toBe(13);
	});

	it('declares { memo: true } on every @json field', () => {
		expect(jsonDeclarations.length).toBeGreaterThan(0);
		jsonDeclarations.forEach(declaration => {
			expect(declaration).toContain('{ memo: true }');
		});
	});
});

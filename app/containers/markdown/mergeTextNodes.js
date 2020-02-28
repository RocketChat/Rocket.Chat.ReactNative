// TODO: should we add this to our commonmark fork instead?
// we loop through nodes and try to merge all texts
export default function mergeTextNodes(ast) {
	// https://github.com/commonmark/commonmark.js/blob/master/lib/node.js#L268
	const walker = ast.walker();
	let event;
	// eslint-disable-next-line no-cond-assign
	while (event = walker.next()) {
		const { entering, node } = event;
		const { type } = node;
		if (entering && type === 'text') {
			while (node._next && node._next.type === 'text') {
				const next = node._next;
				node.literal += next.literal;
				node._next = next._next;
				if (node._next) {
					node._next._prev = node;
				}
				if (node._parent._lastChild === next) {
					node._parent._lastChild = node;
				}
			}
			walker.resumeAt(node, false);
		}
	}
	return ast;
}

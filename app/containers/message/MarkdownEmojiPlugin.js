export default function(md) {
	function tokenize(state, silent) {
		let token;
		const start = state.pos;
		const marker = state.src.charCodeAt(start);

		if (silent) {
			return false;
		}

		// :
		if (marker !== 58) {
			return false;
		}

		const scanned = state.scanDelims(state.pos, true);
		const len = scanned.length;
		const ch = String.fromCharCode(marker);

		for (let i = 0; i < len; i += 1) {
			token = state.push('text', '', 0);
			token.content = ch;

			state.delimiters.push({
				marker,
				jump: i,
				token: state.tokens.length - 1,
				level: state.level,
				end: -1,
				open: scanned.can_open,
				close: scanned.can_close
			});
		}

		state.pos += scanned.length;
		return true;
	}

	function postProcess(state) {
		let startDelim;
		let endDelim;
		let token;
		const { delimiters } = state;
		const max = delimiters.length;

		for (let i = 0; i < max; i += 1) {
			startDelim = delimiters[i];

			// :
			if (startDelim.marker !== 58) {
				continue; // eslint-disable-line
			}

			if (startDelim.end === -1) {
				continue; // eslint-disable-line
			}

			endDelim = delimiters[startDelim.end];

			token = state.tokens[startDelim.token];
			token.type = 'emoji_open';
			token.tag = 'emoji';
			token.nesting = 1;
			token.markup = ':';
			token.content = '';

			token = state.tokens[endDelim.token];
			token.type = 'emoji_close';
			token.tag = 'emoji';
			token.nesting = -1;
			token.markup = ':';
			token.content = '';
		}
	}

	md.inline.ruler.before('emphasis', 'emoji', tokenize);
	md.inline.ruler2.before('emphasis', 'emoji', postProcess);
}

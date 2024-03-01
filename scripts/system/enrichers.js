export class Enrichers {
	static register() {
		Enrichers.#enrichTags();
	}

	static #enrichTags() {
		const enrichTags = ([_text, tag, status]) => {
			if (tag && status)
				return $(`<mark class="litm--status">${tag}-${status}</mark>`)[0];
			return $(`<mark class="litm--tag">${tag}</mark>`)[0];
		};
		CONFIG.TextEditor.enrichers.push({
			pattern: CONFIG.litm.tagStringRe,
			enricher: enrichTags,
		});
	}
}

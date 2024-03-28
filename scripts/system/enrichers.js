export class Enrichers {
	static register() {
		Enrichers.#enrichSceneLinks();
		// Note that this one has to go last for now
		Enrichers.#enrichTags();
	}

	static #enrichSceneLinks() {
		const enrichSceneLinks = ([text, sceneId, flavour]) => {
			const id = sceneId.replace(/^Scene./, "");

			const scene = game.scenes.get(id) || game.scenes.getName(id);
			if (!scene) return text;

			const link = $(
				`<a class="content-link" draggable="true" data-uuid="Scene.${
					scene._id
				}" data-id="${
					scene._id
				}" data-type="ActivateScene" data-tooltip="Scene"><i class="far fa-map"></i>${
					flavour || scene.navName
				}</a>`,
			);
			return link[0];
		};
		CONFIG.TextEditor.enrichers.push({
			pattern: CONFIG.litm.sceneLinkRe,
			enricher: enrichSceneLinks,
		});
	}

	static #enrichTags() {
		const enrichTags = ([_text, tag, status]) => {
			if (tag.startsWith("-"))
				return $(
					`<mark class="litm--limit">${tag.replace(/^-/, "")}${
						status ? `:${status}` : ""
					}</mark>`,
				)[0];
			if (tag && status)
				return $(
					`<mark class="litm--status" draggable="true">${tag}-${status}</mark>`,
				)[0];
			return $(`<mark class="litm--tag" draggable="true">${tag}</mark>`)[0];
		};
		CONFIG.TextEditor.enrichers.push({
			pattern: CONFIG.litm.tagStringRe,
			enricher: enrichTags,
		});
	}
}

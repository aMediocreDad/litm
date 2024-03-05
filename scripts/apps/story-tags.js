export class StoryTagApp extends FormApplication {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["litm", "litm--story-tags"],
			template: "systems/litm/templates/apps/story-tags.html",
			width: 500,
			height: 600,
			resizable: true,
			dragDrop: [{ dropSelector: ".actors" }],
		});
	}

	async getData() {
		const config = game.settings.get("litm", "storytags");
		if (isEmpty(config)) return
		const actors = config.actors?.map((id) => game.actors.get(id));

		return {
			tags: game.settings.get("litm", "storytags"),
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

	}

	async _updateObject(event, formData) {
		debugger;
		await game.settings.set("litm", "storytags", formData);
	}

	#createTags(string) {
		const tags = CONFIG.litm.tagStringRe.exec(string);
		if (!tag) return null;
		debugger;
	}

	#renderTags(tags) {
		return tags.map((tag) => {
			return `[${tag}]`
		})
	}

	_onDrop(...event) {

		debugger;
	}

	_canDragDrop(...args) {
		debugger;
		return true;
	}
}

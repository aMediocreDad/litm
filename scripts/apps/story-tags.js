export class StoryTagApp extends FormApplication {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["litm", "litm--story-tags"],
			template: "systems/litm/templates/apps/story-tags.html",
			width: 500,
			height: 600,
			resizable: true,

		});
	}

	async getData() {
		return {
			tags: game.settings.get("litm", "storytags"),
		};
	}

	async _updateObject(event, formData) {
		await game.settings.set("litm", "storytags", formData);
	}
}

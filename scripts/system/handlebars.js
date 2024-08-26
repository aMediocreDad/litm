import { info } from "../logger.js";

export class HandlebarsHelpers {
	static register() {
		info("Registering Handlebars Helpers...");

		Handlebars.registerHelper("add", (...args) => {
			args.pop();
			return args.reduce((acc, val) => acc + val, 0);
		});

		Handlebars.registerHelper("includes", (array, value, path) =>
			Array.isArray(array)
				? (path && array.some((i) => i[path] === value)) ||
					array.includes(value)
				: false,
		);

		Handlebars.registerHelper(
			"progress-buttons",
			function (current, max, block) {
				let acc = "";
				for (let i = 0; i < max; ++i) {
					block.data.index = i;
					block.data.checked = i < current;
					acc += block.fn(this);
				}
				return acc;
			},
		);

		Handlebars.registerHelper(
			"titlecase",
			(string) => string.charAt(0).toUpperCase() + string.slice(1),
		);

		Handlebars.registerHelper("tagActiveString", (tag, readonly) =>
			tag.isActive
				? "Litm.tags.isActive"
				: readonly
					? "Litm.tags.isInactive"
					: "Litm.tags.activate",
		);
	}
}

export class HandlebarsPartials {
	static partials = [
		"systems/litm/templates/apps/loot-dialog.html",
		"systems/litm/templates/apps/roll-dialog.html",
		"systems/litm/templates/apps/story-tags.html",
		"systems/litm/templates/chat/message.html",
		"systems/litm/templates/chat/message-tooltip.html",
		"systems/litm/templates/chat/moderation.html",
		"systems/litm/templates/item/backpack-ro.html",
		"systems/litm/templates/item/theme-ro.html",
		"systems/litm/templates/partials/new-tag.html",
		"systems/litm/templates/partials/tag.html",
	];

	static register() {
		info("Registering Handlebars Partials...");
		loadTemplates(HandlebarsPartials.partials);
	}
}

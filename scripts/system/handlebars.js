export class HandlebarsHelpers {
	static register() {
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
	}
}

export class HandlebarsPartials {
	static partials = [
		"systems/litm/templates/apps/roll.html",
		"systems/litm/templates/chat/roll.html",
		"systems/litm/templates/chat/roll-tooltip.html",
		"systems/litm/templates/item/theme-ro.html",
		"systems/litm/templates/partials/tag.html",
	];

	static register() {
		loadTemplates(HandlebarsPartials.partials);
	}
}

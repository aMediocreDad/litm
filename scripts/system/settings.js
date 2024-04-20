export class LitmSettings {
	static register() {
		game.settings.register("litm", "storytags", {
			name: "Story Tags",
			hint: "Tags that are shared between all users.",
			scope: "world",
			config: false,
			type: Object,
			default: {
				tags: [],
				actors: [],
			},
		});
		game.settings.register("litm", "show_tag_window_on_load", {
			name: "Litm.ui.show-tag-window-on-load",
			hint: "Litm.ui.show-tag-window-on-load-hint",
			scope: "client",
			config: true,
			type: Boolean,
			default: true,
		});
		game.settings.register("litm", "skip_roll_moderation", {
			name: "Litm.settings.skip-roll-moderation",
			hint: "Litm.settings.skip-roll-moderation-hint",
			scope: "client",
			config: true,
			type: Boolean,
			default: false,
		});
	}
}

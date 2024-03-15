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
			scope: "world",
			config: true,
			type: Boolean,
			default: game.user?.isGM ?? true,
		});
	}
}

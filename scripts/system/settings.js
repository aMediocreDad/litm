export class LitmSettings {
	static register() {
		game.settings.register("litm", "storytags", {
			name: "Story Tags",
			hint: "Tags that are shared between all users.",
			scope: "world",
			config: false,
			type: Object,
			default: {},
		});
	}
}

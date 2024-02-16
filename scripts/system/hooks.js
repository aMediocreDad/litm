function t(string) {
	return game.i18n.localize(string);
}

export class LitmHooks {
	static register() {
		LitmHooks.#iconOnlyHeaderButtons();
	}

	static #iconOnlyHeaderButtons() {
		for (const hook of [
			"renderItemSheet",
			"renderActorSheet",
			"renderJournalSheet",
			"renderApplication",
		]) {
			Hooks.on(hook, (_app, html) => {
				html
					.find(".configure-sheet")
					?.html(
						`<i class="fas fa-cog aria-label="${t("Configure")}" data-tooltip=${t("Configure")}"></i>`,
					);
				html
					.find(".configure-token")
					?.html(
						`<i class="fas fa-user-circle" aria-label="${t("TOKEN.Title")}" data-tooltip="${t("TOKEN.Title")}"></i>`,
					);
				html
					.find(".share-image")
					?.html(
						`<i class="fas fa-eye" aria-label="${t("JOURNAL.ActionShow")}" data-tooltip="${t("JOURNAL.ActionShow")}"></i>`,
					);
				html
					.find(".close")
					?.html(
						`<i class="fas fa-times" aria-label="${t("Close")}" data-tooltip="${t("Close")}"></i>`,
					);
				if (hook === "renderActorSheet")
					html.find(".document-id-link").prependTo(".window-header")
			});
		}
	}
}

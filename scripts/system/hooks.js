function t(string) {
	return game.i18n.localize(string);
}

export class LitmHooks {
	static register() {
		LitmHooks.#addImportToActorSidebar();
		LitmHooks.#iconOnlyHeaderButtons();
		LitmHooks.#safeUpdateActorSheet();
		LitmHooks.#safeUpdateItemSheet();
		LitmHooks.#replaceLoadSpinner();
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
						`<i class="fas fa-cog aria-label="${t(
							"Configure",
						)}" data-tooltip=${t("Configure")}"></i>`,
					);
				html
					.find(".configure-token")
					?.html(
						`<i class="fas fa-user-circle" aria-label="${t(
							"TOKEN.Title",
						)}" data-tooltip="${t("TOKEN.Title")}"></i>`,
					);
				html
					.find(".share-image")
					?.html(
						`<i class="fas fa-eye" aria-label="${t(
							"JOURNAL.ActionShow",
						)}" data-tooltip="${t("JOURNAL.ActionShow")}"></i>`,
					);
				html
					.find(".close")
					?.html(
						`<i class="fas fa-times" aria-label="${t(
							"Close",
						)}" data-tooltip="${t("Close")}"></i>`,
					);

				// Add the document ID link to the header if it's not already there
				if (hook === "renderActorSheet" || hook === "renderItemSheet") {
					html
						.find(".window-title>.document-id-link")
						.prependTo(html.find(".window-header"));
				}
			});
		}
	}

	static #safeUpdateActorSheet() {
		Hooks.on("preUpdateActor", (_, data) => {
			const { schema: tagSchema } = game.litm.data.TagData;
			const { system = {} } = data;
			if (!("backpack" in system) || !system.backpack.length) return;

			const { backpack } = system;
			const validationErrors = backpack
				.map((item) => tagSchema.validate(item, { strict: true, partial: false }))
				.filter(Boolean);

			if (validationErrors.length) {
				ui.notifications.error("Litm.ui.error-validating-actor", {
					localize: true,
				});
				return false;
			}
		});
	}

	static #safeUpdateItemSheet() {
		Hooks.on("preUpdateItem", (_, data) => {
			const { schema: tagSchema } = game.litm.data.TagData;
			const { system = {} } = data;
			if (!("powerTags" in system) || !("weaknessTags" in system)) return;

			const { powerTags = [], weaknessTags = [] } = system;
			const validationErrors = [...powerTags, ...weaknessTags]
				.map((item) => tagSchema.validate(item, { strict: true, partial: false }))
				.filter(Boolean);

			if (validationErrors.length) {
				ui.notifications.error("Litm.ui.error-validating-item", {
					localize: true,
				});
				return false;
			}
		});
	}

	static #addImportToActorSidebar() {
		Hooks.on("renderSidebarTab", (app, html) => {
			if (app.id !== "actors") return;
			const button = $(`<button class="litm--import-actor" data-tooltip="${t(
				"Litm.ui.import-actor",
			)}" aria-label="${t(
				"Litm.ui.import-actor",
			)}"><i class="fas fa-file-import"></i></button>`);
			button.on("click", () => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".json";
				input.onchange = async (event) => {
					const file = event.target.files[0];
					const data = await file.text();
					const actorData = JSON.parse(data);
					await game.litm.importCharacter(actorData);
				};
				input.click();
			});
			html.find(".directory-footer").append(button);
		});
	}

	static #replaceLoadSpinner() {
		Hooks.on("renderPause", (_, html) => {
			html.find("img").attr("src", "systems/litm/assets/media/disk.webp").css({
				opacity: 0.3,
			})
		});
	}
}

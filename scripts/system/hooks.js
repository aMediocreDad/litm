import { info } from "../logger.js";
import { sleep, localize as t } from "../utils.js";

export class LitmHooks {
	static register() {
		info("Registering Hooks...");
		LitmHooks.#addRollButtonAbovePlayerConfig();
		LitmHooks.#addImportToActorSidebar();
		LitmHooks.#iconOnlyHeaderButtons();
		LitmHooks.#safeUpdateActorSheet();
		LitmHooks.#safeUpdateItemSheet();
		LitmHooks.#replaceLoadSpinner();
		LitmHooks.#renderChallengeCardFixes();
		LitmHooks.#rendeWelcomeScreen();
	}

	static #iconOnlyHeaderButtons() {
		const constructHeaderButton = (icon, label, action) =>
			`<a class="header-button control ${action}" aria-label="${label}" data-tooltip="${label}">
				<i class="${icon}"></i>
			</a>`;

		for (const hook of [
			"renderItemSheet",
			"renderActorSheet",
			"renderJournalSheet",
			"renderApplication",
		]) {
			Hooks.on(hook, (_app, html) => {
				html
					.find(".configure-sheet")
					?.replaceWith(
						constructHeaderButton(
							"fas fa-cog",
							t("Configure"),
							"configure-sheet",
						),
					);
				html
					.find(".configure-token")
					?.replaceWith(
						constructHeaderButton(
							"fas fa-user-circle",
							t("TOKEN.Title"),
							"configure-token",
						),
					);
				html
					.find(".share-image")
					?.replaceWith(
						constructHeaderButton(
							"fas fa-eye",
							t("JOURNAL.ActionShow"),
							"share-image",
						),
					);
				html
					.find(".close")
					?.replaceWith(
						constructHeaderButton("fas fa-times", t("Close"), "close"),
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
				.map((item) =>
					tagSchema.validate(item, { strict: true, partial: false }),
				)
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
				.map((item) =>
					tagSchema.validate(item, { strict: true, partial: false }),
				)
				.filter(Boolean);

			if (validationErrors.length) {
				ui.notifications.error("Litm.ui.error-validating-item", {
					localize: true,
				});
				return false;
			}
		});
	}

	static #addRollButtonAbovePlayerConfig() {
		const app = $(`
		<button id="litm--roll-button" aria-label="${t(
			"Litm.ui.roll-title",
		)}" data-tooltip="${t("Litm.ui.roll-title")}">
			<img src="systems/litm/assets/media/dice.webp" alt="Two Acorns" />
		</button>`).click(() => {
			if (!game.user.character)
				return ui.notifications.warn(t("Litm.ui.warn-no-character"));
			const actor = game.user.character;
			game.litm.LitmRollDialog.create(
				actor._id,
				actor.system.availablePowerTags,
				actor.system.weaknessTags,
			);
		});
		$("#players").before(app);
	}

	static #addImportToActorSidebar() {
		Hooks.on("renderSidebarTab", (app, html) => {
			if (app.id !== "actors") return;
			const button = $(
				`<button class="litm--import-actor" data-tooltip="${t(
					"Litm.ui.import-actor",
				)}" aria-label="${t(
					"Litm.ui.import-actor",
				)}"><i class="fas fa-file-import"></i></button>`,
			);
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
			});
		});
	}

	static #renderChallengeCardFixes() {
		Hooks.on("renderActorSheet", (app, html) => {
			if (!app.actor || app.actor.type !== "challenge") return;

			// Fix the height of the challenge sheet
			app._element[0].style.height = "auto";

			// Replace default image
			const img = html.find("img");
			if (img.attr("src") === "icons/svg/mystery-man.svg")
				img.attr("src", "systems/litm/assets/media/challenge-placeholder.webp");

			// Add a context menu to the avatar
			html.find("form").contextmenu(async (event) => {
				event.preventDefault();
				const name = await Dialog.prompt({
					title: t("Litm.ui.rename-challenge"),
					content: `
						<div class="litm--rename-dialog">
							<label for="name">${t("Name")}</label>
							<input type="text" id="name" value="${app.actor.name}" required>
						</div>
					`,
					label: t("Litm.ui.rename"),
					callback: (html) => html.find("input").val(),
					options: { width: 200 },
				});
				if (!name) return;
				app.actor.update({ name });
			});
		});
	}

	static #rendeWelcomeScreen() {
		Hooks.once("ready", async () => {
			let scene = game.scenes.getName("Legend in the Mist");
			if (scene) return;

			ui.sidebar.activateTab("actors");

			scene = await Scene.create({
				name: "Legend in the Mist",
				permission: { default: 2 },
				navigation: true,
				background: {
					src: "systems/litm/assets/media/litm_splash.webp",
				},
				width: 1920,
				height: 1080,
				initial: {
					x: 1660,
					y: 840,
					scale: 0.6,
				},
				backgroundColor: "#000000",
				grid: {
					type: 0,
				},
				tokenVision: false,
				fogExploration: false,
				globalLight: false,
			});

			const { thumb } = await scene.createThumbnail();
			await scene.update({ thumb });
			scene.activate();

			const entry = await JournalEntry.create({
				name: "Welcome to Legend in the Mist!",
				permission: { default: 2 },
				content: `
					<h1>Welcome to Legend in the Mist!</h1>
					<p>
						Thank you for choosing Legend in the Mist! This system is designed to provide a simple and flexible way to play your favorite tabletop roleplaying game.
					</p>
					<p>
						To get started, create a new character by clicking the "Create Character" button in the sidebar. Once you have a character, you can create new challenges and themes to use in your game.
					</p>
					<p>
						To learn more about how to use Legend in the Mist, check out the documentation by clicking the "Documentation" button in the sidebar.
					</p>
				`,
			});

			await sleep(300);
			entry.sheet.render(true, {
				collapsed: true,
				width: 600,
				height: 600,
			});
		});
	}
}

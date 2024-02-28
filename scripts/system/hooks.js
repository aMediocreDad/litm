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
		LitmHooks.#prepareCharacterOnCreate();
		LitmHooks.#prepareThemeOnCreate();
		LitmHooks.#rendeWelcomeScreen();
	}

	static #iconOnlyHeaderButtons() {
		// Abstracted function to replace header buttons
		const replaceHeaderButton = (html, action, icon, label) =>
			html.find(`.${action}`)?.replaceWith(`
				<a class="header-button control ${action}" aria-label="${label}" data-tooltip="${label}">
				<i class="${icon}"></i></a>
				`);

		const buttons = [
			{ action: "configure-sheet", icon: "fas fa-cog", label: t("Configure") },
			{
				action: "configure-token",
				icon: "fas fa-user-circle",
				label: t("TOKEN.Title"),
			},
			{
				action: "share-image",
				icon: "fas fa-eye",
				label: t("JOURNAL.ActionShow"),
			},
			{ action: "close", icon: "fas fa-times", label: t("Close") },
		];

		for (const hook of [
			"renderItemSheet",
			"renderActorSheet",
			"renderJournalSheet",
			"renderApplication",
		]) {
			Hooks.on(hook, (_app, html) => {
				for (const { action, icon, label } of buttons)
					replaceHeaderButton(html, action, icon, label);

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

	static #prepareCharacterOnCreate() {
		Hooks.on("preCreateActor", (actor, data) => {
			if (data.type !== "character") return;

			const prototypeToken = {
				sight: { enabled: true },
				actorLink: true,
				disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
				texture: { src: "/icons/svg/target.svg" },
			};
			const img = "icons/svg/target.svg";
			actor.updateSource({ prototypeToken, img });
		});

		Hooks.on("createActor", async (actor) => {
			if (actor.type !== "character") return;

			for (const item of Array(4).fill()) {
				console.log("Creating theme", item)
				await actor.createEmbeddedDocuments("Item", [
					{
						name: "New Theme",
						type: "theme",
					},
				]);
			}
		});
	}

	static #prepareThemeOnCreate() {
		Hooks.on("preCreateItem", (item, data) => {
			if (data.type !== "theme") return;

			const img = "systems/litm/assets/media/note.webp";
			const powerTags = Array(5)
				.fill()
				.map((_, i) => ({
					name: "Name your tag",
					type: "powerTag",
					isActive: i < 2,
					isBurnt: false,
					id: randomID(),
				}));
			const weaknessTags = [
				{
					name: "Name your Weakness",
					type: "weaknessTag",
					isActive: true,
					isBurnt: false,
					id: randomID(),
				}
			];
			item.updateSource({ img, system: { powerTags, weaknessTags } });
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

			const entry = await JournalEntry.create({
				name: "Legend in the Mist",
				permission: { default: 2 },
				content: `
					<h1 style="text-align:center"><span style="font-family: PackardAntique">Welcome!</span></h1>
					<p></p>
					<p style="text-align: center"><span style="font-family: AlchemyItalic"><em><strong>I am thrilled to have you try out
													this system!</strong></em></span></p>
					<blockquote style="padding:0.5em 10px;background:var(--litm-color-primary-bg);color:var(--litm-color-weakness)">
							<p><span style="font-family: CaslonAntique"><strong>Please be aware that both the system—and game—is under heavy
													development. And that there might be breaking bugs or major changes down the road.</strong></span></p>
							<p><br><span style="font-family: PackardAntique">PLEASE MAKE FREQUENT BACKUPS</span></p>
					</blockquote>
					<p></p>
					<h2>What to expect</h2>
					<p>At the moment only <strong>Themes</strong> and <strong>Characters</strong> are implemented, there is also a
							rudimentary sheet that you can use to display the <strong>Challenge</strong> illustrations found in the <a
									href="https://drive.google.com/drive/folders/1jS1dO4rz2uLxOZfdsShOTLjzsJeJqJ6H"
									title="Legend in the Mist demo playkit">Tinderbox Demo</a>.</p>
					<p></p>
					<h3>To-be implemented</h3>
					<p>The system is under active development and you can expect frequent updates as the year progresses. Following is a
							list of coming feature improvements in no particular order:</p>
					<ul>
							<li>
									<p><strong>Situational Tags & Statuses: </strong>Tags and Statuses not part of a backpack or theme will likely
											be implemented as Active Effects with their own interface and tracking.</p>
							</li>
							<li>
									<p><strong>Challenges:</strong> The current <strong>Challenge</strong> actors will be replaced with a full sheet
											of the same style as their printed counterparts.</p>
							</li>
							<li>
									<p><strong>Threats & Consequences:</strong> To go with <strong>Challenges</strong>, <strong>Threats &
													Consequences</strong> will be implemented as items that can be premade and dragged onto a
											<strong>Challenge</strong> actor.</p>
							</li>
							<li>
									<p><strong>Backpacks:</strong> At the moment the backpack is hardcoded into the actor data. In the future
											Backpacks will become their own items which can be moved between players, and added from premade backpacks
											in the Item sidebar.</p>
							</li>
							<li>
									<p><strong>Crew Theme </strong>and<strong> Theme Improvements:</strong> The Crew theme and theme improvements
											are yet to be revealed by <a href="https://cityofmist.co/blogs/news/son-of-oaks-new-game-engine">Son of
													Oak</a>. When the details on these are released work will commence on implementing them in the system.
									</p>
							</li>
					</ul>
					<h2>How play</h2>
					<p>Beyond the <em>Tinderbox demo</em> linked above, there are few ins-and-outs of the system, yet. Some interactions to
							be aware of:</p>
					<ul>
							<li>
									<p><span style="font-family: Modesto Condensed"><strong>Right-clicking</strong></span> a <strong>Tag </strong>in
											the <strong>Backpack</strong> will prompt you for deleting the tag. The same goes for
											<strong>Themes</strong> in a <strong>Character</strong>-sheet. <strong>Right-clicking </strong>a tag in the
											<strong>Backpack</strong>, will delete it.</p>
							</li>
							<li>
									<p>If your <strong>Character</strong><em><strong> </strong></em>is missing <strong>Theme</strong>s you can
											create an empty one in the <em>Item Sidebar</em> <em>(or ask the one with GM permissions to do it)</em>, and
											<span style="font-family: Modesto Condensed"><strong>drag</strong></span> it onto the sheet.</p>
							</li>
							<li>
									<p><strong>Theme</strong>s can be <span
													style="font-family: Modesto Condensed"><strong>rearranged</strong></span> on a sheet.
											<strong>Tag</strong>s in the <strong>Backpack</strong> and on <strong>Theme</strong>s cannot.</p>
							</li>
							<li>
									<p><span style="font-family: Modesto Condensed"><strong>Double-clicking </strong></span>a <strong>Theme</strong>
											on the <strong>Character</strong>-sheet will open the <strong>Theme</strong>'s sheet allowing you to make
											edits to it that you are not able to directly from the <strong>Character</strong>-sheet.</p>
							</li>
							<li>
									<p><span style="font-family: Modesto Condensed"><strong>Right-clicking</strong></span> a
											<strong>Challenge</strong>-sheet will pop open a small dialog that lets you change the name.</p>
							</li>
							<li>
									<p>If you see a title, it may be editable. This goes for the title on the
											<strong>Character</strong>-sheet<strong>, Theme</strong>-sheet, and <strong>Roll</strong>-dialog.</p>
							</li>
					</ul>
				`,
			});

			ChatMessage.create({
				title: "Welcome to Legend in the Mist",
				content: `
				<p><strong>Welcome to Legend in the Mist</strong></p>
				<p>Before you start playing, you might want to read the <a class="content-link" draggable="true" data-uuid="JournalEntry.QVA4cPjUWlDPMR8F.JournalEntryPage.5AWCygW0BCFdk4sd" data-id="5AWCygW0BCFdk4sd" data-type="JournalEntryPage" data-tooltip="Text Page"><i class="fas fa-file-lines"></i>Legend in the Mist</a> journal entry. It contains some important information about the system and what to expect.</p>
				<p>Good luck and have fun!</p>
			`,
			});

			await sleep(300);
			await scene.activate();
			await sleep(300);
			entry.sheet.render(true, {
				collapsed: true,
				width: 600,
				height: 600,
			});
		});
	}
}

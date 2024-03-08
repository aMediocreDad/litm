import { info } from "../logger.js";
import { sleep, localize as t } from "../utils.js";

export class LitmHooks {
	static register() {
		info("Registering Hooks...");
		LitmHooks.#addImportToActorSidebar();
		LitmHooks.#iconOnlyHeaderButtons();
		LitmHooks.#safeUpdateActorSheet();
		LitmHooks.#safeUpdateItemSheet();
		LitmHooks.#replaceLoadSpinner();
		LitmHooks.#attachContextMenuToRollMessage();
		LitmHooks.#prepareCharacterOnCreate();
		LitmHooks.#prepareThemeOnCreate();
		LitmHooks.#listenToContentLinks();
		LitmHooks.#customizeDiceSoNice();
		LitmHooks.#renderStoryTagApp();
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
					html.find(".window-title>.document-id-link").prependTo(html.find(".window-header"));
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
			const button = $(
				`<button class="litm--import-actor" data-tooltip="${t(
					"Litm.ui.import-actor"
				)}" aria-label="${t("Litm.ui.import-actor")}"><i class="fas fa-file-import"></i></button>`
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

	static #attachContextMenuToRollMessage() {
		Hooks.on("getChatLogEntryContext", (_, options) => {
			const { discover, extra_feat } = CONFIG.litm.additionalEffects;
			const isEffectRoll = (li) => li.find(".dice-effect").length;
			options.unshift(
				{
					name: `${t("Litm.effects.category-other")}: ${t("Litm.additionalEffects.discover.key")}`,
					icon: '<i class="fas fa-magnifying-glass"></i>',
					condition: isEffectRoll,
					callback: () => {
						ChatMessage.create({
							content: `<div class="litm dice-roll">
							<div class="dice-flavor">${t("Litm.additionalEffects.discover.key")}</div>
							<div class="dice-effect">
								<p><em>${t(discover.description)}</em></p>
								<p>${t(discover.action)}</p>
								<p><strong>${t("Litm.other.cost")}:</strong> ${t(discover.cost)}</p>
							</div>
					</div>
						`,
						});
					},
				},
				{
					name: `${t("Litm.effects.category-other")}: ${t(
						"Litm.additionalEffects.extra_feat.key"
					)}`,
					icon: '<i class="fas fa-plus"></i>',
					condition: isEffectRoll,
					callback: () => {
						ChatMessage.create({
							content: `
						<div class="litm dice-roll">
							<div class="dice-flavor">${t("Litm.additionalEffects.extra_feat.key")}</div>
							<div class="dice-effect">
								<p><em>${t(extra_feat.description)}</em></p>
								<p><strong>${t("Litm.other.cost")}:</strong> ${t(extra_feat.cost)}</p>
							</div>
						</div>
						`,
						});
					},
				}
			);
		});
	}

	static #prepareCharacterOnCreate() {
		Hooks.on("preCreateActor", (actor, data) => {
			if (data.type !== "character") return;

			const prototypeToken = {
				sight: { enabled: true },
				actorLink: true,
				disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
			};
			actor.updateSource({ prototypeToken });
		});

		Hooks.on("createActor", async (actor) => {
			if (actor.type !== "character") return;

			const missingThemes = 4 - actor.items.filter((it) => it.type === "theme").length;

			await Promise.all(
				Array(missingThemes)
					.fill()
					.map(async (_, i) => {
						await actor.createEmbeddedDocuments("Item", [
							{
								name: `${t("TYPES.Item.theme")} ${i + 1}`,
								type: "theme",
							},
						]);
					})
			);
		});
	}

	static #prepareThemeOnCreate() {
		Hooks.on("preCreateItem", (item, data) => {
			if (data.type !== "theme") return;

			const img = "systems/litm/assets/media/note.webp";
			item.updateSource({ img });
		});
	}

	static #renderStoryTagApp() {
		const app = new game.litm.StoryTagApp();
		game.litm.storyTags = app;

		Hooks.once("renderSidebar", async (_app, html) => {
			const container = $(`<div class="litm--sidebar-buttons-container"></div>`);

			const rollButton = $(`
		<button aria-label="${t("Litm.ui.roll-title")}" data-tooltip="${t("Litm.ui.roll-title")}">
			<i class="fas fa-dice"></i>
		</button>`).on("click", () => {
				if (!game.user.character) return ui.notifications.warn(t("Litm.ui.warn-no-character"));
				const actor = game.user.character;
				game.litm.LitmRollDialog.create(
					actor._id,
					actor.system.availablePowerTags,
					actor.system.weaknessTags
				);
			});

			const storyTagsButton = $(`
			<button type="button" data-tooltip="${t("Litm.tags.story", "Litm.other.tags")}" aria-label="${t(
				"Litm.tags.story",
				"Litm.other.tags"
			)}">
			<i class="fas fa-tags"></i>
			</button>`).on("click", () => {
				if (!app.rendered) {
					app.render(true);
					setTimeout(() => container.addClass("active"));
				}
				app.element.toggle(130, () => container.toggleClass("active", app.element.is(":visible")));
			});

			app.render(true);
			setTimeout(() => container.addClass("active"));

			container.append(storyTagsButton, rollButton);
			html.before(container);
		});
	}

	static #listenToContentLinks() {
		Hooks.on("renderJournalSheet", (_app, html) => {
			html.on("click", ".content-link", (event) => {
				const { id, type } = event.currentTarget.dataset;
				if (type !== "ActivateScene") return;

				event.preventDefault();
				event.stopPropagation();

				const scene = game.scenes.get(id);
				if (!scene) return;
				scene.view();
			});
		});
	}

	static #customizeDiceSoNice() {
		Hooks.on("diceSoNiceReady", (dice3d) => {
			dice3d.addSystem({ id: "litm", name: "Legend in the Mist" }, "preferred");
			dice3d.addDicePreset(
				{
					type: "d6",
					labels: ["1", "2", "3", "4", "5", "6", "1", "2", "3", "4", "5", "6"],
					font: "LitM Dice",
					system: "litm",
				},
				"d12"
			);

			dice3d.addColorset(
				{
					name: "litm",
					description: "Legend in the Mist Default",
					category: "Legend in the Mist",
					foreground: ["#433a28", "#c9c9c9", "#433a28", "#433a28"],
					background: ["#708768", "#446674", "#A8A7A3", "#ac9e77"],
					outline: [undefined, "#433a28", undefined, undefined],
					texture: "stone",
					material: "stone",
					font: "Georgia",
					visibility: "visible",
				},
				"preferred"
			);
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
					x: 1669,
					y: 853,
					scale: 0.7,
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
				content: /*html */ `
				<h1 style="text-align:center"><span style="font-family: PackardAntique">Welcome!</span></h1>
				<p style="text-align: center"><em>I am thrilled to have you try out this system</em></p>
				<p></p>
				<blockquote style="padding:0.5em 10px;background:var(--litm-color-primary-bg);color:var(--litm-color-weakness)">
						<p><em><strong>P</strong>lease be aware that both the system—and game—is under heavy development. And that there might be breaking bugs or major changes down the road.</em></p>
						<p><em><strong><br>PLEASE MAKE FREQUENT BACKUPS</strong></em></p>
				</blockquote>
				<p></p>
				<h2>What to expect</h2>
				<p>At the moment <strong>Themes</strong>, <strong>Threats</strong>,<strong> Challenges</strong> and <strong>Characters</strong> are implemented. These are all the things you need to play the Tinderbox demo <a href="https://drive.google.com/drive/folders/1jS1dO4rz2uLxOZfdsShOTLjzsJeJqJ6H" title="Legend in the Mist demo playkit">Tinderbox Demo</a>. <strong>Story Tags & Statuses</strong> need to be tracked manually, using something like <a href="https://foundryvtt.com/packages/ffs">Freeform Sheets</a>. A future update will add support.</p>
				<h3>To-be implemented</h3>
				<p>The system is under active development and you can expect frequent updates as the year progresses. Following is a list of coming feature improvements in no particular order:</p>
				<ul>
						<li>
								<p><strong>Backpacks:</strong> At the moment the backpack is hardcoded into the actor data. In the future Backpacks will become their own items which can be moved between players, and added from pre-made backpacks in the Item sidebar.</p>
						</li>
						<li>
								<p><strong>Improved Dice Rolling Experience:</strong> The idea is to allow the players to select tags they want to roll with directly from the character sheet. The roll dialog will also be improved.</p>
						</li>
						<li>
								<p><strong>Improved handling of Statuses/Tags:</strong> Many small improvements to the tag/status systems, like dragging an actor onto the canvas, or hiding select actors/tags/statuses until relevant, or allowing players greater freedom in creating, editing and removing tags.</p>
						</li>
						<li>
								<p><strong>Crew Theme </strong>and<strong> Theme Improvements:</strong> The Crew theme and theme improvements are yet to be revealed by <a href="https://cityofmist.co/blogs/news/son-of-oaks-new-game-engine">Son of Oak</a>. When the details on these are released work will commence on implementing them in the system.</p>
						</li>
				</ul>
				<h2>How play</h2>
				<p>Beyond the <em>Tinderbox demo</em> linked above, there are few ins-and-outs of the system, yet. Some interactions to be aware of:</p>
				<ul>
						<li>
								<p><span style="font-family: Modesto Condensed"><strong>Right-clicking</strong></span> in general will prompt you to delete whatever you are right clicking. This includes (<strong>Themes</strong>, <strong>Consequences</strong>, <strong>Threats</strong>, <strong>Tags</strong> in <strong>Backpack</strong>).</p>
						</li>
						<li>
								<p><span style="font-family: Modesto Condensed"><strong>Double-clicking </strong></span>in general means you will open the item sheet, there are currently two item types that support this (<strong>Themes</strong> and <strong>Threats</strong>), in the future the <strong>Backpack</strong> will also become an item.</p>
						</li>
						<li>
								<p><strong>Tags</strong> can be written as <code>[tag]</code> <code>[status-4]</code> and <code>[-limit:4]</code>, and are recognized and highlighted in <strong>Journal Entries</strong>, and <strong>Textareas</strong> on <strong>Sheets</strong>.</p>
						</li>
						<li>
								<p>If your <strong>Character</strong><em><strong> </strong></em>is missing <strong>Themes</strong> you can create an empty one in the <em>Item Sidebar</em> <em>(or ask the one with GM permissions to do it)</em>, and <span style="font-family: Modesto Condensed"><strong>drag</strong></span> it onto the sheet.</p>
						</li>
						<li>
								<p><strong>Themes</strong> can also be <span style="font-family: Modesto Condensed"><strong>rearranged</strong></span> on a sheet. <strong>Tags</strong> in the <strong>Backpack</strong> and on <strong>Themes</strong> cannot.</p>
						</li>
						<li>
								<p>If you see a title, it may be <span style="font-family: Modesto Condensed"><strong>editable</strong></span>. This goes for the title on the <strong>Character</strong>-sheet<strong>, Theme</strong>-sheet, and <strong>Roll</strong>-dialog.</p>
						</li>
						<li>
								<p><span style="font-family: Modesto Condensed"><strong>Right-clicking</strong></span> the <em>Chat Card</em> of an <strong>Effect roll</strong> opens a context menu that lets you post extra effects to chat for reference.</p>
						</li>
				</ul>
				<h2>Special Thanks</h2>
				<p>This project already has some contributors, help and good vibes!</p>
				<ul>
						<li>
								<p>Thanks to <strong>@Daegony</strong> <em>(Discord)</em> / <strong>@Roapon</strong> <em>(Github)</em> for contributing graphics, designs, UX advice and help with rules and the game in general.</p>
						</li>
						<li>
								<p>Thanks to <strong>@CussaMitre</strong> for contributing code and squashing bugs.</p>
						</li>
						<li>
								<p>Thanks to <strong>@Metamancer</strong> for being a rubber duck, and giving advice on both the game and development.</p>
						</li>
						<li>
								<p>Thanks to <strong>@Altervayne </strong>for creating the online character creator and setting up a Discord community for us.</p>
						</li>
						<li>
								<p>Thanks to the <em><strong>City of Mist </strong>Discord </em>for contributing feedback, bug reports and generally being awesome about me barging in the door like I did.</p>
						</li>
				</ul>
				<p><em>If you feel like you could contribute something don't hesitate with contacting me <strong>@aMediocreDad</strong>.</em></p>
				<p></p>
				<blockquote>
						<p><strong>See you in the mist…</strong></p>
				</blockquote>
				`,
			});

			// Create a "welcome" chat message
			ChatMessage.create({
				title: "Welcome to Legend in the Mist!",
				content: /* html */ `
				<p><strong>Welcome to Legend in the Mist</strong></p>
				<p>Before you start playing, you should want to read the <a class="content-link" draggable="true" data-uuid="${entry.uuid
					}" data-id="${entry._id
					}" data-type="JournalEntryPage" data-tooltip="Text Page"><i class="fas fa-file-lines"></i>Legend in the Mist</a> journal entry. It contains some important information about the system, and what to expect.</p>
				<p>Once you've read the journal entry, you can click the button below to import all the rules and content required to play the Tinderbox Demo.</p>
				<button type="button" id="litm--import-adventure" style="background: var(--litm-color-status-bg);"><strong>${t(
						"Litm.ui.import-adventure"
					)}</strong></button>
				<p style="text-align:center;">Good luck, and have fun!</p>
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

		Hooks.on("renderChatMessage", (_app, html) => {
			html.find("#litm--import-adventure").on("click", async () => {
				const adventure = await game.packs.get("litm.tinderbox-demo").getDocuments();
				adventure?.[0]?.sheet.render(true);
			});
		});

		Hooks.on("importAdventure", async () => {
			const updates = await Promise.all(
				game.scenes
					.filter((s) => /litm\/assets/.test(s.thumb))
					.map(async (s) => {
						const { thumb } = await s.createThumbnail();
						return { _id: s.id, thumb };
					})
			);
			await Scene.updateDocuments(updates);
			game.journal.getName("Tinderbox Demo Rules").sheet.render(true);
		});
	}
}

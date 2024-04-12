import { SheetMixin } from "../mixins/sheet-mixin.js";
import { confirmDelete, dispatch, localize as t } from "../utils.js";

export class StoryTagApp extends SheetMixin(FormApplication) {
	#contextmenu = null;

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["litm", "litm--story-tags"],
			template: "systems/litm/templates/apps/story-tags.html",
			left: window.innerWidth - 605,
			top: 80,
			width: 300,
			height: 500,
			resizable: true,
			submitOnChange: true,
			submitOnClose: true,
			closeOnSubmit: false,
			dragDrop: [{ dropSelector: "form" }],
		});
	}

	get config() {
		const config = game.settings.get("litm", "storytags");
		if (!config || foundry.utils.isEmpty(config))
			return { actors: [], tags: [] };
		return config;
	}

	get actors() {
		return (
			this.config.actors
				?.map((id) => game.actors.get(id))
				.filter(Boolean)
				.map((actor) => ({
					name: actor.name,
					type: actor.type,
					img: actor.prototypeToken.texture.src || actor.img,
					id: actor._id,
					isOwner: actor.isOwner,
					tags: actor.effects
						.filter((e) => !!e.flags.litm?.type)
						.map((e) => ({
							id: e._id,
							name: e.name,
							values: e.flags.litm.values,
							isBurnt: e.flags.litm.isBurnt,
							value: e.flags.litm.values.findLast((v) => !!v),
							type: e.flags.litm.values.some((v) => !!v) ? "status" : "tag",
						}))
						.sort((a, b) => a.name.localeCompare(b.name))
						.sort((a, b) =>
							a.type === b.type ? 0 : a.type === "status" ? -1 : 1,
						),
				})) || []
		);
	}

	get tags() {
		return this.config.tags
			.sort((a, b) => a.name.localeCompare(b.name))
			.sort((a, b) => (a.type === b.type ? 0 : a.type === "status" ? -1 : 1));
	}

	async setActors(actors) {
		await game.settings.set("litm", "storytags", { ...this.config, actors });
		return this.#broadcastRender();
	}

	async setTags(tags) {
		await game.settings.set("litm", "storytags", { ...this.config, tags });
		return this.#broadcastRender();
	}

	async getData() {
		return {
			actors: this.actors
				.sort((a, b) => a.name.localeCompare(b.name))
				.sort((_a, b) => (b.type === "challenge" ? 1 : -1)),
			tags: this.tags || [],
		};
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find("[data-click]").on("click", this.#onClick.bind(this));
		html.find("[data-context]").on("contextmenu", this.#onContext.bind(this));
		html
			.find("[data-focus")
			.on("focus", (event) => event.currentTarget.select());

		window.addEventListener("resize", () => {
			this.setPosition({ left: window.innerWidth - 605 });
		});

		game.socket.on("system.litm", async (data) => {
			if (data.app !== "story-tags") return;
			switch (data.type) {
				case "update":
					this.#doUpdate(data.component, data.data);
					break;
				case "render":
					this.render();
					break;
			}
		});

		// GM only listeners
		if (!game.user.isGM) return;

		this.#contextmenu = ContextMenu.create(
			this,
			html,
			"[data-context='menu']",
			[
				{
					name: game.i18n.localize("Litm.ui.remove-story-tags"),
					icon: '<i class="fas fa-tags"></i>',
					callback: () => {
						this.setTags([]);
					},
				},
				{
					name: game.i18n.localize("Litm.ui.remove-actors"),
					icon: "<i class='fas fa-user-slash'></i>",
					callback: () => {
						this.setActors([]);
					},
				},
			],
			{
				hookName: "LitmStoryTagsContextMenu",
			},
		);
		this.#contextmenu._setPosition = function (html, target) {
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			html.toggleClass("expand-up", (this._expandUp = true));
			target.append(html);
			target.addClass("context");
		};
	}

	async _updateObject(_event, formData) {
		const data = foundry.utils.expandObject(formData);
		if (foundry.utils.isEmpty(data)) return;

		const { story, ...actors } = data;

		await Promise.all(
			Object.entries(actors).map(([id, tags]) =>
				this.#updateTagsOnActor({
					id,
					tags: Object.entries(tags).map(([tagId, data]) => ({
						_id: tagId,
						name: data.name,
						flags: {
							litm: {
								type: data.values.some((v) => v !== null) ? "status" : "tag",
								values: data.values,
								isBurnt: data.isBurnt,
							},
						},
					})),
				}),
			),
		);

		const storyTags = Object.entries(story || {}).map(([tagId, data]) => ({
			id: tagId,
			name: data.name,
			values: data.values,
			isBurnt: data.isBurnt,
			type: data.values.some((v) => v !== null) ? "status" : "tag",
			value: data.values.filter((v) => v !== null).at(-1),
		}));

		if (game.user.isGM) await this.setTags(storyTags);
		else this.#broadcastUpdate("tags", storyTags);
	}

	async _onDrop(dragEvent) {
		const dragData = dragEvent.dataTransfer.getData("text/plain");
		const data = JSON.parse(dragData);

		// Handle only Actors to begin with
		if (!["Actor", "tag", "status"].includes(data.type)) return;
		const id = data.uuid?.split(".").pop() || data.id;

		// Add tags and statuses to the story / Actor
		if (data.type === "tag" || data.type === "status") {
			const target = dragEvent.target.closest("[data-id]")?.dataset.id;
			if (target) {
				return this.#addTagToActor({
					id: target,
					tag: data,
				});
			}

			if (game.user.isGM) return this.setTags([...this.tags, data]);
			return this.#broadcastUpdate("tags", [...this.tags, data]);
		}

		if (this.config.actors.includes(id)) return;

		// Add current tags and statuses from a challenge
		const actor = game.actors.get(id);
		if (
			actor.type === "challenge" &&
			actor.effects.size === 0 &&
			actor.system.tags.length
		) {
			const tags = actor.system.tags.matchAll(CONFIG.litm.tagStringRe);
			await actor.createEmbeddedDocuments(
				"ActiveEffect",
				Array.from(tags).map(([_, name, value]) => ({
					name,
					flags: {
						litm: {
							type: value ? "status" : "tag",
							values: Array(6)
								.fill()
								.map((_, i) =>
									Number.parseInt(value) === i + 1 ? value : null,
								),
							isBurnt: false,
						},
					},
				})),
			);
		}

		await this.setActors([...this.config.actors, id]);
	}

	// Only GM can drop actors onto the board
	_canDragDrop() {
		return game.user.isGM;
	}

	#onClick(event) {
		const action = event.currentTarget.dataset.click;
		const target = event.currentTarget.dataset.id;

		switch (action) {
			case "add-tag":
				this.#addTag(target);
				break;
		}
	}

	#onContext(event) {
		const action = event.currentTarget.dataset.context;
		const target = event.currentTarget.dataset.id;

		switch (action) {
			case "remove-tag":
				this.#removeTag(event.currentTarget);
				break;
			case "remove-actor":
				this.#removeActor(target);
				break;
		}
	}

	async #addTag(target) {
		const tag = {
			name: t("Litm.ui.name-tag"),
			values: Array(6)
				.fill()
				.map(() => null),
			type: "tag",
			isBurnt: false,
			id: foundry.utils.randomID(),
		};

		if (target === "story") {
			if (game.user.isGM) return this.setTags([...this.tags, tag]);
			return this.#broadcastUpdate("tags", [...this.tags, tag]);
		}

		return this.#addTagToActor({ id: target, tag });
	}

	async #removeTag(target) {
		const id = target.dataset.id;
		const type = target.dataset.type;

		if (type === "story") {
			if (!(await confirmDelete("Litm.other.tag"))) return;
			if (game.user.isGM)
				return this.setTags(this.config.tags.filter((t) => t.id !== id));
			return this.#broadcastUpdate(
				"tags",
				this.config.tags.filter((t) => t.id !== id),
			);
		}
		return this.#removeTagFromActor({ actorId: type, id });
	}

	async #addTagToActor({ id, tag }) {
		const actor = game.actors.get(id);
		if (!actor)
			return ui.notifications.error("Litm.ui.error-no-actor", {
				localize: true,
			});
		if (!actor.isOwner)
			return ui.notifications.error("Litm.ui.warn-not-owner", {
				localize: true,
			});

		await actor.createEmbeddedDocuments("ActiveEffect", [
			{
				name: tag.name,
				flags: { litm: { type: "tag", values: tag.values, isBurnt: false } },
			},
		]);
		return this.#broadcastRender();
	}

	async #updateTagsOnActor({ id, tags }) {
		const actor = game.actors.get(id);
		return actor.updateEmbeddedDocuments("ActiveEffect", tags);
	}

	async #removeTagFromActor({ actorId, id }) {
		const actor = game.actors.get(actorId);

		if (!actor)
			return ui.notifications.error("Litm.ui.error-no-actor", {
				localize: true,
			});
		if (!actor.isOwner) return;

		if (!(await confirmDelete("Litm.other.tag"))) return;

		await actor.deleteEmbeddedDocuments("ActiveEffect", [id]);
		return this.#broadcastRender();
	}

	async #removeActor(id) {
		if (!game.user.isGM) return;
		if (!(await confirmDelete("Actor"))) return;

		await this.setActors(this.config.actors.filter((a) => a !== id));
		this.#broadcastRender();
	}

	/**  Start Socket Methods  */

	#broadcastUpdate(component, data) {
		dispatch({ app: "story-tags", type: "update", component, data });
	}

	#broadcastRender() {
		dispatch({ app: "story-tags", type: "render" });
		this.render();
	}

	async #doUpdate(component, data) {
		if (!game.user.isGM) return;
		if (component === "tags") return this.setTags(data);
	}

	/**  End Socket Methods  */
}

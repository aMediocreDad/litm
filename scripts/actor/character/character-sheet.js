import { SheetMixin } from "../../mixins/sheet-mixin.js";
import { confirmDelete, dispatch } from "../../utils.js";
import { localize as t } from "../../utils.js";

export class CharacterSheet extends SheetMixin(ActorSheet) {
	static defaultOptions = foundry.utils.mergeObject(ActorSheet.defaultOptions, {
		classes: ["litm", "litm--character"],
		width: 250,
		height: 350,
		left: window.innerWidth / 2 - 250,
		top: window.innerHeight / 2 - 250,
		scrollY: [".taglist", ".editor"],
		resizable: false,
	});

	#dragAvatarTimeout = null;
	#notesEditorStyle = "display: none;";
	#tagsFocused = null;
	#tagsHovered = false;
	#themeHovered = null;
	#contextmenu = null;
	#roll = game.litm.LitmRollDialog.create({
		actorId: this.actor._id,
		characterTags: [],
		shouldRoll: () => game.settings.get("litm", "skip_roll_moderation"),
	});

	get template() {
		return "systems/litm/templates/actor/character.html";
	}

	get items() {
		return this.actor.items;
	}

	get system() {
		return this.actor.system;
	}

	get storyTags() {
		return [...this.system.storyTags, ...this.system.statuses];
	}

	updateRollDialog(data) {
		this.#roll.receiveUpdate(data);
	}

	renderRollDialog({ toggle } = { toggle: false }) {
		if (toggle && this.#roll.rendered) this.#roll.close();
		else this.#roll.render(true);
	}

	resetRollDialog() {
		this.#roll.reset();
		this.render();
	}

	async toggleBurnTag(tag) {
		switch (tag.type) {
			case "powerTag": {
				const parentTheme = this.items.find(
					(i) =>
						i.type === "theme" &&
						i.system.powerTags.some((t) => t.id === tag.id),
				);
				const { powerTags } = parentTheme.system.toObject();
				powerTags.find((t) => t.id === tag.id).isBurnt = !tag.isBurnt;
				this.actor.updateEmbeddedDocuments("Item", [
					{
						_id: parentTheme.id,
						"system.powerTags": powerTags,
					},
				]);
				break;
			}
			case "themeTag": {
				const theme = this.items.get(tag.id);
				this.actor.updateEmbeddedDocuments("Item", [
					{
						_id: theme.id,
						"system.isBurnt": !tag.isBurnt,
					},
				]);
				break;
			}
			case "backpack": {
				const backpack = this.items.find((i) => i.type === "backpack");
				const { contents } = backpack.system.toObject();
				contents.find((i) => i.id === tag.id).isBurnt = !tag.isBurnt;
				this.actor.updateEmbeddedDocuments("Item", [
					{
						_id: backpack.id,
						"system.contents": contents,
					},
				]);
				break;
			}
		}
	}

	async gainExperience(tag) {
		const parentTheme = this.items.find(
			(i) =>
				i.type === "theme" &&
				i.system.weaknessTags.some((t) => t.id === tag.id),
		);
		this.actor.updateEmbeddedDocuments("Item", [
			{
				_id: parentTheme.id,
				"system.experience": parentTheme.system.experience + 1,
			},
		]);
	}

	async getData() {
		const themes = await Promise.all(
			this.items
				.filter((i) => i.type === "theme")
				.sort((a, b) => a.sort - b.sort)
				.map((i) => i.sheet.getData()),
		);
		const note = await TextEditor.enrichHTML(this.system.note);
		const backpack = {
			name: this.items.find((i) => i.type === "backpack")?.name,
			id: this.items.find((i) => i.type === "backpack")?._id,
			contents: this.system.backpack
				.sort((a, b) => a.name.localeCompare(b.name))
				.sort((a, b) => (a.isActive && b.isActive ? 0 : a.isActive ? -1 : 1)),
		};
		return {
			...this.object.system,
			backpack,
			note,
			themes,
			_id: this.actor.id,
			burntTags: this.#roll.characterTags.filter(
				(t) => t.isBurnt || t.state === "burned",
			),
			img: this.actor.img,
			name: this.actor.name,
			notesEditorStyle: this.#notesEditorStyle,
			rollTags: this.#roll.characterTags,
			storyTags: this.storyTags,
			tagsFocused: this.#tagsFocused,
			tagsHovered: this.#tagsHovered,
			themeHovered: this.#themeHovered,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").on("click", this.#handleClicks.bind(this));
		html.find("[data-dblclick").on("dblclick", this.#handleDblclick.bind(this));
		html
			.find("[data-context]")
			.on("contextmenu", this.#handleContextmenu.bind(this));
		html
			.find("[data-mousedown]")
			.on("mousedown", this.#handleMouseDown.bind(this));
		html
			.find("[data-drag]")
			.on("mousedown", this.#onDragHandleMouseDown.bind(this));
		html.on("mouseover", (event) => {
			html.find(".litm--character-theme").removeClass("hovered");
			html.find(".litm--character-story-tags").removeClass("hovered");

			const t = event.target.classList.contains("litm--character-theme")
				? event.target
				: event.target.closest(".litm--character-theme");

			if (t) this.#themeHovered = t.dataset.id;
			else this.#themeHovered = null;

			if (event.target.closest(".litm--character-story-tags"))
				this.#tagsHovered = true;
			else this.#tagsHovered = false;
		});

		this.#contextmenu = ContextMenu.create(
			this,
			html,
			"[data-context='menu']",
			[
				{
					name: game.i18n.localize("Litm.ui.edit"),
					icon: '<i class="fas fa-edit"></i>',
					callback: (html) => {
						const id = html.parent().data("id");
						const item = this.actor.items.get(id);
						item.sheet.render(true);
					},
				},
				{
					name: game.i18n.localize("Litm.ui.remove"),
					icon: "<i class='fas fa-trash'></i>",
					callback: (html) => {
						const id = html.parent().data("id");
						this.#removeItem(id);
					},
				},
			],
			{
				hookName: "LitmItemContextMenu",
			},
		);
		this.#contextmenu._setPosition = function (html, target) {
			this._expandUp = true;
			html.toggleClass("expand-up", this._expandUp);
			target.append(html);
			target.addClass("context");
		};
	}

	// Hack to allow updating the embedded items
	async _updateObject(event, formData) {
		const cleaned = await this.#handleUpdateEmbeddedItems(formData);
		return super._updateObject(event, cleaned);
	}

	async _onDrop(dragEvent) {
		const dragData = dragEvent.dataTransfer.getData("text/plain");
		const data = JSON.parse(dragData);

		// Handle dropping tags and statuses
		if (!["tag", "status"].includes(data.type)) return super._onDrop(dragEvent);

		await this.actor.createEmbeddedDocuments("ActiveEffect", [
			{
				name: data.name,
				flags: {
					litm: {
						type: data.type,
						values: data.values,
						isBurnt: data.isBurnt,
					},
				},
			},
		]);

		game.litm.storyTags.render();
		dispatch({
			app: "story-tags",
			type: "render",
		});
	}

	// Prevent dropping more than 4 themes on the character sheet
	async _onDropItem(event, data) {
		const item = await Item.implementation.fromDropData(data);
		if (!["backpack", "theme"].includes(item.type)) return;

		if (this.items.get(item.id)) return this._onSortItem(event, item);

		const numThemes = this.items.filter((i) => i.type === "theme").length;
		if (item.type === "theme" && numThemes >= 4)
			return ui.notifications.warn(
				game.i18n.localize("Litm.ui.warn-theme-limit"),
			);

		const numBackpacks = this.items.filter((i) => i.type === "backpack").length;
		if (item.type === "backpack" && numBackpacks >= 1)
			return this.#handleLootDrop(item);

		return super._onDropItem(event, data);
	}

	/** @override - This method needs to be overriden to accommodate readonly input fields */
	_getSubmitData(updateData) {
		if (!this.form)
			throw new Error(
				"The FormApplication subclass has no registered form element",
			);
		const fd = new FormDataExtended(this.form, {
			editors: this.editors,
			readonly: true,
			disabled: true,
		});
		let data = fd.object;
		if (updateData)
			data = foundry.utils.flattenObject(
				foundry.utils.mergeObject(data, updateData),
			);
		return data;
	}

	_onEditImage(event) {
		if (this.#dragAvatarTimeout) return clearTimeout(this.#dragAvatarTimeout);
		return super._onEditImage(event);
	}

	#handleMouseDown(event) {
		const t = event.currentTarget;
		const action = t.dataset.mousedown;

		switch (action) {
			case "keep-open":
				this.#keepOpen(event);
				break;
		}
	}

	#handleClicks(event) {
		const t = event.currentTarget;
		const action = t.dataset.click;
		const id = t.dataset.id;

		switch (action) {
			case "add-tag":
				this.#addTag();
				break;
			case "increase":
				this.#increase(event);
				break;
			case "open":
				this.#open(id);
				break;
			case "close":
				this.#close(id);
				break;
			case "select":
				this.#select(event);
				break;
		}
	}

	#handleDblclick(event) {
		const t = event.currentTarget;
		const action = t.dataset.dblclick;

		switch (action) {
			case "return":
				this.#tagsFocused = null;
				t.classList.remove("focused");
				t.style.cssText = this.#tagsFocused;
				break;
		}
	}

	#handleContextmenu(event) {
		const t = event.currentTarget;
		const action = t.dataset.context;

		switch (action) {
			case "decrease":
				event.preventDefault();
				event.stopPropagation();
				this.#decrease(event);
				break;
			case "remove-effect":
				event.preventDefault();
				event.stopPropagation();
				this.#removeEffect(t.dataset.id);
				break;
		}
	}

	#onDragHandleMouseDown(event) {
		this.#dragAvatarTimeout = null;

		const t = event.currentTarget;
		const target = t.dataset.drag;
		const parent = $(t).parents(target).first();

		const x = event.clientX - parent.position().left;
		const y = event.clientY - parent.position().top;

		const handleDrag = (event) => {
			if (target === ".window-app") this.#dragAvatarTimeout = true;

			parent.css({
				left: event.clientX - x,
				top: event.clientY - y,
			});
		};

		const handleMouseUp = () => {
			if (this.#dragAvatarTimeout) {
				this.setPosition({
					left: parent.position().left,
					top: parent.position().top,
				});
				this.#dragAvatarTimeout = setTimeout(() => {
					this.#dragAvatarTimeout = null;
				}, 100);
			}

			if (target === "#note") this.#notesEditorStyle = parent.attr("style");

			$(document).off("mousemove", handleDrag);
			$(document).off("mouseup", handleMouseUp);
		};

		$(document).on("mousemove", handleDrag);
		$(document).on("mouseup", handleMouseUp);
	}

	async #addTag() {
		await this.actor.createEmbeddedDocuments("ActiveEffect", [
			{
				name: t("Litm.ui.name-tag"),
				flags: {
					litm: {
						type: "tag",
						values: new Array(6).fill(false),
						isBurnt: false,
					},
				},
			},
		]);

		game.litm.storyTags.render();
		dispatch({
			app: "story-tags",
			type: "render",
		});
	}

	async #removeItem(id) {
		const item = this.items.get(id);
		if (!(await confirmDelete(`TYPES.Item.${item.type}`))) return;

		return item.delete();
	}

	async #removeEffect(id) {
		const effect = this.actor.effects.get(id);
		if (!(await confirmDelete())) return;

		await effect.delete();

		game.litm.storyTags.render();
		dispatch({
			app: "story-tags",
			type: "render",
		});
	}

	async #increase(event) {
		const t = event.currentTarget;
		const attrib = t.dataset.id;
		const id = $(t).parents(".item").data("id");
		const item = this.actor.items.get(id);
		const value = foundry.utils.getProperty(item, attrib);

		return item.update({ [attrib]: Math.min(value + 1, 3) });
	}

	async #decrease(event) {
		const t = event.currentTarget;
		const attrib = t.dataset.id;
		const id = $(t).parents(".item").data("id");
		const item = this.items.get(id);
		const value = foundry.utils.getProperty(item, attrib);

		return item.update({ [attrib]: Math.max(value - 1, 0) });
	}

	#open(id) {
		switch (id) {
			case "note":
				this.element.find("#note").show(100);
				this.#notesEditorStyle = "display: block;";
				break;
			case "roll":
				this.renderRollDialog();
				break;
		}
	}

	#close(id) {
		switch (id) {
			case "note": {
				const notes = this.element.find("#note");
				this.#notesEditorStyle = notes.attr("style").replace("block", "none");
				notes.hide(100);
			}
		}
	}

	#select(event) {
		// Prevent double clicks from selecting the tag
		if (event.detail > 1) return;

		const t = event.currentTarget;
		const toBurn = event.shiftKey;
		const toBurnNoRoll = event.altKey;
		const id = t.dataset.id;
		const tag = this.system.allTags.find((t) => t.id === id).toObject();
		const selected = t.hasAttribute("data-selected");

		if (toBurnNoRoll) return this.toggleBurnTag(tag);
		if (!selected && tag.isBurnt) return;

		// Add or remove the tag from the roll
		switch (selected) {
			case true:
				this.#roll.removeTag(tag);
				break;
			case false:
				this.#roll.addTag(tag, toBurn);
				break;
		}

		// Render the roll dialog if it's open
		if (this.#roll.rendered) this.#roll.render();
		this.render();
	}

	#keepOpen(event) {
		const t = event.currentTarget;

		t.classList.add("focused");
		const listener = () => {
			this.#tagsFocused = t.style.cssText;
			t.removeEventListener("mouseup", listener);
		};
		t.addEventListener("mouseup", listener);
	}

	async #handleLootDrop(item) {
		const { contents } = item.system;
		const chosenLoot = await Dialog.wait({
			title: game.i18n.localize("Litm.ui.item-transfer-title"),
			content: await renderTemplate(
				"systems/litm/templates/apps/loot-dialog.html",
				{ contents, cssClass: "litm--loot-dialog" },
			),
			buttons: {
				loot: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("Litm.other.transfer"),
					callback: (html) => {
						const chosenLoot = html
							.find("input[type=checkbox]:checked")
							.map((_, i) => i.value)
							.get();
						return chosenLoot;
					},
				},
			},
		});
		if (!chosenLoot || !chosenLoot.length) return;

		const loot = contents.filter((i) => chosenLoot.includes(i.id));
		const backpack = this.items.find((i) => i.type === "backpack");

		if (!backpack) {
			error("Litm.ui.error-no-backpack");
			throw new Error("Litm.ui.error-no-backpack");
		}

		// Add the loot to the backpack
		await backpack.update({
			"system.contents": [...this.system.backpack, ...loot],
		});
		// Remove the loot from the item
		await item.update({
			"system.contents": contents.filter((i) => !chosenLoot.includes(i.id)),
		});

		ui.notifications.info(
			game.i18n.format("Litm.ui.item-transfer-success", {
				items: loot.map((i) => i.name).join(", "),
			}),
		);
		backpack.sheet.render(true);
	}

	async #handleUpdateEmbeddedItems(formData) {
		const itemMap = {};
		for (const [key, value] of Object.entries(formData)) {
			if (!key.startsWith("items.")) continue;

			delete formData[key];
			const [_, _id, subkey, ...rest] = key.split(".");
			itemMap[_id] ??= {};
			itemMap[_id][subkey] ??= {};
			if (rest.length === 0) itemMap[_id][subkey] = value;
			else itemMap[_id][subkey][rest.join(".")] = value;
		}

		const itemsToUpdate = Object.entries(itemMap).reduce((acc, [id, data]) => {
			acc.push({ _id: id, ...data });
			return acc;
		}, []);

		if (itemsToUpdate.length)
			await this.actor.updateEmbeddedDocuments("Item", itemsToUpdate);

		const effectMap = {};
		for (const [key, value] of Object.entries(formData)) {
			if (!key.startsWith("effects.")) continue;

			delete formData[key];
			const [_, _id, subkey, ...rest] = key.split(".");
			effectMap[_id] ??= {};
			effectMap[_id][subkey] ??= {};
			if (rest.length === 0) effectMap[_id][subkey] = value;
			else effectMap[_id][subkey][rest.join(".")] = value;
		}

		const effectsToUpdate = Object.entries(effectMap).reduce(
			(acc, [id, data]) => {
				acc.push({ _id: id, ...data });
				return acc;
			},
			[],
		);

		if (effectsToUpdate.length) {
			await this.actor.updateEmbeddedDocuments("ActiveEffect", effectsToUpdate);
			game.litm.storyTags.render();
			dispatch({
				app: "story-tags",
				type: "render",
			});
		}

		return formData;
	}
}

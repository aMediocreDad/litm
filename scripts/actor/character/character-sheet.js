import { confirmDelete, dispatch } from "../../utils.js";

export class CharacterSheet extends ActorSheet {
	static defaultOptions = foundry.utils.mergeObject(ActorSheet.defaultOptions, {
		classes: ["litm", "litm--character"],
		width: 250,
		height: 350,
		left: window.innerWidth / 2 - 250,
		top: window.innerHeight / 2 - 250,
		scrollY: [".taglist"],
		resizable: false,
	});

	#editImageTimeout = null;
	#notesEditorOpened = false;
	#focusedTags = null;
	#contextmenu = null;
	#roll = game.litm.LitmRollDialog.create({
		actorId: this.actor._id,
		characterTags: [],
		shouldRoll: () => game.user.isGM,
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

	set roll(app) {
		this.#roll = app;
	}

	renderRollDialog() {
		this.#roll.render(true);
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
			_id: this.actor.id,
			img: this.actor.img,
			name: this.actor.name,
			storyTags: this.storyTags,
			backpack,
			note,
			themes,
			tagsFocused: this.#focusedTags,
			notesEditorOpened: this.#notesEditorOpened,
			rollTags: this.#roll.characterTags,
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
			.find(".draggable")
			.on("mousedown", this.#onDragHandleMouseDown.bind(this));

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
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			html.toggleClass("expand-up", (this._expandUp = true));
			target.append(html);
			target.addClass("context");
		};
	}

	// Hack to allow updating the embedded items
	async _updateObject(event, formData) {
		const cleaned = await this.#handleUpdateEmbeddedItems(formData);
		return super._updateObject(event, cleaned);
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
		if (this.#editImageTimeout) return clearTimeout(this.#editImageTimeout);
		super._onEditImage(event);
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
				this.#focusedTags = null;
				t.classList.remove("focused");
				t.style.cssText = this.#focusedTags;
				break;
		}
	}

	#handleContextmenu(event) {
		const t = event.currentTarget;
		const action = t.dataset.context;

		switch (action) {
			case "decrease":
				this.#decrease(event);
				break;
		}
	}

	#onDragHandleMouseDown(event) {
		this.#editImageTimeout = null;

		const t = event.currentTarget;
		const parent = $(t).parents(".window-app").first();

		const x = event.clientX - parent.position().left;
		const y = event.clientY - parent.position().top;

		const handleDrag = (event) => {
			this.#editImageTimeout = true;
			parent.css({
				left: event.clientX - x,
				top: event.clientY - y,
			});
		};

		$(document).on("mousemove", handleDrag);
		$(document).on("mouseup", () => {
			if (this.#editImageTimeout)
				this.#editImageTimeout = setTimeout(() => {
					this.#editImageTimeout = null;
				}, 100);
			this.setPosition({ left: parent.position().left, top: parent.position().top })
			$(document).off("mousemove", handleDrag);
		});
	}

	async #removeItem(id) {
		const item = this.items.get(id);
		if (!(await confirmDelete(`TYPES.Item.${item.type}`))) return;

		return item.delete();
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
				this.#notesEditorOpened = true;
				this.element.find("#note").show(100);
				break;
			case "roll":
				this.renderRollDialog();
				break;
		}
	}

	#close(id) {
		switch (id) {
			case "note":
				this.#notesEditorOpened = false;
				this.element.find("#note").hide(100);
		}
	}

	#select(event) {
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
		t.toggleAttribute("data-selected", !selected);

		// Burn the tag if shift is pressed
		if (toBurn && !selected) {
			for (const el of this.element.find(`[data-click="select"].burned`))
				el.classList.remove("burned");
			t.classList.add("burned");
		} else t.classList.remove("burned");

		// Render the roll dialog if it's open
		if (this.#roll.rendered) this.#roll.render();
	}

	#keepOpen(event) {
		const t = event.currentTarget;

		t.classList.add("focused");
		const listener = t.addEventListener("mouseup", () => {
			this.#focusedTags = t.style.cssText;
			t.removeEventListener("mouseup", listener);
		});
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

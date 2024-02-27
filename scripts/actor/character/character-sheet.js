import { confirmDelete } from "../../utils.js";

export class CharacterSheet extends ActorSheet {
	static defaultOptions = mergeObject(ActorSheet.defaultOptions, {
		classes: ["litm", "litm--character"],
		width: 250,
		height: 350,
		left: window.innerWidth / 2 - 250,
		top: window.innerHeight / 2 - 250,
		resizable: false,
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

	getData() {
		const { data, ...rest } = super.getData();
		const items = this.items.map((i) => i.sheet.getData());
		return { ...rest, data, items };
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").click(this.#handleClicks.bind(this));
		html.find("[data-dblclick").dblclick(this.#handleDblclick.bind(this));
		html.find("[data-context").contextmenu(this.#handleContextmenu.bind(this));
		html.find(".draggable").mousedown(this.#onDragHandleMouseDown.bind(this));
	}

	#handleClicks(event) {
		event.stopPropagation();
		event.preventDefault();

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
		}
	}

	#handleDblclick(event) {
		event.stopPropagation();
		event.preventDefault();

		const t = event.currentTarget;
		const action = t.dataset.dblclick;
		const id = t.dataset.id;

		switch (action) {
			case "edit":
				this.actor.items.get(id).sheet.render(true);
				break;
		}
	}

	#handleContextmenu(event) {
		event.stopPropagation();
		event.preventDefault();

		const t = event.currentTarget;
		const action = t.dataset.context;
		const id = t.dataset.id;

		switch (action) {
			case "remove-tag":
				this.#removeTag(id);
				break;
			case "decrease":
				this.#decrease(event);
				break;
			case "delete":
				this.#removeItem(id);
				break;
		}
	}

	#onDragHandleMouseDown(event) {
		event.stopPropagation();
		event.preventDefault();

		const t = event.currentTarget;
		const parent = $(t).parent();

		const x = event.clientX - parent.position().left;
		const y = event.clientY - parent.position().top;

		const handleDrag = (event) => {
			parent.css({
				left: event.clientX - x,
				top: event.clientY - y,
			});
		};

		$(document).on("mousemove", handleDrag);
		$(document).on("mouseup", () => {
			$(document).off("mousemove", handleDrag);
		});
	}

	async #addTag() {
		const item = {
			name: "New Item",
			isActive: false,
			isBurnt: false,
			type: "backpack",
			id: randomID(),
		};

		const backpack = this.system.backpack;
		backpack.push(item);

		return this.actor.update({ "system.backpack": backpack });
	}

	async #removeTag(index) {
		if (!(await confirmDelete())) return;

		const backpack = this.system.backpack;
		backpack.splice(index, 1);

		return this.actor.update({ "system.backpack": backpack });
	}

	async #removeItem(id) {
		if (!(await confirmDelete())) return;

		const item = this.items.get(id);
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
				this.element.find("#note").show(100);
				break;
			case "roll":
				this.#roll();
				break;
		}
	}

	#close(id) {
		switch (id) {
			case "note":
				this.element.find("#note").hide(100);
		}
	}

	#roll() {
		const powerTags = this.system.availablePowerTags;
		const weaknessTags = this.system.weaknessTags;

		const rc = game.litm.LitmRollDialog;
		rc.create(this.actor.id, powerTags, weaknessTags);
	}

	async #handleUpdateEmbeddedItems(formData) {
		const updateMap = {};
		for (const [key, value] of Object.entries(formData)) {
			if (!key.startsWith("items.")) continue;

			delete formData[key];
			const [_, _id, subkey, ...rest] = key.split(".");
			updateMap[_id] ??= {};
			updateMap[_id][subkey] ??= {};
			if (rest.length === 0) updateMap[_id][subkey] = value;
			else updateMap[_id][subkey][rest.join(".")] = value;
		}

		const toUpdate = Object.entries(updateMap).reduce((acc, [id, data]) => {
			acc.push({ _id: id, ...data });
			return acc;
		}, []);

		if (toUpdate.length) this.actor.updateEmbeddedDocuments("Item", toUpdate);
		return formData;
	}

	// Hack to allow updating the embedded items
	async _updateObject(event, formData) {
		const cleaned = await this.#handleUpdateEmbeddedItems(formData);
		return super._updateObject(event, cleaned);
	}

	// Prevent dropping more than 4 themes on the character sheet
	async _onDropItem(event, data) {
		const item = await Item.implementation.fromDropData(data);
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
}

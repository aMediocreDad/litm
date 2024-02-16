import { confirmDelete, getTagData } from "../util.js";

export class ThemeSheet extends ItemSheet {
	static defaultOptions = mergeObject(ItemSheet.defaultOptions, {
		classes: ["litm", "theme"],
		width: 300,
		height: 600,
	});

	get system() {
		return this.item.system;
	}

	get template() {
		return "systems/litm/templates/item/theme.html";
	}

	get powerTags() {
		return this.system.powerTags.map(getTagData);
	}

	get weaknessTags() {
		return this.system.weaknessTags.map(getTagData);
	}

	getData() {
		const { data, ...rest } = super.getData();

		// Add slug to tags
		data.system.powerTags = data.system.powerTags.map(getTagData);

		// Filter out weaknesses
		data.system.weakness = data.system.weaknessTags[0]

		return { data, ...rest };
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").click(this.#handleClicks.bind(this));
		html.find("[data-context").contextmenu(this.#handleContextmenu.bind(this));

		html.find("[data-input")
			.on('input', (event) => this.#handleInput(event))
			.on('blur', () => this._onSubmit(new Event('submit')));
	}

	#handleClicks(event) {
		const t = event.currentTarget;
		const action = t.dataset.click;
		const id = t.dataset.id;
		switch (action) {
			case "add-tag":
				this.#addTag();
				break;
			case "remove-tag":
				this.#removeTag(id);
				break;
			case "increase":
				this.#increase(id);
				break;
		}
	}

	#handleContextmenu(event) {
		const t = event.currentTarget;
		const action = t.dataset.context;
		const id = t.dataset.id;
		switch (action) {
			case "decrease":
				this.#decrease(id);
				break;
		}
	}

	#handleInput(event) {
		const t = event.currentTarget;
		const targetId = t.dataset.input;
		const value = t.innerText || t.value;
		const target = $(t).siblings(`input#${targetId}`);
		target.val(value);
	}

	async #addTag() {
		const tags = this.system.powerTags;

		tags.push({ name: game.i18n.localize("Litm.tags.unnamed"), equipped: false, burned: false });

		this.item.update({ "system.powerTags": tags });
	}

	async #removeTag(slug) {
		await confirmDelete();
		const tags = this.system.powerTags;
		tags.splice(slug, 1);
		await this.item.update({ "system.powerTags": tags });
	}

	async #increase(field) {
		const attribute = foundry.utils.getProperty(this.item, field);
		await this.item.update({ [field]: attribute + 1 });
	}

	async #decrease(field) {
		const attribute = foundry.utils.getProperty(this.item, field);
		await this.item.update({ [field]: attribute - 1 });
	}
}

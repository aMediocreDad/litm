import { SheetMixin } from "../../mixins/sheet-mixin.js";
import { confirmDelete } from "../../utils.js";

export class ThemeSheet extends SheetMixin(ItemSheet) {
	static defaultOptions = mergeObject(ItemSheet.defaultOptions, {
		classes: ["litm", "litm--theme"],
		width: 330,
		height: 660,
	});

	get system() {
		return this.item.system;
	}

	get template() {
		return "systems/litm/templates/item/theme.html";
	}

	getData() {
		const { data, ...rest } = super.getData();

		data.system.weakness = this.system.weakness;
		return { data, ...rest };
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").click(this.#handleClicks.bind(this));
		html.find("[data-context").contextmenu(this.#handleContextmenu.bind(this));
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

	async #addTag() {
		throw new Error("Not implemented");
	}

	async #removeTag(_) {
		if (!(await confirmDelete("Litm.other.tag"))) return;
		throw new Error("Not implemented");
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

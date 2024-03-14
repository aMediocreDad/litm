import { SheetMixin } from "../../mixins/sheet-mixin.js";
import { confirmDelete, localize as t } from "../../utils.js";

export class BackpackSheet extends SheetMixin(ItemSheet) {
	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["litm", "litm--backpack"],
			template: "systems/litm/templates/item/backpack.html",
			width: 400,
			height: 450,
			resizable: false,
			scrollY: [".taglist"],
		});
	}

	get system() {
		return this.item.system;
	}

	/** @override */
	async getData() {
		return { backpack: this.system.contents };
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").on("click", this.#onClick.bind(this));
		html.find("[data-context]").on("contextmenu", this.#onContext.bind(this));
	}

	#onClick(event) {
		const button = event.currentTarget;
		const action = button.dataset.click;

		switch (action) {
			case "add-tag":
				this.#addTag();
				break;
		}
	}

	#onContext(event) {
		const button = event.currentTarget;
		const action = button.dataset.context;

		switch (action) {
			case "remove-tag":
				this.#removeTag(button);
				break;
		}
	}

	#addTag() {
		const item = {
			name: t("Litm.ui.name-tag"),
			isActive: false,
			isBurnt: false,
			type: "backpack",
			id: randomID(),
		};

		const contents = this.system.contents;
		contents.push(item);

		return this.item.update({ "system.contents": contents });
	}

	async #removeTag(button) {
		if (!(await confirmDelete("Litm.other.tag"))) return;

		const index = button.dataset.id;
		const contents = this.system.contents;
		contents.splice(index, 1);

		return this.item.update({ "system.contents": contents });
	}
}

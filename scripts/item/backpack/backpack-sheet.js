import { SheetMixin } from "../../mixins/sheet-mixin.js";
import { confirmDelete, localize as t } from "../../utils.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class BackpackSheet extends SheetMixin(
	HandlebarsApplicationMixin(ItemSheetV2),
) {
	static PARTS = {
		form: {
			template: "systems/litm/templates/item/backpack.html",
			scrollable: [".taglist"]
		},
	};

	static DEFAULT_OPTIONS = {
		classes: ["litm", "litm--backpack"],
		form: {
			submitOnChange: true,
		},
		position: {
			height: 450,
			width: 400
		},
		window: {
			resizable: false,
		},
	};

	get system() {
		return this.item.system;
	}

	async _preparePartContext(_id, _context) {
		return { backpack: this.system.contents, name: this.item.name };
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").on("click", this.#onClick.bind(this));
		html.find("[data-context]").on("contextmenu", this.#onContext.bind(this));
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
			id: foundry.utils.randomID(),
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

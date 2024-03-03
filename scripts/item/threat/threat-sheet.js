import { SheetMixin } from "../../mixins/sheet-mixin.js";
import { confirmDelete, localize as t } from "../../utils.js";

export class ThreatSheet extends SheetMixin(ItemSheet) {
	isEditing = false;

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["litm", "litm--threat"],
			template: "systems/litm/templates/item/threat.html",
			width: 500,
			height: 200,
			resizable: true,
			submitOnChange: true,
		});
	}

	get system() {
		return this.item.system;
	}

	/** @override */
	async getData() {
		const { data, ...rest } = super.getData();

		if (!this.isEditing)
			data.system.consequences = await Promise.all(data.system.consequences.map(c => TextEditor.enrichHTML(c)));

		return {
			...rest,
			data,
			isEditing: this.isEditing,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").on("click", this.#handleClick.bind(this));
		html.find("[data-context]").on("contextmenu", this.#handleContextMenu.bind(this));

		if (this.isEditing)
			html.find("[contenteditable]:has(+#consequence)").focus();
	}

	async _onSubmit(formData, options = {}) {
		const res = await super._onSubmit(formData, options);
		if (!res['system.consequences']) return res;

		// Delete existing tags and statuses
		await this.item.deleteEmbeddedDocuments("ActiveEffect", this.item.effects.map((e) => e._id));

		const matches = res['system.consequences'].flatMap(string => string.matchAll(CONFIG.litm.tagStringRe));

		// Create new tags and statuses
		await this.item.createEmbeddedDocuments("ActiveEffect", Array.from(matches.map(([_, tag, status]) => {
			const type = status !== undefined ? "status" : "tag";
			return {
				name: tag,
				label: tag,
				flags: {
					litm: {
						type,
					},
				},
				changes: [
					{
						key: type === "tag" ? "TAG" : "STATUS",
						mode: 0,
						value: type === "tag" ? 1 : status,
					},
				],
			}
		})));
	}

	#handleClick(event) {
		const { click } = event.currentTarget.dataset;
		switch (click) {
			case "add-consequence":
				this.#addConsequence();
				break;
		}
	}

	#handleContextMenu(event) {
		event.preventDefault();
		const { context } = event.currentTarget.dataset;
		switch (context) {
			case "remove-consequence":
				this.#removeConsequence(event);
				break;
		}
	}

	#addConsequence() {
		const consequences = this.system.consequences;
		consequences.push(t("Litm.ui.name-consequence"));
		this.item.update({ "system.consequences": consequences });
	}

	async #removeConsequence(event) {
		if (!(await confirmDelete())) return;

		const index = event.currentTarget.dataset.index;
		this.system.consequences.splice(index, 1);

		this.item.update({ "system.consequences": this.system.consequences });
	}
}

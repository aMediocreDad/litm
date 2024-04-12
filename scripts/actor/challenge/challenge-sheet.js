import { SheetMixin } from "../../mixins/sheet-mixin.js";
import { confirmDelete } from "../../utils.js";

export class ChallengeSheet extends SheetMixin(ActorSheet) {
	static defaultOptions = foundry.utils.mergeObject(ActorSheet.defaultOptions, {
		classes: ["litm", "litm--challenge"],
		width: 320,
		height: 700,
		resizable: false,
		scrollY: [".litm--challenge-wrapper"],
	});

	get template() {
		return "systems/litm/templates/actor/challenge.html";
	}

	get system() {
		return this.actor.system;
	}

	get items() {
		return this.actor.items;
	}

	async getData() {
		const { data, rest } = super.getData();
		data.system.special = await TextEditor.enrichHTML(data.system.special);
		data.system.note = await TextEditor.enrichHTML(data.system.note);
		data.system.renderedTags = await TextEditor.enrichHTML(data.system.tags);
		data.items = await Promise.all(this.items.map((i) => i.sheet.getData()));

		return { data, ...rest, isEditing: this.isEditing };
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").on("click", this.#handleClick.bind(this));
		html
			.find("[data-dblclick]")
			.on("dblclick", this.#handleDblClick.bind(this));
		html
			.find("[data-context]")
			.on("contextmenu", this.#handleContext.bind(this));

		if (this.isEditing) html.find("[contenteditable]:has(+#tags)").focus();
	}

	async _updateObject(event, formData) {
		const sanitizedFormData = this.#sanitizeTags(formData);

		return super._updateObject(event, sanitizedFormData);
	}

	// Prevent dropping non-threat items
	async _onDropItem(event, data) {
		const item = await Item.implementation.fromDropData(data);
		if (item.type !== "threat") return;

		if (this.items.get(item.id)) return this._onSortItem(event, item);

		return super._onDropItem(event, data);
	}

	#handleClick(event) {
		event.preventDefault();

		const button = event.currentTarget;
		const action = button.dataset.click;

		switch (action) {
			case "add-limit":
				this.#addLimit();
				break;
			case "add-threat":
				this.#addThreat();
				break;
			case "increase":
				this.#increase(button);
				break;
		}
	}

	#handleDblClick(event) {
		event.preventDefault();

		const button = event.currentTarget;
		const action = button.dataset.dblclick;

		switch (action) {
			case "edit-item":
				this.#openItemSheet(button);
				break;
		}
	}

	#handleContext(event) {
		event.preventDefault();

		const button = event.currentTarget;
		const action = button.dataset.context;

		switch (action) {
			case "remove-limit":
				this.#removeLimit(button);
				break;
			case "remove-threat":
				this.#removeThreat(button);
				break;
			case "decrease":
				this.#decrease(button);
				break;
		}
	}

	#addLimit() {
		const limits = this.system.limits;
		const limit = {
			name: "New Limit",
			value: 0,
		};

		limits.push(limit);
		this.actor.update({ "system.limits": limits });
	}

	async #addThreat() {
		const threats = await this.actor.createEmbeddedDocuments("Item", [
			{ name: "New Threat", type: "threat" },
		]);
		threats[0].sheet.render(true);
	}

	async #removeLimit(button) {
		if (!(await confirmDelete("Litm.other.limit"))) return;
		const index = Number(button.dataset.id);
		const limits = this.system.limits;

		limits.splice(index, 1);
		this.actor.update({ "system.limits": limits });
	}

	async #removeThreat(button) {
		if (!(await confirmDelete("TYPES.Item.threat"))) return;
		const item = this.items.get(button.dataset.id);
		item.delete();
	}

	async #increase(target) {
		const attrib = target.dataset.name;
		const value = foundry.utils.getProperty(this.actor, attrib);

		return this.actor.update({ [attrib]: Math.min(value + 1, 5) });
	}

	async #decrease(target) {
		const attrib = target.dataset.name;
		const value = foundry.utils.getProperty(this.actor, attrib);

		return this.actor.update({ [attrib]: Math.max(value - 1, 1) });
	}

	#openItemSheet(button) {
		const item = this.items.get(button.dataset.id);
		item.sheet.render(true);
	}

	#sanitizeTags(formData) {
		if (!formData["system.tags"]) return formData;
		const re = CONFIG.litm.tagStringRe;
		const tags = formData["system.tags"].match(re);
		formData["system.tags"] = tags ? tags.join(" ") : "";

		return formData;
	}
}

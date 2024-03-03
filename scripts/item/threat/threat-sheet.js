export class ThreatSheet extends ItemSheet {
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

	/** @override */
	async getData() {
		const { data, ...rest } = super.getData();
		data.system.renderedConsequence = await TextEditor.enrichHTML(data.system.consequence);
		return {
			...rest,
			data,
			isEditing: this.isEditing,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-click]").click(this.#handleClick.bind(this));
		html
			.find("[data-input")
			.on("input", (event) => this.#handleInput(event))
			.on("blur", () => this._onSubmit(new Event("submit"), { shouldRerender: true }));
		if (this.isEditing)
			html.find("[contenteditable]:has(+#consequence)").focus();

	}

	async _onSubmit(formData, options = {}) {
		const res = await super._onSubmit(formData, options);
		if (!res['system.consequence']) return res;

		this.isEditing = false;

		const matches = res['system.consequence'].matchAll(CONFIG.litm.tagStringRe);

		// Delete existing tags and statuses
		await this.item.deleteEmbeddedDocuments("ActiveEffect", this.item.effects.map((e) => e._id));

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

		// Handle rerendering of sheet
		if (options.shouldRerender)
			return this.render();
		return res;
	}


	#handleClick(event) {
		event.preventDefault();
		const action = event.currentTarget.dataset.click;
		switch (action) {
			case "toggle-edit": {
				this.#toggleEdit();
			}
		}
	}

	#handleInput(event) {
		const t = event.currentTarget;
		const targetId = t.dataset.input;
		const value = t.innerText || t.value;
		const target = $(t).siblings(`input#${targetId}`);
		target.val(value);
	}

	#toggleEdit() {
		this.isEditing = !this.isEditing;
		return this.render();
	}
}

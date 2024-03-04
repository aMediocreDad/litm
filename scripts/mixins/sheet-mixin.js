export const SheetMixin = (Base) => class extends Base {
	isEditing = false;

	activateListeners(html) {
		super.activateListeners(html);

		html.find('[data-click]').on("click", this.#handleClick.bind(this));

		html.find("[data-size-input]")
			.attr('size', function () {
				return Math.max(this.value.length * 1.45 + 1, 6);
			})
			.on('input', this.#sizeInput.bind(this));

		html
			.find("[data-input")
			.on("input", (event) => this.#handleInput(event))
			.on("blur", () => this._onSubmit(new Event('submit'), { rerender: true }));
	}

	/** @override */
	async _onSubmit(event, options = {}) {
		this.isEditing = false;

		const res = await super._onSubmit(event, options);

		if (options.rerender) this.render();
		return res;
	}

	#handleInput(event) {
		const t = event.currentTarget;
		const targetId = t.dataset.input;
		const value = t.innerText || t.value;
		const target = $(t).siblings(`input#${targetId}`);
		target.val(value);
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

	#sizeInput(event) {
		const input = event.currentTarget;
		const size = input.value.length;
		input.size = Math.max(size * 1.45 + 1, 6);
	}

	#toggleEdit() {
		this.isEditing = !this.isEditing;
		return this.render();
	}
}

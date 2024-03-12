export class ToggledInput extends HTMLElement {
	#input = Object.assign(document.createElement("textarea"), {
		style: "resize: none;",
	});
	#renderedTags = Object.assign(document.createElement("div"), {
		class: "litm--sro",
		role: "presentation",
	});

	constructor() {
		super();
		this.#input.value = this.textContent;
		this.innerHTML = "";
		this.role = "textbox";
		this.appendChild(this.#input);
		this.appendChild(this.#renderedTags);
	}

	static get observedAttributes() {
		return ["editing"];
	}

	static Register() {
		customElements.define("litm-toggled-input", ToggledInput);
	}

	get eventListeners() {
		return [
			{
				event: "click",
				object: this,
				handler: () => {
					this.#input.focus();
					this.#input.setSelectionRange(
						this.#input.value.length,
						this.#input.value.length,
					);
				},
			},
			{
				event: "blur",
				object: this.#input,
				handler: () => {
					this.toggleAttribute("editing", false);
				},
			},
			{
				event: "keydown",
				object: window,
				handler: (event) => {
					if (event.key === "Shift") {
						this.toggleAttribute("editing", true);
					}
				},
			},
			{
				event: "keyup",
				object: window,
				handler: (event) => {
					if (event.key === "Shift" && document.activeElement !== this.#input)
						this.toggleAttribute("editing", false);
				},
			},
		];
	}

	connectedCallback() {
		this.#input.value ??= this.textContent;
		this.#input.name = this.getAttribute("name");
		this.removeAttribute("name");
		this.#renderTags();

		for (const { event, object, handler } of this.eventListeners)
			object.addEventListener(event, handler);
	}

	disconnectedCallback() {
		for (const { event, object, handler } of this.eventListeners)
			object.removeEventListener(event, handler);
	}

	attributeChangedCallback(name, _oldValue, newValue) {
		if (name === "editing") this.#renderTags(newValue !== null);
	}

	async #renderTags(editMode = false) {
		switch (editMode) {
			case true:
				this.#renderedTags.classList.add("litm--sro");
				this.#input.classList.remove("litm--sro");
				break;
			default: {
				const tags = await TextEditor.enrichHTML(this.#input.value);
				this.#renderedTags.innerHTML = tags;
				this.#input.classList.add("litm--sro");
				this.#renderedTags.classList.remove("litm--sro");
			}
		}
	}
}

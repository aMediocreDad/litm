export class SuperCheckbox extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ["value"];

	static Register() {
		customElements.define("litm-super-checkbox", SuperCheckbox);
	}

	#checkbox;
	#states = ["", "negative", "positive", "burned"];
	#state = 0;
	#value = this.#states[this.#state];
	#internals = this.attachInternals();

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
		<style>
			#multistate-checkbox {
				-webkit-appearance: none;
				flex: none;
				appearance: none;
				background-color: transparent;
				margin: 0;
				font: inherit;
				color: currentColor;
				height: 0.7em;
				width: 0.7em;
				border: 0.1em solid currentColor;
				border-radius: 0.25em;
				transform: translateY(0.025em);
				display: grid;
				place-items: center;
				grid-template-areas: "content";
				rotate: 45deg;

				&:is([role="checkbox"]) {
					cursor: pointer;
				}

				&:disabled {
					cursor: auto;
				}

				&::after {
					grid-area: content;
					content: "";
					width: 0.36em;
					height: 0.36em;
					scale: 0;
					transition: scale 120ms ease-in-out, rotate 120ms ease-in-out;
					box-shadow: inset 1em 1em var(--litm-color-accent);
				}

				&::before {
					grid-area: content;
					content: "";
					width: 0.36em;
					height: 0.36em;
					scale: 0;
					transition: scale 120ms ease-in-out;
					box-shadow: inset 1em 1em var(--litm-color-accent);
				}

				&[aria-checked="true"] {
					background-color: currentColor;

					&::after {
						scale: 1;
					}
				}

				&[data-state="negative"] {
					&::after {
						width: 0.62em;
						height: 0.15em;
						border-radius: 0.05em;
						rotate: -45deg;
						transition: scale 120ms ease-in-out;
					}
				}

				&[data-state="positive"] {
					&::before {
						content: "";
						width: 0.65em;
						height: 0.15em;
						border-radius: 0.05em;
						scale: 1;
						rotate: -45deg;
					}
					&::after {
						content: "";
						width: 0.65em;
						height: 0.15em;
						border-radius: 0.05em;
						rotate: 45deg;
					}
				}

				&[data-state="burned"] {
					&::after {
						position: relative;
						top: -0.035em;
						left: -0.045em;
						background: url(systems/litm/assets/media/burn.svg);
						box-shadow: none;
						background-size: cover;
						background-position: center;
						font-size: 2.6em;
						rotate: -45deg;
					}
				}
			}
		</style>
		<div id="multistate-checkbox" role="checkbox" aria-checked="false" tabindex="0">
		</div>
	`;
		this.#checkbox = this.shadowRoot.querySelector("#multistate-checkbox");
		this.addEventListener("click", this.#onClick.bind(this));
		this.#checkbox.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				this.#onClick();
			}
		});
	}

	get checked() {
		return this.#state > 0;
	}

	get value() {
		return this.#value;
	}

	set value(value) {
		this.#value = value;
		this.#internals.setFormValue(value);
		this.setAttribute("value", this.value);
	}

	get form() {
		return this.#internals.form;
	}

	get name() {
		return this.getAttribute("name");
	}

	get type() {
		return "checkbox";
	}

	connectedCallback() {
		this.#states = this.getAttribute("states")?.split(",") || this.#states;
		this.#state = this.#states.indexOf(this.getAttribute("value"));
		this.#updateState();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === "value") {
			this.#state = this.#states.indexOf(newValue);
			this.#updateState();
		}
	}

	#onClick() {
		this.#state = (this.#state + 1) % this.#states.length;
		this.#updateState();
		this.dispatchEvent(new Event("change"));
	}

	#updateState() {
		this.value = this.#states[this.#state];
		this.#checkbox.setAttribute("aria-checked", this.#state > 0);
		this.#checkbox.ariaLabel = this.#states[this.#state];
		this.#checkbox.dataset.state = this.#states[this.#state];
	}
}

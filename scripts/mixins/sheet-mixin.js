import { localize as t } from "../utils.js";

export const SheetMixin = (Base) =>
	class extends Base {
		isEditing = false;
		#currentScale = 1;

		activateListeners(html) {
			super.activateListeners(html);

			html.find("[data-click]").on("click", this.#handleClick.bind(this));

			html
				.find("[data-size-input]")
				.css("width", function () {
					return `${Math.ceil(Math.max(this.value.length * 1.5, 6))}ch`;
				})
				.on("input", this.#sizeInput.bind(this));

			html
				.find("[data-input")
				.on("input", (event) => this.#handleInput(event))
				.on("blur", () =>
					this._onSubmit(new Event("submit"), { rerender: true }),
				);
			html
				.find("[data-mousedown]")
				.on("mousedown", this.#handleMousedown.bind(this));
			html
				.closest(".app.window-app")
				.find(".litm--sheet-scale-button")
				.on("pointerdown", this.#scale.bind(this));
		}

		/** @override */
		async _onSubmit(event, options = {}) {
			this.isEditing = false;

			const res = await super._onSubmit(event, options);

			if (options.rerender) this.render();
			return res;
		}

		_getHeaderButtons() {
			const buttons = super._getHeaderButtons();

			buttons.unshift({
				class: "litm--sheet-scale-button",
				icon: "fas fa-arrows-alt-h",
				tooltip: t("Resize"),
				onclick: () => {},
			});

			return buttons;
		}

		renderRollDialog() {
			return ui.notifications.warn("Litm.ui.warn-not-supported", {
				localize: true,
			});
		}

		#handleInput(event) {
			const t = event.currentTarget;
			const targetId = t.dataset.input;
			const value = t.textContent || t.value;
			const target = $(t).siblings(`input#${targetId}`);
			target.val(value);
		}

		#handleMousedown(event) {
			const action = event.currentTarget.dataset.mousedown;
			switch (action) {
				case "scale": {
					this.#scale(event);
				}
			}
		}

		#handleClick(event) {
			const action = event.currentTarget.dataset.click;
			switch (action) {
				case "toggle-edit": {
					this.#toggleEdit();
				}
			}
		}

		#sizeInput(event) {
			const input = event.currentTarget;
			input.style.width = `${Math.ceil(Math.max(input.value.length * 1.5, 6))}ch`;
		}

		#toggleEdit() {
			this.isEditing = !this.isEditing;
			return this.render();
		}

		#scale(event) {
			event.preventDefault();
			event.stopPropagation();

			const eventNames =
				event.originalEvent.type === "pointerdown"
					? ["pointermove", "pointerup"]
					: ["mousemove", "mouseup"];

			const el = this.element;

			let previousX = event.screenX;
			let delta = 0;

			const clampValue = (current, delta) => {
				const value = current + delta / 500;
				return Math.max(0.3, Math.min(3, value));
			};

			const mousemove = (event) => {
				delta = event.screenX - previousX;
				previousX = event.screenX;
				this.#currentScale = clampValue(this.#currentScale, delta);

				el.css("transform", `scale(${this.#currentScale})`);
			};

			const mouseup = () => {
				document.removeEventListener(eventNames[0], mousemove);
				document.removeEventListener(eventNames[1], mouseup);

				this.setPosition({
					scale: this.#currentScale,
				});
			};

			document.addEventListener(eventNames[0], mousemove);
			document.addEventListener(eventNames[1], mouseup);
		}
	};

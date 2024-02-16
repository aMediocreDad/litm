export class LitmRollDialog extends FormApplication {
	#radioSelected = null;
	actorId = null;
	powerTags = [];
	weaknessTags = [];

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: "systems/litm/templates/apps/roll.html",
			classes: ["litm", "roll"],
			width: 450,
			height: 450,
			resizable: true,
			title: game.i18n.localize("Litm.ui.roll-title"),
		});
	}

	static create(actorId, powerTags, weaknessTags) {
		const app = new LitmRollDialog(actorId, powerTags, weaknessTags);
		return app.render(true);
	}

	static getFilteredArrayFromFormData(formData, key) {
		return Object.entries(formData).filter(([k, v]) => v && k.startsWith(key)).map(([key]) => key.split(".")[1]);
	}

	constructor(actorId, powerTags, weaknessTags, options) {
		super({}, options);
		this.actorId = actorId;
		this.powerTags = powerTags;
		this.weaknessTags = weaknessTags;
	}

	getData() {
		const data = super.getData();
		return {
			actorId: this.actorId,
			effects: CONFIG.litm.effects,
			powerTags: this.powerTags,
			weaknessTags: this.weaknessTags,
			...data,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find("input[type='radio'][name='burn']").click((event) => {
			const input = event.currentTarget;
			const value = input.value;
			const slug = value.split(".").pop();
			const sibling = html.find(`[name="power.${slug}"]`)

			if (input.checked && this.#radioSelected === value) {
				input.checked = false;
				this.#radioSelected = null;
			}
			else {
				this.#radioSelected = input.value;
				sibling.prop("checked", true);
			}
		});
		html.find("[data-click]").click((event) => {
			const button = event.currentTarget;
			const action = button.dataset.click;
			const id = button.dataset.id;

			switch (action) {
				case "increase":
					this.#increase(id);
					break;
				case "decrease":
					this.#decrease(id);
					break;
				case "cancel":
					this.close();
					break;
			}
		})
	}

	async _updateObject(_event, formData) {
		const { actorId, burn, effect, status, title, tracked, ...rest } = formData;
		const powerTags = LitmRollDialog.getFilteredArrayFromFormData(rest, "power");
		const weaknessTags = LitmRollDialog.getFilteredArrayFromFormData(rest, "weakness");

		const numPowerTags = powerTags.length;
		const numWeaknessTags = weaknessTags.length;
		const burnedValue = burn ? 2 : 0; // 1 + 2 = 3

		let effectData = null;
		if (tracked)
			effectData = Object.values(CONFIG.litm.effects).find((e) => !!e[effect])?.[effect];

		if (tracked && !effectData)
			ui.notifications.warn(game.i18n.localize("Litm.ui.warn-no-effect-found"));

		const total = numPowerTags + burnedValue + status - numWeaknessTags;
		const roll = new LitmRoll(`2d6 + ${total}`, {}, { actorId, burn: burn?.split(".").pop(), effectData, powerTags, weaknessTags, status, title });
		return roll.toMessage();
	}

	#increase(id) {
		const input = this.element.find(`#${id}`);
		const value = parseInt(input.val());
		input.val(value + 1);
	}

	#decrease(id) {
		const input = this.element.find(`#${id}`);
		const value = parseInt(input.val());
		input.val(value - 1);

	}
}

export class LitmRoll extends Roll {
	static CHAT_TEMPLATE = "systems/litm/templates/chat/roll.html";

	get litm() {
		return this.options
	}

	get actor() {
		return game.actors.get(this.litm.actorId);
	}

	get flavor() {
		return this.litm.effect?.title || game.i18n.localize("Litm.ui.roll-flavor");
	}

	get speaker() {
		return { alias: this.actor.name };
	}

	get powerTags() {
		const tags = this.litm.powerTags.map((tag) => this.actor.sheet.powerTags.find((t) => t.slug === tag)).filter(Boolean);
		return tags;
	}

	get weaknessTags() {
		const tags = this.litm.weaknessTags.map((tag) => this.actor.sheet.weaknessTags.find((t) => t.slug === tag)).filter(Boolean);
		return tags;
	}

	get burnedTag() {
		console.log(this.litm.burn);
		if (!this.litm.burn)
			return null;
		return this.actor.sheet.powerTags.find((tag) => tag.slug === this.litm.burn);
	}

	async render({ flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false } = {}) {
		if (!this._evaluated) await this.evaluate({ async: true });
		const chatData = {
			title: this.litm.title,
			formula: isPrivate ? "???" : this._formula.replace(/\s\+0/, ""),
			flavor: isPrivate ? null : flavor,
			user: game.user.id,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			data: isPrivate ? {} : this.getData(),
			total: isPrivate ? "?" : Math.round(this.total * 100) / 100
		};
		return renderTemplate(template, chatData);
	}

	getData() {
		const powerTags = this.powerTags;
		const weaknessTags = this.weaknessTags;
		const burn = this.burnedTag;
		const actor = this.actor;
		return {
			actor,
			powerTags,
			weaknessTags,
			burn,
		};
	}
}

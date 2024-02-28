import { getConfiggedEffect, sortTags } from "../utils.js";

export class LitmRollDialog extends FormApplication {
	#radioSelected = null;
	actorId = null;
	powerTags = [];
	weaknessTags = [];

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: "systems/litm/templates/apps/roll-dialog.html",
			classes: ["litm", "litm--roll"],
			width: 500,
			height: 540,
			resizable: true,
			title: game.i18n.localize("Litm.ui.roll-title"),
		});
	}

	static create(actorId, powerTags, weaknessTags) {
		const app = new LitmRollDialog(actorId, powerTags, weaknessTags);
		return app.render(true);
	}

	static getFilteredArrayFromFormData(formData, key) {
		return Object.entries(formData)
			.filter(([k, v]) => v && k.startsWith(key))
			.map(([key]) => key.split(".")[1]);
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
			powerTags: sortTags(this.powerTags),
			weaknessTags: sortTags(this.weaknessTags),
			...data,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		html
			.find("input[type='radio'][name='burn']")
			.click(this.#handleBurnToggleClick.bind(this));
		html.find("[data-click]").click(this.#handleClick.bind(this));
	}

	/**
	 * Receives the form data and performs the roll
	 * @param {Event} _event - The form submission event
	 * @param {Object} formData - The form data
	 */
	async _updateObject(_event, formData) {
		const { actorId, burn, effect, status, title, tracked, ...rest } = formData;
		const burnedTag = burn ? burn.split(".").pop() : null;
		const effectData = tracked ? getConfiggedEffect(effect) : null;
		const weaknessTags = LitmRollDialog.getFilteredArrayFromFormData(
			rest,
			"weakness",
		);
		const powerTags = LitmRollDialog.getFilteredArrayFromFormData(
			rest,
			"power",
		).filter((tag) => tag !== burnedTag);

		const weakness = weaknessTags.length;
		const power = powerTags.length;

		const totalPower = (burnedTag ? 3 : 0) + power + status - weakness;
		if (tracked && !effectData)
			ui.notifications.warn(game.i18n.localize("Litm.ui.warn-no-effect-found"));

		const roll = new game.litm.LitmRoll(
			`2d6 ${burn ? "+ @burnedTag" : ""} + @power + @status - @weakness`,
			{
				power,
				status,
				weakness,
				burnedTag: 3,
			},
			{
				actorId,
				burnedTag,
				effectData,
				powerTags,
				status,
				title,
				totalPower,
				tracked,
				weaknessTags,
			},
		);

		if (burnedTag) this.#burnActorTag(actorId, burnedTag);

		return roll.toMessage({
			flavor: title,
		});
	}

	#handleBurnToggleClick(event) {
		const input = event.currentTarget;
		const value = input.value;
		const id = value.split(".").pop();
		const sibling = $(`[name="power.${id}"]`);

		if (input.checked && this.#radioSelected === value) {
			input.checked = false;
			this.#radioSelected = null;
		} else {
			this.#radioSelected = input.value;
			sibling.prop("checked", true);
		}
	}

	#handleClick(event) {
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

	#burnActorTag(actorId, tagId) {
		try {
			const actor = game.actors.get(actorId);
			const tag = actor.system.powerTags.find((tag) => tag.id === tagId);

			if (!tag) throw new Error(`Tag: ${tagId} not found in ${actorId}.`);

			if (tag.type === "powerTag") {
				const theme = actor.items
					.find((theme) => theme.system.powerTags.find((t) => t.id === tag.id))
					?.toObject();
				const { powerTags } = theme.system;
				powerTags.find((t) => t.id === tag.id).isBurnt = true;
				return actor.updateEmbeddedDocuments("Item", [
					{ _id: theme._id, "system.powerTags": powerTags },
				]);
			}

			if (tag.type === "themeTag") {
				const theme = actor.items.find((theme) =>
					theme.system.allTags.find((t) => t.id === tag.id),
				);
				return actor.updateEmbeddedDocuments("Item", [
					{ _id: theme._id, "system.isBurnt": true },
				]);
			}

			// We assume it's a backpack tag a this point
			const backpack = actor.system.backpack;
			backpack.find((t) => t.id === tag.id).isBurnt = true;
			return actor.update({ "system.backpack": backpack });
		} catch (error) {
			console.error(error);
			ui.notifications.error(game.i18n.localize("Litm.ui.error-burning-tag"));
		}
	}
}

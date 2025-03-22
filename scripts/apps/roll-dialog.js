import { Sockets } from "../system/sockets.js";
import { sortTags, localize as t } from "../utils.js";

export class LitmRollDialog extends FormApplication {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/litm/templates/apps/roll-dialog.html",
			classes: ["litm", "litm--roll"],
			width: 500,
			height: "auto",
			resizable: true,
			title: game.i18n.localize("Litm.ui.roll-title"),
		});
	}

	static create({
		actorId,
		characterTags,
		speaker,
		tagState,
		shouldRoll,
		type,
		title,
		id,
	}) {
		return new LitmRollDialog(actorId, characterTags, {
			tagState,
			speaker,
			shouldRoll,
			type,
			title,
			id,
		});
	}

	static roll({ actorId, tags, title, type, speaker, modifier = 0 }) {
		// Separate tags
		const {
			burnedTags,
			powerTags,
			weaknessTags,
			positiveStatuses,
			negativeStatuses,
		} = LitmRollDialog.#filterTags(tags);

		// Values
		const {
			burnedValue,
			powerValue,
			weaknessValue,
			positiveStatusValue,
			negativeStatusValue,
			totalPower,
		} = game.litm.methods.calculatePower({
			burnedTags,
			powerTags,
			weaknessTags,
			positiveStatuses,
			negativeStatuses,
			modifier: Number(modifier) || 0,
		});

		const formula =
			typeof CONFIG.litm.roll.formula === "function"
				? CONFIG.litm.roll.formula({
						burnedTags,
						powerTags,
						weaknessTags,
						positiveStatuses,
						negativeStatuses,
						burnedValue,
						powerValue,
						weaknessValue,
						positiveStatusValue,
						negativeStatusValue,
						totalPower,
						actorId,
						type,
						title,
						modifier,
					})
				: CONFIG.litm.roll.formula ||
					"2d6 + (@burnedValue + @powerValue + @positiveStatusValue - @weaknessValue - @negativeStatusValue + @modifier)";

		// Roll
		const roll = new game.litm.LitmRoll(
			formula,
			{
				burnedValue,
				powerValue,
				positiveStatusValue,
				weaknessValue,
				negativeStatusValue,
				modifier: Number(modifier) || 0,
			},
			{
				actorId,
				title,
				type,
				burnedTags,
				powerTags,
				weaknessTags,
				positiveStatuses,
				negativeStatuses,
				speaker,
				totalPower,
				modifier,
			},
		);

		return roll
			.toMessage({
				speaker,
				flavor: title,
			})
			.then((res) => {
				// Reset roll dialog
				res.rolls[0]?.actor?.sheet.resetRollDialog();
				Sockets.dispatch("resetRollDialog", { actorId });
				return res;
			});
	}

	static calculatePower(tags) {
		const burnedValue = tags.burnedTags.length * 3;

		const powerValue = tags.powerTags.length;

		const weaknessValue = tags.weaknessTags.length;

		const positiveStatusValue = tags.positiveStatuses.reduce(
			(a, t) => a + Number.parseInt(t.value),
			0,
		);

		const negativeStatusValue = tags.negativeStatuses.reduce(
			(a, t) => a + Number.parseInt(t.value),
			0,
		);

		const modifier = Number(tags.modifier) || 0;

		const totalPower =
			burnedValue +
			powerValue +
			positiveStatusValue -
			weaknessValue -
			negativeStatusValue +
			modifier;

		return {
			burnedValue,
			powerValue,
			weaknessValue,
			positiveStatusValue,
			negativeStatusValue,
			totalPower,
			modifier,
		};
	}

	static #filterTags(tags) {
		const burnedTags = tags.filter((t) => t.state === "burned");
		const powerTags = tags.filter(
			(t) => t.type !== "status" && t.state === "positive",
		);
		const weaknessTags = tags.filter(
			(t) => t.type !== "status" && t.state === "negative",
		);
		const positiveStatuses = tags.filter(
			(t) => t.type === "status" && t.state === "positive",
		);
		const negativeStatuses = tags.filter(
			(t) => t.type === "status" && t.state === "negative",
		);

		return {
			burnedTags,
			powerTags,
			weaknessTags,
			positiveStatuses,
			negativeStatuses,
		};
	}

	#tagState = [];
	#shouldRoll = () => false;
	#modifier = 0;

	constructor(actorId, characterTags = [], options = {}) {
		super({}, options);

		this.#tagState = options.tagState || [];
		this.#shouldRoll = options.shouldRoll || (() => false);
		this.#modifier = options.modifier || 0;

		this.actorId = actorId;
		this.characterTags = characterTags;
		this.speaker =
			options.speaker || ChatMessage.getSpeaker({ actor: this.actor });
		this.rollName = options.title || LitmRollDialog.defaultOptions.title;
		this.type = options.type || "tracked";
	}

	get actor() {
		return game.actors.get(this.actorId);
	}

	get statuses() {
		const { tags } = game.litm.storyTags;
		const statuses = tags.filter((tag) => tag.values.some((v) => !!v));
		return [...statuses, ...this.actor.system.statuses].map((tag) => ({
			...tag,
			state: this.#tagState.find((t) => t.id === tag.id)?.state || "",
			states: ",negative,positive",
		}));
	}

	get tags() {
		const { tags } = game.litm.storyTags;
		return [
			...tags.filter((tag) => tag.values.every((v) => !v)),
			...this.actor.system.storyTags,
		].map((tag) => ({
			...tag,
			state: this.#tagState.find((t) => t.id === tag.id)?.state || "",
			states: ",negative,positive,burned",
		}));
	}

	get gmTags() {
		if (!game.user.isGM) return [];

		const { actors } = game.litm.storyTags;
		const tags = actors
			.filter((actor) => actor.id !== this.actorId)
			.flatMap((actor) => actor.tags);
		return tags
			.map((tag) => ({
				...tag,
				state: this.#tagState.find((t) => t.id === tag.id)?.state || "",
				states:
					tag.type === "tag"
						? ",negative,positive,burned"
						: ",negative,positive",
			}))
			.filter((tag) => tag.state !== "");
	}

	get totalPower() {
		const state = [...this.#tagState, ...this.characterTags];
		const tags = LitmRollDialog.#filterTags(state);
		const { totalPower } = LitmRollDialog.calculatePower({
			...tags,
			modifier: this.#modifier,
		});
		return totalPower;
	}

	getData() {
		const data = super.getData();
		const skipModeration = this.#shouldRoll();
		return {
			...data,
			actorId: this.actorId,
			characterTags: sortTags(this.characterTags),
			rollTypes: {
				quick: "Litm.ui.roll-quick",
				tracked: "Litm.ui.roll-tracked",
				mitigate: "Litm.ui.roll-mitigate",
			},
			skipModeration,
			statuses: sortTags(this.statuses),
			tags: sortTags(this.tags),
			gmTags: sortTags(this.gmTags),
			isGM: game.user.isGM,
			title: this.rollName,
			type: this.type,
			totalPower: this.totalPower,
			modifier: this.#modifier,
		};
	}

	activateListeners(html) {
		super.activateListeners(html);

		html
			.find("[data-click]")
			.on("click", this.#handleClick.bind(this))
			.on("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ")
					this.#handleClick(event);
			});

		html
			.find("litm-super-checkbox")
			.on("change", this.#handleCheckboxChange.bind(this));

		html
			.find("[data-update='modifier']")
			.on("change", this.#handleModifierChange.bind(this));
	}

	addTag(tag, toBurn) {
		tag.state =
			tag.type === "weaknessTag" ? "negative" : toBurn ? "burned" : "positive";
		tag.states = tag.type === "weaknessTag" ? ",negative" : ",positive,burned";

		this.characterTags.push(tag);
		this.element.find("[data-update='totalPower']").text(this.totalPower);
		this.#dispatchUpdate();
	}

	removeTag(tag) {
		this.characterTags = this.characterTags.filter((t) => t.id !== tag.id);
		this.element.find("[data-update='totalPower']").text(this.totalPower);
		this.#dispatchUpdate();
	}

	getFilteredArrayFromFormData(formData) {
		const allTags = [...this.#tagState, ...this.characterTags];
		return Object.entries(formData)
			.filter(([_, v]) => !!v)
			.map(([key]) => allTags.find((t) => t.id === key));
	}

	reset() {
		this.characterTags = [];
		this.#tagState = [];
		this.#modifier = 0;
		this.#shouldRoll = () => game.settings.get("litm", "skip_roll_moderation");
		if (this.actor.sheet.rendered) this.actor.sheet.render(true);
	}

	/**
	 * Receives the form data and performs the roll
	 * @param {Event} _event - The form submission event
	 * @param {Object} formData - The form data
	 */
	async _updateObject(_event, formData) {
		const { actorId, title, type, shouldRoll, modifier, ...rest } = formData;
		const tags = this.getFilteredArrayFromFormData(rest);

		const data = {
			actorId,
			type,
			tags,
			title,
			speaker: this.speaker,
			modifier,
		};

		this.#shouldRoll = () => shouldRoll;
		// User has authority to initiate the roll
		if (this.#shouldRoll()) return LitmRollDialog.roll(data);
		// Else create a moderation request
		return this.#createModerationRequest(data);
	}

	#handleClick(event) {
		const button = event.currentTarget;
		const action = button.dataset.click;

		switch (action) {
			case "add-tag": {
				this.actor.sheet.render(true);
				break;
			}
			case "cancel":
				this.close();
				break;
		}
	}

	#handleCheckboxChange(event) {
		const checkbox = event.currentTarget;
		const { name: id, value } = checkbox;
		const { type } = checkbox.dataset;

		switch (type) {
			case "powerTag":
			case "themeTag":
			case "backpack":
			case "weaknessTag": {
				const tag = this.characterTags.find((t) => t.id === id);
				tag.state = value;
				break;
			}
			default: {
				const existingTag = this.#tagState.find((t) => t.id === id);
				if (existingTag) existingTag.state = value;
				else {
					const tag = [...this.tags, ...this.statuses, ...this.gmTags].find(
						(t) => t.id === id,
					);
					this.#tagState.push({
						...tag,
						state: value,
					});
				}
			}
		}

		this.element.find("[data-update='totalPower']").text(this.totalPower);
		this.#dispatchUpdate();
	}

	#handleModifierChange(event) {
		const input = event.currentTarget;
		this.#modifier = Number(input.value) || 0;
		this.element.find("[data-update='totalPower']").text(this.totalPower);
		this.#dispatchUpdate();
	}

	async #createModerationRequest(data) {
		const id = foundry.utils.randomID();
		const userId = game.user.id;
		const tags = LitmRollDialog.#filterTags(data.tags);
		const { totalPower } = game.litm.methods.calculatePower({
			...tags,
			modifier: data.modifier,
		});
		const recipients = Object.entries(this.actor.ownership)
			.filter((u) => u[1] === 3 && u[0] !== "default")
			.map((u) => u[0]);

		ChatMessage.create({
			content: await renderTemplate(
				"systems/litm/templates/chat/moderation.html",
				{
					title: t("Litm.ui.roll-moderation"),
					id: this.actor.id,
					rollId: id,
					type: data.type,
					name: this.actor.name,
					tooltipData: {
						...tags,
						modifier: data.modifier,
					},
					totalPower,
				},
			),
			whisper: recipients,
			flags: { litm: { id, userId, data } },
		});
	}

	#dispatchUpdate() {
		Sockets.dispatch("updateRollDialog", {
			actorId: this.actorId,
			characterTags: this.characterTags,
			tagState: this.#tagState,
			modifier: this.#modifier,
		});
	}

	async receiveUpdate({ characterTags, tagState, actorId, modifier }) {
		if (actorId !== this.actorId) return;

		if (characterTags) this.characterTags = characterTags;
		if (tagState) this.#tagState = tagState;
		if (modifier !== undefined) this.#modifier = modifier;

		if (this.actor.sheet.rendered) this.actor.sheet.render();
		if (this.rendered) this.render();
	}
}

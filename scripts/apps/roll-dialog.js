import { dispatch, gmModeratedRoll, sortTags } from "../utils.js";

export class LitmRollDialog extends FormApplication {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: "systems/litm/templates/apps/roll-dialog.html",
			classes: ["litm", "litm--roll"],
			width: 500,
			height: 540,
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

	static roll({ actorId, tags, title, type, speaker }) {
		// Separate tags
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

		// Values
		const burnedValue = burnedTags.length * 3;
		const powerValue = powerTags.length;
		const weaknessValue = weaknessTags.length;
		const positiveStatusValue = positiveStatuses.reduce(
			(a, t) => a + Number.parseInt(t.value),
			0,
		);
		const negativeStatusValue = negativeStatuses.reduce(
			(a, t) => a + Number.parseInt(t.value),
			0,
		);
		const totalPower =
			burnedValue +
			powerValue +
			positiveStatusValue -
			weaknessValue -
			negativeStatusValue;

		// Roll
		const roll = new game.litm.LitmRoll(
			"2d6 + @burnedValue + @powerValue + @positiveStatusValue - @weaknessValue - @negativeStatusValue",
			{
				burnedValue,
				powerValue,
				positiveStatusValue,
				weaknessValue,
				negativeStatusValue,
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
				return res;
			});
	}

	#rollId = null;
	#tagState = [];
	#shouldRoll = () => false;

	constructor(actorId, characterTags = [], options = {}) {
		super({}, options);

		this.#tagState = options.tagState || [];
		this.#shouldRoll = options.shouldRoll || (() => false);

		this.actorId = actorId || null;
		this.characterTags = characterTags;
		this.speaker =
			options.speaker || ChatMessage.getSpeaker({ actor: this.actor });
		this.rollName = options.title || LitmRollDialog.defaultOptions.title;
		this.type = options.type || "tracked";
		this.#rollId = options.id;
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
		return tags.map((tag) => ({
			...tag,
			state: this.#tagState.find((t) => t.id === tag.id)?.state || "",
			states:
				tag.type === "tag" ? ",negative,positive,burned" : ",negative,positive",
		}));
	}

	get totalPower() {
		const burnedTags = [...this.#tagState, ...this.characterTags].filter(
			(t) => t.state === "burned",
		).length;
		const powerTags = [
			...this.#tagState.filter((t) => t.type === "tag"),
			...this.characterTags,
		].filter((t) => t.state === "positive").length;
		const weaknessTags = [
			...this.#tagState.filter((t) => t.type === "tag"),
			...this.characterTags,
		].filter((t) => t.state === "negative").length;
		const positiveStatuses = this.#tagState
			.filter((t) => t.type === "status" && t.state === "positive")
			.reduce((a, t) => a + Number.parseInt(t.value), 0);
		const negativeStatuses = this.#tagState
			.filter((t) => t.type === "status" && t.state === "negative")
			.reduce((a, t) => a + Number.parseInt(t.value), 0);

		return (
			burnedTags * 3 +
			powerTags +
			positiveStatuses -
			weaknessTags -
			negativeStatuses
		);
	}

	getData() {
		const data = super.getData();
		return {
			...data,
			actorId: this.actorId,
			characterTags: sortTags(this.characterTags),
			rollTypes: {
				quick: "Litm.ui.roll-quick",
				tracked: "Litm.ui.roll-tracked",
				mitigate: "Litm.effects.mitigate.key",
			},
			statuses: sortTags(this.statuses),
			tags: sortTags(this.tags),
			gmTags: sortTags(this.gmTags),
			isGM: game.user.isGM,
			title: this.rollName,
			type: this.type,
			totalPower: this.totalPower,
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
	}

	addTag(tag, toBurn) {
		tag.state =
			tag.type === "weaknessTag" ? "negative" : toBurn ? "burned" : "positive";
		tag.states = tag.type === "weaknessTag" ? ",negative" : ",positive,burned";
		this.characterTags.push(tag);
	}

	removeTag(tag) {
		this.characterTags = this.characterTags.filter((t) => t.id !== tag.id);
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
		this.#shouldRoll = () => game.user.isGM;
		if (this.actor.sheet.rendered) this.actor.sheet.render(true);
	}

	/**
	 * Receives the form data and performs the roll
	 * @param {Event} _event - The form submission event
	 * @param {Object} formData - The form data
	 */
	async _updateObject(_event, formData) {
		const { actorId, title, type, ...rest } = formData;
		const tags = this.getFilteredArrayFromFormData(rest);

		const data = {
			actorId,
			type,
			tags,
			title,
			speaker: this.speaker,
		};

		if (!game.user.isGM) {
			ui.notifications.info("Litm.ui.roll-moderated", { localize: true });
			return gmModeratedRoll({ ...data, shouldRoll: false }, (data) =>
				LitmRollDialog.roll(data),
			);
		}

		if (this.#shouldRoll()) return LitmRollDialog.roll(data);
		dispatch({ app: data, type: "roll", id: this.#rollId });
		return this.reset();
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
	}
}

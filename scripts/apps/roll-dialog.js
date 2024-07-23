import { Sockets } from "../system/sockets.js";
import { sortTags, localize as t } from "../utils.js";

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
		} = LitmRollDialog.#calculateTotalPower({
			burnedTags,
			powerTags,
			weaknessTags,
			positiveStatuses,
			negativeStatuses,
		});

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
				Sockets.dispatch("resetRollDialog", { actorId });
				return res;
			});
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

	static #calculateTotalPower(tags) {
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

		const totalPower =
			burnedValue +
			powerValue +
			positiveStatusValue -
			weaknessValue -
			negativeStatusValue;

		return {
			burnedValue,
			powerValue,
			weaknessValue,
			positiveStatusValue,
			negativeStatusValue,
			totalPower,
		};
	}

	#rollId = null;
	#tagState = [];
	#shouldRoll = () => false;

	constructor(actorId, characterTags = [], options = {}) {
		super({}, options);

		this.#tagState = options.tagState || [];
		this.#shouldRoll = options.shouldRoll || (() => false);

		this.actorId = actorId;
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
			.filter((tag) => game.user.isGM || tag.state !== "");
	}

	get totalPower() {
		const state = [...this.#tagState, ...this.characterTags];
		const tags = LitmRollDialog.#filterTags(state);
		const { totalPower } = LitmRollDialog.#calculateTotalPower(tags);
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
		this.#shouldRoll = () => game.settings.get("litm", "skip_roll_moderation");
		if (this.actor.sheet.rendered) this.actor.sheet.render(true);
	}

	/**
	 * Receives the form data and performs the roll
	 * @param {Event} _event - The form submission event
	 * @param {Object} formData - The form data
	 */
	async _updateObject(_event, formData) {
		const { actorId, title, type, shouldRoll, ...rest } = formData;
		const tags = this.getFilteredArrayFromFormData(rest);

		const data = {
			actorId,
			type,
			tags,
			title,
			speaker: this.speaker,
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

	async #createModerationRequest(data) {
		const id = foundry.utils.randomID();
		this.#rollId = id;
		const userId = game.user.id;
		const tags = LitmRollDialog.#filterTags(data.tags);
		const { totalPower } = LitmRollDialog.#calculateTotalPower(tags);
		const recipients = Object.entries(this.actor.ownership)
			.filter((u) => u[1] === 3 && u[0] !== "default")
			.map((u) => u[0]);

		ChatMessage.create({
			content: await renderTemplate(
				"systems/litm/templates/chat/moderation.html",
				{
					title: t("Litm.ui.roll-moderation"),
					rollId: id,
					type: data.type,
					name: this.actor.name,
					tags,
					totalPower,
				},
			),
			type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
			whisper: recipients,
			flags: { litm: { id, userId, data } },
		});
	}

	#dispatchUpdate() {
		Sockets.dispatch("updateRollDialog", {
			actorId: this.actorId,
			characterTags: this.characterTags,
			tagState: this.#tagState,
		});
	}

	async receiveUpdate({ characterTags, tagState, actorId }) {
		if (actorId !== this.actorId) return;

		if (characterTags) this.characterTags = characterTags;
		if (tagState) this.#tagState = tagState;

		if (this.actor.sheet.rendered) this.actor.sheet.render();
		if (this.rendered) this.render();
	}
}

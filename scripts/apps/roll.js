export class LitmRoll extends Roll {
	static CHAT_TEMPLATE = "systems/litm/templates/chat/message.html";
	static TOOLTIP_TEMPLATE = "systems/litm/templates/chat/message-tooltip.html";

	get litm() {
		return this.options;
	}

	get actor() {
		return game.actors.get(this.litm.actorId);
	}

	get speaker() {
		return { alias: this.actor.name };
	}

	get flavor() {
		if (!this.effect) return game.i18n.localize("Litm.ui.roll-quick");
		return game.i18n.localize(`Litm.effects.${this.effect.name}.key`);
	}

	get power() {
		if (!this.effect) return null;
		if (this.total < 7) return 0;

		let totalPower = Math.max(this.litm.totalPower, 1);
		if (this.total < 10) return totalPower;
		if (this.effect?.name === "mitigate") totalPower += 1;

		return totalPower;
	}

	get powerTags() {
		const tags = this.litm.powerTags
			.map((tag) =>
				this.actor.system.powerTags.find((t) => t.id === tag)?.toObject(),
			)
			.filter(Boolean);
		return tags;
	}

	get weaknessTags() {
		const tags = this.litm.weaknessTags
			.map((tag) =>
				this.actor.system.weaknessTags.find((t) => t.id === tag)?.toObject(),
			)
			.filter(Boolean);
		return tags;
	}

	get burnedTag() {
		if (!this.litm.burnedTag) return null;
		return this.actor.system.allTags.find((tag) => tag.id === this.litm.burnedTag);
	}

	get outcome() {
		const total = this.total;
		if (total >= 10)
			return { label: "success", description: "Litm.ui.roll-success" };
		if (total >= 7)
			return { label: "consequence", description: "Litm.ui.roll-consequence" };
		return { label: "failure", description: "Litm.ui.roll-failure" };
	}

	get effect() {
		if (!this.litm.tracked) return null;
		return this.litm.effectData;
	}

	async render({
		template = this.constructor.CHAT_TEMPLATE,
		isPrivate = false,
	} = {}) {
		if (!this._evaluated) await this.evaluate({ async: true });
		const chatData = {
			actor: this.actor,
			effect: this.effect,
			formula: isPrivate ? "???" : this._formula.replace(/\s\+0/, ""),
			flavor: isPrivate ? null : this.flavor,
			outcome: isPrivate ? "???" : this.outcome,
			power: isPrivate ? "???" : this.power,
			result: isPrivate ? "???" : this.result,
			title: this.litm.title,
			tooltip: isPrivate ? "" : await this.getTooltip(),
			total: isPrivate ? "" : Math.round(this.total * 100) / 100,
			user: game.user.id,
		};
		return renderTemplate(template, chatData);
	}

	async getTooltip() {
		const parts = this.dice.map((d) => d.getTooltipData());
		const data = this.getTooltipData();
		return renderTemplate(LitmRoll.TOOLTIP_TEMPLATE, { data, parts });
	}

	getTooltipData() {
		return {
			burnedTag: this.burnedTag,
			mitigate: this.effect?.name === "mitigate",
			powerTags: this.powerTags,
			status: this.litm.status,
			weaknessTags: this.weaknessTags,
		};
	}
}

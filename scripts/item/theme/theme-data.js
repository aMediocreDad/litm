import { localize as t, titleCase } from "../../utils.js";

export class ThemeData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		const abstract = game.litm.data;
		return {
			themebook: new fields.StringField({
				initial: t("Litm.other.themebook"),
			}),
			level: new fields.StringField({
				initial: Object.keys(CONFIG.litm.theme_levels)[0],
				validate: (level) =>
					Object.keys(CONFIG.litm.theme_levels).includes(level),
			}),
			isActive: new fields.BooleanField({
				initial: true,
			}),
			isBurnt: new fields.BooleanField(),
			powerTags: new fields.ArrayField(
				new fields.EmbeddedDataField(abstract.TagData),
				{
					initial: () =>
						Array(5)
							.fill()
							.map((_, i) => ({
								id: foundry.utils.randomID(),
								name: `${i < 2 ? `${t("Litm.ui.name-power")}` : ""}`,
								type: "powerTag",
								isActive: i < 2,
								isBurnt: false,
							})),
					validate: (tags) => tags.length === 5,
				},
			),
			weaknessTags: new fields.ArrayField(
				new fields.EmbeddedDataField(abstract.TagData),
				{
					initial: () => [
						{
							id: foundry.utils.randomID(),
							name: t("Litm.ui.name-weakness"),
							isActive: true,
							isBurnt: false,
							type: "weaknessTag",
						},
					],
					validate: (tags) => tags.length === 1,
				},
			),
			experience: new fields.NumberField({
				integer: true,
				min: 0,
				initial: 0,
				max: 3,
			}),
			decay: new fields.NumberField({
				integer: true,
				min: 0,
				initial: 0,
				max: 3,
			}),
			motivation: new fields.StringField({
				initial: t("Litm.ui.name-motivation"),
			}),
			note: new fields.HTMLField({
				initial: t("Litm.ui.name-note"),
			}),
		};
	}

	get themeTag() {
		const item = {
			id: this.parent._id,
			name: titleCase(this.parent.name),
			isActive: this.isActive,
			isBurnt: this.isBurnt,
			type: "themeTag",
		};
		return game.litm.data.TagData.fromSource(item);
	}

	get activatedPowerTags() {
		const powerTags = this.powerTags;
		const themeTag = this.themeTag;
		return [...powerTags, themeTag].filter((tag) => tag.isActive);
	}

	get availablePowerTags() {
		return this.activatedPowerTags.filter((tag) => !tag.isBurnt);
	}

	get powerTagRatio() {
		return this.availablePowerTags.length / this.activatedPowerTags.length;
	}

	get weakness() {
		return this.weaknessTags[0];
	}

	get allTags() {
		return [...this.weaknessTags, ...this.powerTags, this.themeTag];
	}

	get levels() {
		return Object.keys(CONFIG.litm.theme_levels);
	}

	get themebooks() {
		return CONFIG.litm.theme_levels[this.level];
	}
}

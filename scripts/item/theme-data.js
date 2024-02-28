import { titleCase } from "../utils.js";

export class ThemeData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		const abstract = game.litm.data;
		return {
			themebook: new fields.StringField({
				initial: "THEMEBOOK",
			}),
			level: new fields.StringField({
				initial: "LEVEL",
			}),
			isActive: new fields.BooleanField({
				initial: true,
			}),
			isBurnt: new fields.BooleanField(),
			powerTags: new fields.ArrayField(
				new fields.EmbeddedDataField(abstract.TagData),
			),
			weaknessTags: new fields.ArrayField(
				new fields.EmbeddedDataField(abstract.TagData)
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
				initial: "Write down your Motivation.",
			}),
			note: new fields.HTMLField({
				initial: "Give your Theme a description.",
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
}

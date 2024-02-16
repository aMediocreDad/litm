
export class ThemeData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
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
			powerTags: new fields.ArrayField(new fields.SchemaField({
				name: new fields.StringField(),
				isActive: new fields.BooleanField(),
				isBurnt: new fields.BooleanField(),
			}), {
				initial: Array(5).fill().map((_, i) => ({ name: "Name your Power", isActive: i < 2 ? true : false, isBurnt: false }))
			}),
			weaknessTags: new fields.ArrayField(new fields.StringField(), {
				initial: ["Name your Weakness"]
			}),
			experience: new fields.NumberField({ integer: true, min: 0, initial: 0, max: 3 }),
			decay: new fields.NumberField({ integer: true, min: 0, initial: 0, max: 3 }),
			motivation: new fields.StringField({
				initial: "Write down your Motivation.",
			}),
			note: new fields.HTMLField({
				initial: "Give your Theme a description.",
			}),
		};
	}
}

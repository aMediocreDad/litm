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
				{
					initial: Array(5)
						.fill()
						.map((_, i) => ({
							name: "Name your tag",
							type: "powerTag",
							isActive: i < 2,
							id: randomID(),
						}),
						),
					validate: (tags) => Object.keys(tags).length === 5,
				}
			),
			weaknessTags: new fields.ArrayField(
				new fields.EmbeddedDataField(abstract.TagData),
				{
					initial: [
						{
							name: "Name your Weakness",
							type: "weaknessTag",
							isActive: true,
							isBurnt: false,
							id: randomID()
						}
					],
					validate: (tags) => Object.keys(tags).length === 1,
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
				initial: "Write down your Motivation.",
			}),
			note: new fields.HTMLField({
				initial: "Give your Theme a description.",
			}),
		};
	}
}

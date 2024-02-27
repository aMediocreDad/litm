export class TagData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.StringField({
				required: true,
				nullable: false,
			}),
			name: new fields.StringField({
				required: true,
				nullable: false,
				validate: (name) => name.length > 2,
			}),
			isActive: new fields.BooleanField({
				required: true,
				initial: false,
			}),
			isBurnt: new fields.BooleanField({
				required: true,
				initial: false,
			}),
			type: new fields.StringField({
				required: true,
				nullable: false,
				initial: "backpack",
				choices: ["weaknessTag", "powerTag", "backpack", "themeTag"],
			}),
		};
	}
}

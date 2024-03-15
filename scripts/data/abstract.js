export class TagData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			id: new fields.StringField({
				required: true,
				nullable: false,
				validate: (id) => foundry.data.validators.isValidId(id),
				initial: () => foundry.utils.randomID(),
			}),
			name: new fields.StringField({
				required: true,
				nullable: false,
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
				choices: ["weaknessTag", "powerTag", "backpack", "themeTag"],
			}),
		};
	}
}

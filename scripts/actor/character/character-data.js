export class CharacterData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			note: new fields.HTMLField(),
			backpack: new fields.ArrayField(
				new fields.SchemaField({
					name: new fields.StringField(),
					isActive: new fields.BooleanField(),
					isBurnt: new fields.BooleanField(),
				})
			)
		}
	};
}

export class ChallengeData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			category: new fields.StringField(),
			rating: new fields.NumberField({ required: true, initial: 1, min: 1, max: 5 }),
			note: new fields.HTMLField(),
			special: new fields.HTMLField(),
			limits: new fields.ArrayField(new fields.SchemaField({ name: new fields.StringField(), value: new fields.NumberField() })),
			tags: new fields.StringField(),
		}
	}
}

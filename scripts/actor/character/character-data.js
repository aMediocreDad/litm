export class CharacterData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		const data = game.litm.data;
		return {
			note: new fields.HTMLField(),
			backpack: new fields.ArrayField(
				new fields.EmbeddedDataField(data.TagData),
			),
		};
	}

	get allTags() {
		const backpack = this.backpack;
		const themeTags = this.parent.items
			.filter((item) => item.type === "theme")
			.flatMap((item) => item.system.allTags);
		return [...backpack, ...themeTags];
	}

	get powerTags() {
		return this.allTags.filter(
			(tag) => tag.type === "powerTag" || tag.type === "themeTag" || tag.type === "backpack",
		);
	}

	get weaknessTags() {
		return this.parent.items
			.filter((item) => item.type === "theme")
			.flatMap((item) => item.system.weakness);
	}

	get availablePowerTags() {
		const backpack = this.backpack.filter(
			(tag) => tag.isActive && !tag.isBurnt,
		);
		const themeTags = this.parent.items
			.filter((item) => item.type === "theme")
			.flatMap((item) => item.system.availablePowerTags);
		return [...backpack, ...themeTags];
	}
}

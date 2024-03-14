import { error } from "../../logger.js";
export class CharacterData extends foundry.abstract.DataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			note: new fields.HTMLField(),
		};
	}

	static cleanData(...args) {
		// I absolutely brought this on myself
		const { backpack } = args[0] || {};
		if (backpack && Array.isArray(backpack))
			args[1].source.items.push({
				type: "backpack",
				name: "Backpack",
				system: { contents: args[0].backpack },
			});
		return super.cleanData(...args);
	}

	get backpack() {
		const backpack = this.parent.items.find((item) => item.type === "backpack");
		if (!backpack) return [];
		return backpack.system.contents;
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
			(tag) =>
				tag.type === "powerTag" ||
				tag.type === "themeTag" ||
				tag.type === "backpack",
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

	async prepareDerivedData() {
		// Make sure only four themes are present
		const themes = this.parent.items.filter((item) => item.type === "theme");
		if (themes.length > 4) {
			error("Too many themes found, attempting to resolve...");
			console.error(`Too many themes found for: ${this.parent._id}`, themes);
			const toDelete = themes.slice(4);
			await this.parent.deleteEmbeddedDocuments(
				"Item",
				toDelete.map((item) => item._id),
			);
		}

		// Make sure only one backpack is present
		const backpacks = this.parent.items.filter(
			(item) => item.type === "backpack",
		);
		if (backpacks.length > 1) {
			error("Too many backpacks found, attempting to resolve...");
			console.error(
				`Too many backpacks found for: ${this.parent._id}`,
				backpacks,
			);
			const toDelete = backpacks.slice(1);
			await this.parent.deleteEmbeddedDocuments(
				"Item",
				toDelete.map((item) => item._id),
			);
		}

		// Validate unique data ids
		// Get duplicates
		const duplicates = this.allTags
			.map((tag) => tag.id)
			.filter((id, index, arr) => arr.indexOf(id) !== index);
		if (!duplicates.length) return;
		error("Duplicate tag IDs found, attempting to resolve...");
		console.error(
			`Duplicate tag IDs found for: ${this.parent._id}`,
			duplicates,
		);

		// try to fix duplicates
		const tags = this.allTags;
		for (const tag of tags) {
			if (duplicates.includes(tag.id)) {
				tag.id = randomID();
			}
		}
	}
}

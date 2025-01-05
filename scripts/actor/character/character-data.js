import { error, warn } from "../../logger.js";

export class CharacterData extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const fields = foundry.data.fields;
		return {
			experience: new fields.NumberField(),
			note: new fields.HTMLField(),
			specials: new fields.StringField({ isArray: true }),
		};
	}

	static getTrackableAttributes() {
		return {
			bar: ["limit"],
			value: [],
		};
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

	get statuses() {
		return this.parent.appliedEffects
			.filter((item) => item.getFlag("litm", "values")?.some((v) => !!v))
			.map((item) => {
				return {
					...item.flags.litm,
					type: "status",
					value: item.flags.litm.values.findLast((v) => !!v),
					id: item._id,
					name: item.name,
				};
			});
	}

	get storyTags() {
		return this.parent.appliedEffects
			.filter((item) => item.getFlag("litm", "values")?.every((v) => !v))
			.map((item) => {
				return {
					...item.flags.litm,
					type: "tag",
					value: item.flags.litm.values.findLast((v) => !!v),
					id: item._id,
					name: item.name,
				};
			});
	}

	get limit() {
		return {
			label: "Litm.other.limit",
			value:
				6 - (this.statuses.sort((a, b) => b.value - a.value)[0]?.value || 0),
			max: 6,
		};
	}

	async prepareDerivedData() {
		// Make sure only four themes are present
		// const themes = this.parent.items.filter((item) => item.type === "theme");
		// if (themes.length > 4) {
		// 	warn(
		// 		`Too many themes found for ${this.parent.name}, attempting to resolve...`,
		// 	);
		// 	const toDelete = themes.slice(4);
		// 	await this.parent.deleteEmbeddedDocuments(
		// 		"Item",
		// 		toDelete.map((item) => item._id),
		// 	);
		// }

		// Make sure only one backpack is present
		const backpacks = this.parent.items.filter(
			(item) => item.type === "backpack",
		);
		if (backpacks.length > 1) {
			warn(
				`Too many backpacks found for ${this.parent.name}, attempting to resolve...`,
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
		warn("Duplicate tag IDs found, attempting to resolve...");
		error(`Duplicate tag IDs found for: ${this.parent._id}`, duplicates);

		// try to fix duplicates
		const tags = this.allTags;
		for (const tag of tags) {
			if (duplicates.includes(tag.id)) {
				tag.id = foundry.utils.randomID();
			}
		}
	}
}

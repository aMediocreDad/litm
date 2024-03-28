import { localize as t } from "../utils.js";

function createTag(data, type) {
	return {
		...(data || { name: "", isBurnt: false, isActive: false }),
		type,
		id: foundry.utils.randomID(),
	};
}

function createStatus(data) {
	if (typeof data === "string")
		return {
			name: data,
			type: "ActiveEffect",
			flags: {
				litm: {
					type: "tag",
					values: Array(6).fill(null),
					value: "",
					isBurnt: false,
				},
			},
		};

	const values =
		data.level?.map((level, i) => (level ? (i + 1).toString() : null)) ||
		Array(6).fill(null);
	const value = values.findLast((level) => level) || "";
	const type = value ? "status" : "tag";

	return {
		name: data.name || t("Litm.other.unnamed"),
		type: "ActiveEffect",
		flags: {
			litm: {
				type,
				values,
				value,
				isBurnt: false,
			},
		},
	};
}

export async function importCharacter(data) {
	if (data.compatibility && !["litm", "empty"].includes(data.compatibility))
		return ui.notifications.warn("Litm.ui.warn-incompatible-data", {
			localize: true,
		});

	const themeData = Object.entries(data)
		.filter(
			([key, theme]) =>
				key.startsWith("theme") &&
				typeof theme === "object" &&
				!Array.isArray(theme) &&
				!theme.isEmpty,
		)
		.map(([_, theme]) => ({
			name:
				theme.content.mainTag.name ||
				t("Litm.other.unnamed", "TYPES.Item.theme"),
			type: "theme",
			system: {
				themebook: theme.content.themebook,
				level: theme.content.level?.toLowerCase(),
				isActive: theme.content.mainTag.isActive,
				isBurnt: theme.content.mainTag.isBurnt,
				powerTags: Array(5)
					.fill()
					.map((_, i) => createTag(theme.content.powerTags[i], "powerTag")),
				weaknessTags: [
					createTag(
						{
							name: theme.content.weaknessTags[0] || "",
							isBurnt: false,
							isActive: true,
						},
						"weaknessTag",
					),
				],
				experience: theme.content.experience,
				decay: theme.content.decay,
				motivation: theme.content.bio.title?.replace(/['"“”‟]/gm, "") || "",
				note: theme.content.bio.body,
			},
		}));

	const backpack = {
		name: t("TYPES.Item.backpack"),
		type: "backpack",
		system: {
			contents: data.backpack.map((item) => createTag(item, "backpack")),
		},
	};

	const statuses = data.statuses.map((status) => createStatus(status));

	const tags = Object.values(data.miscCard?.content || {})
		.flat()
		.map((tag) => createStatus(tag));

	const actorData = {
		name: data.name,
		type: "character",
		system: {
			note: "",
		},
		effects: [...tags, ...statuses],
		items: [...themeData, backpack],
	};
	const created = await Actor.create(actorData);
	if (created) {
		const formatted = game.i18n.format("Litm.ui.info-imported-character", {
			name: created.name,
		});
		ui.notifications.info(formatted);
		created.sheet.render(true);
	}
}

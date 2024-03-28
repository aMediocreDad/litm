import { localize as t } from "../utils.js";

function createTag(data, type) {
	return {
		...(data || { name: "", isBurnt: false, isActive: false }),
		type,
		id: foundry.utils.randomID(),
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
			name: theme.content.mainTag.name,
			type: "theme",
			system: {
				themebook: theme.content.themebook,
				level: theme.content.level,
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
				motivation: theme.content.bio.title,
				note: theme.content.bio.body,
			},
		}));

	const backpack = {
		name: t("TYPES.Item.backpack"),
		type: "backpack",
		"system.contents": data.backpack.map((item) => createTag(item, "backpack")),
	};

	const actorData = {
		name: data.name,
		type: "character",
		system: {
			note: "",
		},
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

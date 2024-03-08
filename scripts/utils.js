export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function localize(...key) {
	if (key.length === 1) return game.i18n.localize(key[0]);
	return key.map((k) => game.i18n.localize(k)).join(" ");
}

export function sortByName(a, b) {
	return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

export function sortTags(tags) {
	return tags.sort(sortByName);
}

export function titleCase(str) {
	return (
		str.charAt(0).toUpperCase() +
		str
			.toLowerCase()
			.replace(/\b\w+/g, (l) => {
				if (["and", "the", "of", "or", "a", "an"].includes(l)) return l;
				return l.charAt(0).toUpperCase() + l.substr(1);
			})
			.slice(1)
	);
}

export function dispatch(data) {
	const isGM = game.user.isGM;
	const user = game.user.id;
	return game.socket.emit("system.litm", { ...data, isGM, user });
}

export function getConfiggedEffect(effect) {
	const config = Object.values(CONFIG.litm.effects).find((e) => !!e[effect]);
	return { ...config?.[effect], name: effect };
}

export async function newTagDialog(actors) {
	const t = localize;
	return Dialog.wait({
		title: t("Litm.ui.add-tag"),
		content: await renderTemplate("systems/litm/templates/partials/new-tag.html", { actors }),
		acceptLabel: t("Litm.ui.create"),
		buttons: {
			cancel: {
				label: t("Litm.ui.cancel"),
			},
			create: {
				label: t("Litm.ui.create"),
				callback: (html) => {
					const form = html.find("form")[0];
					const formData = new FormDataExtended(form);
					const expanded = expandObject(formData.object);
					return expanded
				},
			},
		},
		default: 'create',
	}, {
		classes: ["litm", "litm--new-tag"],
	});
}

export async function confirmDelete() {
	const t = localize;
	return Dialog.confirm({
		title: t("Litm.ui.confirm-delete-title"),
		content: t("Litm.ui.confirm-delete-content"),
		defaultYes: false,
	});
}

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

export async function newTagDialog(actors) {
	const t = localize;
	return Dialog.wait(
		{
			title: t("Litm.ui.add-tag"),
			content: await renderTemplate(
				"systems/litm/templates/partials/new-tag.html",
				{ actors },
			),
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
						const expanded = foundry.utils.expandObject(formData.object);
						return expanded;
					},
				},
			},
			default: "create",
		},
		{
			classes: ["litm", "litm--new-tag"],
		},
	);
}

export async function confirmDelete(string = "Item") {
	const thing = game.i18n.localize(string);
	return Dialog.confirm({
		title: game.i18n.format("Litm.ui.confirm-delete-title", { thing }),
		content: game.i18n.format("Litm.ui.confirm-delete-content", { thing }),
		defaultYes: false,
		options: {
			classes: ["litm", "litm--confirm-delete"],
		},
	});
}

export async function gmModeratedRoll(app, cb) {
	const id = foundry.utils.randomID();
	game.litm.rolls[id] = cb;

	dispatch({ app, id, type: "roll" });
}

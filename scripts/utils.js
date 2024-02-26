export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function localize(key) {
	return game.i18n.localize(key);
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

export function getConfiggedEffect(effect) {
	const config = Object.values(CONFIG.litm.effects).find((e) => !!e[effect]);
	return { ...config?.[effect], name: effect };
}

export async function confirmDelete() {
	const t = localize;
	return Dialog.confirm({
		title: t("Litm.ui.confirm-delete-title"),
		content: t("Litm.ui.confirm-delete-content"),
		defaultYes: false,
	});
}

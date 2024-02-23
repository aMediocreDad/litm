export function localize(key) {
	return game.i18n.localize(key);
}

const t = localize;

export function getConfiggedEffect(effect) {
	const config = Object.values(CONFIG.litm.effects).find((e) => !!e[effect]);
	return { ...config?.[effect], name: effect };
}

export async function confirmDelete() {
	return Dialog.confirm({
		title: t("Litm.ui.confirm-delete-title"),
		content: t("Litm.ui.confirm-delete-content"),
		defaultYes: false,
	});
}


export function nukeFoundryStyles() {
	const foundryStyles = $('link[rel=stylesheet][href*="css/style.css"]');
	const style = Object.assign(document.createElement("style"), {
		textContent: `@layer foundry { ${Array.from(foundryStyles[0].sheet.cssRules)
			.map((rule) => rule.cssText)
			.join("\n")} }`,
	});
	foundryStyles[0].before(style);
	foundryStyles.remove();
}

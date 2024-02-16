export function localize(key) {
	return game.i18n.localize(key);
}

const t = localize

export function titleCase(str) {
	return str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

export function slugify(str) {
	return str.toLowerCase().replace(/\s/g, '-');
}

export function getTagData(tag, index) {
	if (typeof tag === 'string') {
		return {
			name: tag,
			index,
			slug: slugify(tag),
		};
	}

	return {
		...tag,
		index,
		slug: slugify(tag.name),
	};
}

export function confirmDelete() {
	return new Promise((resolve) => {
		new Dialog({
			title: t('Litm.ui.confirm-delete-title'),
			content: t('Litm.ui.confirm-delete-content'),
			buttons: {
				yes: {
					icon: '<i class="fas fa-check"></i>',
					label: t('Yes'),
					callback: () => resolve(true),
				},
				no: {
					icon: '<i class="fas fa-times"></i>',
					label: t('No'),
					callback: () => resolve(false),
				},
			},
			default: 'no',
		}).render(true);
	});
}


export function nukeFoundryStyles() {
	const foundryStyles = $('link[rel=stylesheet][href*="css/style.css"]');
	const style = Object.assign(document.createElement('style'), {
		textContent: `@layer foundry { ${Array.from(foundryStyles[0].sheet.cssRules).map((rule) => rule.cssText).join('\n')} }`,
	});
	foundryStyles[0].before(style);
	foundryStyles.remove();
}

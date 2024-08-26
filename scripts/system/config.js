export class LitmConfig {
	challenge_types = [
		"attacker",
		"barrier-hazard",
		"charge",
		"countdown",
		"mystery",
		"pursuer",
		"quarry",
		"temptation",
		"watcher",
	];

	effects = {
		"Litm.effects.category-target": {
			attack: {
				description: "Litm.effects.attack.description",
				action: "Litm.effects.attack.action",
				cost: "Litm.effects.attack.cost",
				icon: "fas fa-swords",
			},
			disrupt: {
				description: "Litm.effects.disrupt.description",
				action: "Litm.effects.disrupt.action",
				cost: "Litm.effects.disrupt.cost",
				icon: "fas fa-ban",
			},
			influence: {
				description: "Litm.effects.influence.description",
				action: "Litm.effects.influence.action",
				cost: "Litm.effects.influence.cost",
				icon: "fas fa-hand-paper",
			},
			weaken: {
				description: "Litm.effects.weaken.description",
				action: "Litm.effects.weaken.action",
				cost: "Litm.effects.weaken.cost",
				icon: "fas fa-dizzy",
			},
		},
		"Litm.effects.category-ally": {
			bestow: {
				description: "Litm.effects.bestow.description",
				action: "Litm.effects.bestow.action",
				cost: "Litm.effects.bestow.cost",
				icon: "fas fa-gift",
			},
			enhance: {
				description: "Litm.effects.enhance.description",
				action: "Litm.effects.enhance.action",
				cost: "Litm.effects.enhance.cost",
				icon: "fas fa-bolt",
			},
			create: {
				description: "Litm.effects.create.description",
				action: "Litm.effects.create.action",
				cost: "Litm.effects.create.cost",
				icon: "fas fa-tags",
			},
			restore: {
				description: "Litm.effects.restore.description",
				action: "Litm.effects.restore.action",
				cost: "Litm.effects.restore.cost",
				icon: "fas fa-heart",
			},
		},
		"Litm.effects.category-process": {
			advance: {
				description: "Litm.effects.advance.description",
				action: "Litm.effects.advance.action",
				cost: "Litm.effects.advance.cost",
				icon: "fas fa-arrow-right",
			},
			set_back: {
				description: "Litm.effects.set_back.description",
				action: "Litm.effects.set_back.action",
				cost: "Litm.effects.set_back.cost",
				icon: "fas fa-arrow-left",
			},
		},
		"Litm.effects.category-other": {
			discover: {
				description: "Litm.effects.discover.description",
				action: "Litm.effects.discover.action",
				cost: "Litm.effects.discover.cost",
				icon: "fas fa-search",
			},
			extra_feat: {
				description: "Litm.effects.extra_feat.description",
				action: "Litm.effects.extra_feat.action",
				cost: "Litm.effects.extra_feat.cost",
				icon: "fas fa-plus",
			},
		},
	};

	/**
	 * You can use this to completely override the default effects.
	 * formula: ({ totalPower }) => `${1 + Math.max(Math.abs(totalPower))}d6${totalPower < 1 ? `kl1` : "kh1"}`,
	 * resolver: (roll) => {
	 *    if (roll.dice[0].results.every(d => d.active && d.result === 1)) return { label: "failure", description: "Litm.ui.roll-failure" };
	 * }
	 * @link scripts/apps/roll-dialog.js
	 * @link scripts/apps/roll.js
	 */
	roll = { formula: null, resolver: null };

	theme_levels = {
		origin: [
			"circumstance",
			"past",
			"devotion",
			"mystery",
			"people",
			"possessions",
			"personality",
			"trade-or-skill",
			"trait",
			"hedge-magic",
		],
		adventure: [
			"prodigious-skill",
			"duty",
			"relic",
			"uncanny-being",
			"thaumaturgy",
		],
		greatness: [
			"rulership",
			"destiny",
			"mastery",
			"monstrosity",
			"grand-thaumaturgy",
		],
	};

	theme_src = {
		origin: "systems/litm/assets/media/origin",
		adventure: "systems/litm/assets/media/adventure",
		greatness: "systems/litm/assets/media/greatness",
	};

	tagStringRe = /(?!\b|\s)(?:\[|\{)([^\d\[\]{}]+)(?:[\s\-\:](\d+))?(?:\}|\])/gi;
	sceneLinkRe = /@ActivateScene\[([^\]]+)\](?:\{([^\}]+)\})?/gi;
}

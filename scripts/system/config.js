export class LitmConfig {
	effects = {
		"Litm.effects.category-target": {
			attack: {
				description: "Litm.effects.attack.description",
				action: "Litm.effects.attack.action",
				cost: "Litm.effects.attack.cost",
			},
			disrupt: {
				description: "Litm.effects.disrupt.description",
				action: "Litm.effects.disrupt.action",
				cost: "Litm.effects.disrupt.cost",
			},
			influence: {
				description: "Litm.effects.influence.description",
				action: "Litm.effects.influence.action",
				cost: "Litm.effects.influence.cost",
			},
			weaken: {
				description: "Litm.effects.weaken.description",
				action: "Litm.effects.weaken.action",
				cost: "Litm.effects.weaken.cost",
			},
		},
		"Litm.effects.category-ally": {
			bestow: {
				description: "Litm.effects.bestow.description",
				action: "Litm.effects.bestow.action",
				cost: "Litm.effects.bestow.cost",
			},
			enhance: {
				description: "Litm.effects.enhance.description",
				action: "Litm.effects.enhance.action",
				cost: "Litm.effects.enhance.cost",
			},
			create: {
				description: "Litm.effects.create.description",
				action: "Litm.effects.create.action",
				cost: "Litm.effects.create.cost",
			},
			restore: {
				description: "Litm.effects.restore.description",
				action: "Litm.effects.restore.action",
				cost: "Litm.effects.restore.cost",
			},
		},
		"Litm.effects.category-process": {
			advance: {
				description: "Litm.effects.advance.description",
				action: "Litm.effects.advance.action",
				cost: "Litm.effects.advance.cost",
			},
			set_back: {
				description: "Litm.effects.set_back.description",
				action: "Litm.effects.set_back.action",
				cost: "Litm.effects.set_back.cost",
			},
		},
		"Litm.effects.category-other": {
			discover: {
				description: "Litm.effects.discover.description",
				action: "Litm.effects.discover.action",
				cost: "Litm.effects.discover.cost",
			},
			extra_feat: {
				description: "Litm.effects.extra_feat.description",
				action: "Litm.effects.extra_feat.action",
				cost: "Litm.effects.extra_feat.cost",
			},
		},
		"Litm.effects.category-consequence": {
			mitigate: {
				description: "Litm.effects.mitigate.description",
				action: "Litm.effects.mitigate.action",
				cost: "Litm.effects.mitigate.cost",
			},
		},
	};
	static createConfig() {
		return new LitmConfig();
	}
}

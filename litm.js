import { importCharacter } from "./scripts/apps/import-character.js";
import { insertRollButton } from "./scripts/apps/roll-button.js";
import { nukeFoundryStyles } from "./scripts/utils.js";
import { TagData } from "./scripts/data/abstract.js";
import { CharacterSheet } from "./scripts/actor/character/character-sheet.js";
import { CharacterData } from "./scripts/actor/character/character-data.js";
import { ThemeData } from "./scripts/item/theme-data.js";
import { ThemeSheet } from "./scripts/item/theme-sheet.js";
import {
	HandlebarsHelpers,
	HandlebarsPartials,
} from "./scripts/system/handlebars.js";
import { success } from "./scripts/logger.js";
import { Fonts } from "./scripts/system/fonts.js";
import { LitmHooks } from "./scripts/system/hooks.js";
import { LitmRoll } from "./scripts/apps/roll.js";
import { LitmRollDialog } from "./scripts/apps/roll-dialog.js";
import { LitmConfig } from "./scripts/system/config.js";

Hooks.once("init", () => {
	nukeFoundryStyles();
	insertRollButton()

	game.litm = {
		config: LitmConfig.createConfig(),
		data: {
			TagData,
		},
		importCharacter,
		LitmRollDialog,
		LitmRoll,
	};

	CONFIG.debug.hooks = true;
	CONFIG.Actor.dataModels.character = CharacterData;
	CONFIG.Dice.rolls.push(LitmRoll);
	CONFIG.Item.dataModels.theme = ThemeData;
	CONFIG.litm = game.litm.config;

	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("litm", CharacterSheet, {
		types: ["character"],
		makeDefault: true,
	});
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("litm", ThemeSheet, {
		types: ["theme"],
		makeDefault: true,
	});

	HandlebarsHelpers.register();
	HandlebarsPartials.register();
	Fonts.register();
	LitmHooks.register();

	success("Loaded");
});

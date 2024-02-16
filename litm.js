import { CharacterSheet } from "./scripts/actor/character/character-sheet.js";
import { CharacterData } from "./scripts/actor/character/character-data.js";
import { ThemeData } from "./scripts/item/theme-data.js";
import { ThemeSheet } from "./scripts/item/theme-sheet.js";
import { HandlebarsHelpers, HandlebarsPartials } from "./scripts/system/handlebars.js";
import { Fonts } from "./scripts/system/fonts.js";
import { nukeFoundryStyles } from "./scripts/util.js";
import { success } from "./scripts/logger.js";
import { LitmHooks } from "./scripts/system/hooks.js";
import { LitmRollDialog, LitmRoll } from "./scripts/system/roll.js";
import { LitmConfig } from "./scripts/system/config.js";

Hooks.once("init", () => {
	nukeFoundryStyles();

	CONFIG.debug.hooks = true;
	CONFIG.Actor.dataModels.character = CharacterData;
	CONFIG.Dice.rolls.unshift(LitmRoll);
	CONFIG.Item.dataModels.theme = ThemeData;
	CONFIG.litm = LitmConfig.createConfig();

	game.litm = {
		config: CONFIG.litm,
		LitmRollDialog
	}

	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("litm", CharacterSheet, { types: ["character"], makeDefault: true });
	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("litm", ThemeSheet, { types: ["theme"], makeDefault: true });

	HandlebarsHelpers.register();
	HandlebarsPartials.register();
	Fonts.register();
	LitmHooks.register();
	success("Loaded")
})

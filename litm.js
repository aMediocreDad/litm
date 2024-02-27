import { importCharacter } from "./scripts/apps/import-character.js";
import { TagData } from "./scripts/data/abstract.js";
import { CharacterData } from "./scripts/actor/character/character-data.js";
import { CharacterSheet } from "./scripts/actor/character/character-sheet.js";
import { ChallengeSheet } from "./scripts/actor/challenge/challenge-sheet.js";
import { ThemeData } from "./scripts/item/theme-data.js";
import { ThemeSheet } from "./scripts/item/theme-sheet.js";
import {
	HandlebarsHelpers,
	HandlebarsPartials,
} from "./scripts/system/handlebars.js";
import { info, success } from "./scripts/logger.js";
import { Fonts } from "./scripts/system/fonts.js";
import { LitmHooks } from "./scripts/system/hooks.js";
import { LitmRoll } from "./scripts/apps/roll.js";
import { LitmRollDialog } from "./scripts/apps/roll-dialog.js";
import { LitmConfig } from "./scripts/system/config.js";

// Set the logo to the LitM logo
$("#logo")[0].src = "systems/litm/assets/media/logo.webp";

Hooks.once("init", () => {
	info("Initializing Legend in the Mist...");
	game.litm = {
		config: LitmConfig.createConfig(),
		data: {
			TagData,
		},
		importCharacter,
		LitmRollDialog,
		LitmRoll,
	};

	info("Initializing Config...");
	CONFIG.Actor.dataModels.character = CharacterData;
	CONFIG.Dice.rolls.push(LitmRoll);
	CONFIG.Item.dataModels.theme = ThemeData;
	CONFIG.litm = game.litm.config;

	info("Registering Sheets...");
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("litm", CharacterSheet, {
		types: ["character"],
		makeDefault: true,
	});
	Actors.registerSheet("litm", ChallengeSheet, {
		types: ["challenge"],
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

	success("Successfully initialized Legend in the Mist!");
});

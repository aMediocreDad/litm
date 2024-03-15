import { localize as t } from "../utils.js";

export class KeyBindings {
	static register() {
		game.keybindings.register("litm", "openDiceRoller", {
			name: t("Litm.ui.dice-roller"),
			hint: t("Litm.ui.dice-roller-hint"),
			editable: [
				{
					key: "KeyR",
				},
			],
			onDown: () => {
				const sheet = game.user.character?.sheet;
				if (!sheet)
					return ui.notifications.warn(
						t("Litm.ui.warn-no-character", { localize: true }),
					);
				return sheet.renderRollDialog();
			},
			onUp: () => {},
			restricted: false,
			precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY,
		});
	}
}

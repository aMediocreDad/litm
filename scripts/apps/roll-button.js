import { localize as t } from "../utils.js";

export function insertRollButton() {
	const app = $(`
		<button id="litm-roll" aria-label="${t("Litm.ui.roll-title")}" data-tooltip="${t("Litm.ui.roll-title")}">
			<img src="systems/litm/assets/media/dice.webp" alt="Two Acorns" />
		</button>`)
		.click(() => {
			if (!game.user.character) return ui.notifications.error(t("Litm.ui.warn-no-character"));
			const actor = game.user.character;
			game.litm.LitmRollDialog.create(
				actor._id,
				actor.sheet.activePowerTags,
				actor.sheet.weaknessTags,
			);
		});
	$("#players").before(app);
}

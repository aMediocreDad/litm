export class Sockets {
	static dispatch(event, data) {
		if (!game.ready)
			return console.error(
				`Tried to dispatch ${event} socket event before the game was ready.`,
			);

		const senderIsGM = game.user.isGM;
		const senderId = game.user.id;
		const id = foundry.utils.randomID();
		game.socket.emit("system.litm", {
			id,
			data,
			event,
			senderIsGM,
			senderId,
		});
	}

	static on(event, cb) {
		game.socket.on("system.litm", (data) => {
			const { event: e, senderId, ...d } = data;
			if (e !== event || senderId === game.userId) return;
			cb(d);
		});
	}

	static registerListeners() {
		this.#registerRollUpdateListener();
		this.#registerRollModerationListeners();

		Hooks.once("ready", () => {
			if (game.user.isGM) this.#registerGMRollListeners();
		});
	}

	static #registerRollUpdateListener() {
		Sockets.on("updateRollDialog", (event) => {
			const { data } = event;
			const actor = game.actors.get(data.actorId);
			if (!actor) return console.warn(`Actor ${data.actorId} not found`);
			actor.sheet.updateRollDialog(data);
		});
	}

	static #registerRollModerationListeners() {
		Sockets.on("rejectRoll", ({ data: { actorId, name } }) => {
			ui.notifications.warn(
				game.i18n.format("Litm.ui.roll-rejected", { name }),
			);
			const actor = game.actors.get(actorId);
			if (!actor) return console.warn(`Actor ${actorId} not found`);
			actor.sheet.renderRollDialog();
		});

		Sockets.on("resetRollDialog", ({ data: { actorId } }) => {
			const actor = game.actors.get(actorId);
			if (!actor) return console.warn(`Actor ${actorId} not found`);
			actor.sheet.resetRollDialog();
		});
	}

	static #registerGMRollListeners() {
		Sockets.on("skipModeration", ({ data: { name } }) => {
			ui.notifications.info(
				game.i18n.format("Litm.ui.player-skipped-moderation", { name }),
			);
		});
	}
}

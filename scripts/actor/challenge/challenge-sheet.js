export class ChallengeSheet extends ActorSheet {
	static defaultOptions = mergeObject(ActorSheet.defaultOptions, {
		classes: ["litm", "litm--challenge"],
		width: 250,
		height: 700,
		resizable: false,
	});

	get template() {
		return "systems/litm/templates/actor/challenge.html";
	}
}

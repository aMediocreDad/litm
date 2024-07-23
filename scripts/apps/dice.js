export const DENOMINATION = "x";

export class DoubleSix extends foundry.dice.terms.Die {
	constructor(termData) {
		super({ ...termData, faces: 12 });
	}

	static DENOMINATION = "6";

	get total() {
		const total = super.total;
		return Math.ceil(total / 2);
	}
}

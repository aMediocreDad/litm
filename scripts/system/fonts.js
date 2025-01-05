import { info } from "../logger.js";

export class Fonts {
	static register() {
		info("Registering Fonts...");
		FontConfig.loadFont("LitM Dice", {
			fonts: [
				{
					name: "LitM Dice",
					urls: ["systems/litm/assets/fonts/litm-dice.otf"],
				},
			],
		});
		FontConfig.loadFont("CaslonAntique", {
			editor: true,
			fonts: [
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon.ttf"],
					sizeAdjust: "110%",
				},
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon-b.ttf"],
					weight: "bold",
					sizeAdjust: "110%",
				},
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon-i.ttf"],
					style: "italic",
					sizeAdjust: "110%",
				},
			],
		});
		FontConfig.loadFont("Caveat", {
			editor: true,
			fonts: [
				{
					name: "Caveat",
					urls: ["systems/litm/assets/fonts/caveat_wght.woff2"],
					weight: "300 800",
				},
			],
		});
		FontConfig.loadFont("Labrada", {
			editor: true,
			fonts: [
				{
					name: "Labrada",
					urls: ["systems/litm/assets/fonts/labrada_wght.woff2"],
					weight: "300 800",
				},
				{
					name: "Labrada",
					urls: ["systems/litm/assets/fonts/labrada_i_wght.woff2"],
					style: "italic",
					weight: "300 800",
				},
			],
		});
		FontConfig.loadFont("AlchemyItalic", {
			editor: true,
			fonts: [
				{
					name: "AlchemyItalic",
					urls: ["systems/litm/assets/fonts/alchemy-i.ttf"],
				},
			],
		});
		FontConfig.loadFont("PackardAntique", {
			editor: true,
			fonts: [
				{
					name: "PackardAntique",
					urls: ["systems/litm/assets/fonts/packard.ttf"],
				},
				{
					name: "PackardAntique",
					urls: ["systems/litm/assets/fonts/packard-b.ttf"],
					weight: "bold",
				},
			],
		});
		FontConfig.loadFont("PowellAntique", {
			editor: true,
			fonts: [
				{
					name: "PowellAntique",
					urls: ["systems/litm/assets/fonts/powell.ttf"],
				},
				{
					name: "PowellAntique",
					urls: ["systems/litm/assets/fonts/powell-b.ttf"],
					weight: "bold",
				},
			],
		});
	}
}

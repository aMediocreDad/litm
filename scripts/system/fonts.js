import { info } from "../logger.js";

export class Fonts {
	static register() {
		info("Registering Fonts...");
		FontConfig.loadFont("CaslonAntique", {
			editor: true,
			fonts: [
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon.ttf"],
					sizeAdjust: "110%"
				},
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon-b.ttf"],
					weight: "bold",
					sizeAdjust: "110%"
				},
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon-i.ttf"],
					style: "italic",
					sizeAdjust: "110%"
				},
			],
		});
		FontConfig.loadFont("Fraunces", {
			editor: true,
			fonts: [
				{
					name: "Fraunces",
					urls: ["systems/litm/assets/fonts/fraunces.ttf"],
					weight: "300 800",
				},
				{
					name: "Fraunces",
					urls: ["systems/litm/assets/fonts/fraunces-i.ttf"],
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
		})
	}
}

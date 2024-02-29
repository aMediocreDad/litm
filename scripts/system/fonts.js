import { info } from "../logger.js";

export class Fonts {
	static register() {
		info("Registering Fonts...");
		FontConfig.loadFont("BespokeSans", {
			editor: true,
			fonts: [
				{
					name: "BespokeSans",
					urls: ["systems/litm/assets/fonts/bespoke.woff2"],
					sizeAdjust: "90%",
					weight: "300 800"
				},
				{
					name: "BespokeSans",
					urls: ["systems/litm/assets/fonts/bespoke-i.woff2"],
					style: "italic",
					sizeAdjust: "90%",
					weight: "300 800"
				},
			]
		});
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
		FontConfig.loadFont("LibreCaslonText", {
			editor: true,
			fonts: [
				{
					name: "LibreCaslonText",
					urls: ["systems/litm/assets/fonts/libre-caslon.ttf"],
				},
				{
					name: "LibreCaslonText",
					urls: ["systems/litm/assets/fonts/libre-caslon-i.ttf"],
					style: "italic",
				},
				{
					name: "LibreCaslonText",
					urls: ["systems/litm/assets/fonts/libre-caslon-b.ttf"],
					weight: "bold",
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
	}
}

import { EditorChange, MarkdownRenderChild, Plugin } from 'obsidian';
import { ViewPlugin, EditorView, ViewUpdate } from "@codemirror/view"

interface ObsidianMFUPatch {
}

export default class ObsidianMFUPatchPlugin extends Plugin {
	settings: ObsidianMFUPatch;
	async onload() {
		this.registerMarkdownPostProcessor((element, context) => {
			const blocks = element.querySelectorAll('span.internal-embed');
			blocks.forEach(async (span, key, parent) => {
				if (span instanceof HTMLElement) {
					let src = span.getAttr("src")
					if (src) {
						let tmparray = src.split("#")
						if (tmparray.length == 2) {
							context.addChild(new FragmentPatch(span, tmparray[1]))
						}
					}
				}
			})
		}, 0)

		this.registerEditorExtension(docSizePlugin);
	}
	onunload() {
	}
}

const docSizePlugin = ViewPlugin.fromClass(class {
	dom: HTMLDivElement
	view: EditorView
	constructor(view: EditorView) {
		this.view = view
		this.dom = view.dom.appendChild(document.createElement("div"))
		this.dom.style.cssText =
			"position: absolute; inset-block-start: 2px; inset-inline-end: 5px"
		this.dom.textContent = "" + view.state.doc.length
	}

	update(update: ViewUpdate) {
		console.log(update)
		var blocks = this.view.dom.querySelectorAll("div.internal-embed")
		blocks.forEach(async (div, key, parent) => {
			if (div instanceof HTMLElement) {
				let src = div.getAttr("src")
				if (src) {
					let tmparray = src.split("#")
					if (tmparray.length == 2) {
						let audios = div.querySelectorAll("audio")
						audios.forEach((el, key, list) => {
							let src = el.getAttr("src")
							if (src?.contains("#")) {
								return
							}
							src = src + "#" + tmparray[1]
							el.setAttr("src", src)
							el.setAttr("onpause", "this.load()")
						})
						let videos = div.querySelectorAll("videos")
						videos.forEach((el, key, list) => {
							let src = el.getAttr("src")
							if (src?.contains("#")) {
								return
							}
							src = src + "#" + tmparray[1]
							el.setAttr("src", src)
							el.setAttr("onpause", "this.load()")
						})
					}
				}
			}
		})
		if (update.docChanged)
			this.dom.textContent = "" + update.state.doc.length
	}

	destroy() { this.dom.remove() }
})

export class FragmentPatch extends MarkdownRenderChild {
	private fragment: string
	private original: HTMLElement
	private ilObs: MutationObserver

	constructor(containerEl: HTMLElement, fragment: string) {
		super(containerEl);
		this.fragment = fragment
		this.original = containerEl
	}
	async onload(): Promise<void> {
		this.ilObs = new MutationObserver((mutations, observer) => {
			let audios = this.original.querySelectorAll("audio")
			audios.forEach((el, key, list) => {
				let src = el.getAttr("src")
				src = src + "#" + this.fragment
				el.setAttr("src", src)
				el.setAttr("onpause", "this.load()")
			})
			let videos = this.original.querySelectorAll("video")
			videos.forEach((el, key, list) => {
				let src = el.getAttr("src")
				src = src + "#" + this.fragment
				el.setAttr("src", src)
				el.setAttr("onpause", "this.load()")
			})
		})
		this.ilObs.observe(this.original, { attributeFilter: ["class"], attributeOldValue: true })
	}
}
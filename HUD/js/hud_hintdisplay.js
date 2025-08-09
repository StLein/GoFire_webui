class CHudHintDisplay extends CHudBase {
	constructor() { super(); }

	init() {
		vueGame.showHintText = false;
		client.hookUserMessage("HintText", this.onMsgHintText.bind(this));
	}

	onMsgHintText(msg) {
		var str = msg.readString();
		var textMessageStr = client.lookupTextMessageString(str);
		var localStr = localize.find(textMessageStr);
		if (localStr) {
			str = localStr;
		}
		vueGame.hintText = str;
		vueGame.showHintText = true;
		setTimeout(() => {
			vueGame.showHintText = false;
		}, 4000);
	}
}

getHudList().push(new CHudHintDisplay());

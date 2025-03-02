import * as InboxSDK from '@inboxsdk/core';


const latexButton = {
    title: "Render TeX",
    iconUrl: "https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365",

    //feels like a crime
    onClick(event) {
        event.composeView.insertTextIntoBodyAtCursor("this is only the beginning")
    }
}

InboxSDK.load(2, "Hello World")
    .then( (sdk) => {
        sdk.Compose.registerComposeViewHandler((composeView) => {
            composeView.addButton(latexButton);
        });
    });



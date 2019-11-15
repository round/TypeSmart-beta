// chrome.browserAction.onClicked.addListener(function (tab) {
//   console.log('button clicked');
//   // chrome.browserAction.disable(tab);
// });

//
// chrome.browserAction.onClicked.addListener(function(tab) {
//   chrome.storage.sync.get('state', function(data) {
//     if (data.state === 'on') {
//       chrome.storage.sync.set({state: 'off'});
//       //do something, removing the script or whatever
//       console.log('off');
//     } else {
//       chrome.storage.sync.set({state: 'on'});
//       //inject your script
//       console.log('on');
//
//     }
//   });
// });


// var enable=false;
// chrome.browserAction.onClicked.addListener(function (tab) {
//  enable = enable ? false : true;
//  if(enable){
//   //turn on...
//   // chrome.browserAction.setIcon({ path: 'icon.png' });
//   chrome.browserAction.setBadgeText({ text: 'ON' });
//   // chrome.tabs.executeScript(null, { file: 'content.js' });
//   // chrome.tabs.executeScript(tab.id, {
//   //           // "file": "content.js"
//   //       }, function () { // Execute your code
//   //           console.log('button pressed'); // Notification on Completion
//   //       });
//  }else{
//   //turn off...
//   // chrome.browserAction.setIcon({ path: 'disable.png'});
//   chrome.browserAction.setBadgeText({ text: 'OFF' });
//  }
// });



chrome.storage.sync.get('state', function(data) { //initial; check
   if (data.state === 'on') {
     chrome.browserAction.setBadgeText({ text: 'ON' });
   } else {
     chrome.browserAction.setBadgeText({ text: 'OFF' });
  }
});

chrome.browserAction.onClicked.addListener(function(tab) { //toggle
   chrome.storage.sync.get('state', function(data) {
     if (data.state === 'on') {
        chrome.storage.sync.set({state: 'off'});
        chrome.browserAction.setBadgeText({ text: 'OFF' });

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "disableListener"});
    });

     } else {
       chrome.storage.sync.set({state: 'on'});
       chrome.browserAction.setBadgeText({ text: 'ON' });

       chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
       chrome.tabs.sendMessage(tabs[0].id, {action: "enableListener"});
     });


     }
   });
 });

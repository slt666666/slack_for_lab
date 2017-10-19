function postSlackMessage() {
  var token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');

  var slackApp = SlackApp.create(token); //SlackApp インスタンスの取得

  var options = {
    channelId: "general", //チャンネル名
    userName: "bot", //投稿するbotの名前
    message: "Hello, World" //投稿するメッセージ
  };

  slackApp.postMessage(options.channelId, options.message, {username: options.userName});
}

function doPost(e) {
  var token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
  var bot_name = "scheduler";
  var bot_icon = "http://i.imgur.com/DP2oyoM.jpg";
  var verify_token = PropertiesService.getScriptProperties().getProperty('VERIFY_TOKEN');

  //投稿の認証
  if (verify_token != e.parameter.token) {
    throw new Error("invalid token.");
  }

  var app = SlackApp.create(token);

  // 文字列処理
  var text = e.parameter.text.substr(3);
  var errorMessage = "記入方法にミスがあります、ex)2017/10/24-2017/10/26 出張   　2017/10/24 9:00 打ち合わせ等";
  // 日が跨る場合 ex)2017/10/24 9:00-2017/10/26,出張
  if (text.match("-")) {
    var splitText = text.split(",");
    var time = splitText[0].split("-");
    if (checkTime(time[0]) && checkTime(time[1])) {
      var time1 = time[0];
      var time2 = time[1];
      if (time2.length <= 10) {
        time2 += " 24:00";
      }
      var content = "";
      for (var i = 1; i < splitText.length; i++) {
        content += splitText[i];
      }
      var message = e.parameter.user_name + "さんの予定「" + text + "」を登録しました。";
      try {
        createEvent(content, time1, time2);
      }
      catch(e) {
        var message = errorMessage;
      }
    }else{
      var message = errorMessage;
    }
  // 1日の予定 ex)2017/10/24 9:00,出張
  } else {
    var splitText = text.split(",");
    var time1 = splitText[0]
    if (checkTime(time1)) {
      var time2 = "None"
      var content = ""
      for (var i = 1; i < splitText.length; i++) {
        content += splitText[i];
      }
      var message = e.parameter.user_name + "さんの予定「" + text + "」を登録しました。";
      try {
        createEvent(content, time1, time2);
      }
      catch(e) {
        var message = errorMessage;
      }
    } else {
      var message = errorMessage;
    }
  }

  return app.postMessage(e.parameter.channel_id, message, {
    username: bot_name,
    icon_url: bot_icon
  });
}

function createEvent(content, date1, date2){
  var cal = CalendarApp.getDefaultCalendar();
  if (date2 == "None") {
    date2 = date1
  }
  cal.createEvent(content, new Date(date1), new Date(date2));
}

function checkTime(date){
  return date.match(/^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}$/) || date.match(/^\d{4}\/\d{1,2}\/\d{1,2}/);
}

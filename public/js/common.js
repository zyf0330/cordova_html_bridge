'use strict';
/**
 * Created by zyf on 2016/6/27.
 */

document.addEventListener('deviceready', function () {
	//通知
	notification.initNotification(function(notify){
		location.href = 'notification?msg_id=' + notify.msg_id;
	}, function (notify) {
		location.href = 'notification?msg_id=' + notify.msg_id;
	}, function (notify) {
		location.href = 'notification?msg_id=' + notify.msg_id;
	});

	//处理分享
	device.platform == 'Android' && initShare(function (err, result) {
		location.href = 'handleShare?result=' + JSON.stringify(result)
	})

}, false)
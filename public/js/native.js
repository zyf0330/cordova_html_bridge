/**
 * Created by zyf on 2016/6/9.
 */

/**
 * 让用户选取一个联系人
 * @param {function(Error, Object)} cb(err, contact) 返回err或联系人。contact：name(String),birthday(Date),address(Array),phone(Array),email(Array)
 */
function pickContact(cb){
	var navC = navigator.contacts;
	if(!navC){
		return cb(new Error('联系人服务没有准备好'));
	}
	navC.pickContact(function (c) {
		var contact = formatContact(c);
		return cb(null, contact);
	}, function (errcode) {
		for (var name in ContactError) {
			if(ContactError[name] == errcode){
				return cb(new Error(name, errcode));
			}
		}
		return cb(new Error('未知错误'));
	});
}
/**
 * 列出所有联系人
 * @param {function(Error, Array)} cb(err ,contacts) 返回err，或者联系人数组。contact：name(String),birthday(Date),address(Array),phone(Array),email(Array)
 */
function listContact(cb){
	var navC = navigator.contacts;
	if(!navC){
		return cb(new Error('联系人服务没有准备好'));
	}
	navC.find(['*'], function (contacts) {
		contacts = contacts.map(formatContact);
		cb(null, contacts);
	}, function (errcode) {
		for (var name in ContactError) {
			if(ContactError[name] == errcode){
				return cb(new Error(name, errcode));
			}
		}
		return cb(new Error('未知错误'));
	}, {
		multiple: true
	})
}
function formatContact(c){
	return {
		name: c.name.formatted.toString().trim(),
		birthday: c.birthday != 'Invalid Date' ? c.birthday : null,
		address: !c.addresses ? null : c.addresses.map(function (o) {
			return o.formatted;
		}),
		phone: !c.phoneNumbers ? null : c.phoneNumbers.map(function (o) {
			return o.value.toString().replace(/-/g, '');
		}),
		email: !c.emails ? null : c.emails.map(function (o) {
			return o.value;
		})
	};
}
/**
 * 从图片库选取图片。height和width控制图片缩放，不会改变比例
 * @param {number} height 图片缩放高度
 * @param {number} width 图片缩放宽度
 * @param {function(Error, string)} cb(err, url) 返回err，或图片url(可能为dataurl或cdvfile)
 */
function selectPicFromLibrary(height, width, cb) {
	var camera = navigator.camera;
	if (!camera) {
		return cb(new Error('图片捕获尚未准备好'));
	}
	camera.getPicture(function (uri) {
		window.resolveLocalFileSystemURL(uri, function (entry) {
			cb(null, entry.toInternalURL());
		}, function (err) {
			cb(handleFileError(err));
		});
	}, function (err_msg) {
		cb(new Error(err_msg));
	}, {
		targetHeight: height || null,
		targetWidth: width || null,
		mediaType: Camera.MediaType.PICTURE,
		sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
		destinationType: Camera.DestinationType.FILE_URI,
		correctOrientation: true
	});
}
/**
 * 使用相机捕获图片。height和width控制图片缩放，不会改变比例
 * @param {number} height 捕获图像高度
 * @param {number} width 捕获图像宽度
 * @param {string} direction front则使用前置摄像头，安卓无效
 * @param {function(Error, string])} cb(err, url) 返回err，或图片url(可能为dataurl或cdvfile)
 */
function capturePic(height, width, direction, cb) {
	var camera = navigator.camera;
	if (!camera) {
		return cb(new Error('相机尚未准备好'));
	}
	camera.getPicture(function (uri) {
		if (uri.indexOf('file:///') == 0) {
			window.resolveLocalFileSystemURL(uri, function (entry) {
				cb(null, entry.toInternalURL());
			}, function (err) {
				cb(handleFileError(err));
			});
		} else {
			var dataurl = 'data:image/jpeg;base64,' + uri;
			cb(null, dataurl);
		}
	}, function (err_msg) {
		cb(new Error(err_msg));
	}, {
		quality: 70,
		targetHeight: height || null,
		targetWidth: width || null,
		mediaType: Camera.MediaType.PICTURE,
		sourceType: Camera.PictureSourceType.CAMERA,
		destinationType: Camera.DestinationType.FILE_URI,
		Direction: direction.toLowerCase() == 'front' ? Camera.Direction.FRONT : Camera.Direction.BACK,
		correctOrientation: true,
		saveToPhotoAlbum: true
	});
}
/**
 * 将url转换为文件
 * @param {string} url 文件的url，可接受data:image/的dataUrl或file:///或cdvfile://协议的文件
 * @param {function(Error, File)} cb(err, file) 返回err或file
 */
function getFile(url, cb) {
	if (url.indexOf('cdvfile://') == 0 || url.indexOf('file:///') == 0) {
		window.resolveLocalFileSystemURL(url, function (entry) {
			entry.file(function (file) {
				cb(null, file);
			}, function (err) {
				cb(handleFileError(err));
			});
		}, function (err) {
			cb(handleFileError(err));
		});
		return;
	}
	var m;
	if (m = url.match(/data:(image\/.+?);base64,(.+)/)) {
		var type = m[1];
		var data = atob(m[2]);
		var len = data.length;
		var uint8Arr = new Uint8Array(len);
		while (--len >= 0) {
			uint8Arr[len] = data.charCodeAt(len);
		}
		var blob = new Blob([uint8Arr], {type: type});
		return cb(null, blob);
	}
	cb(new Error('错误的url格式'));
}

/**
 * 保存文件到指定位置
 * @param dir {string} 目录。形如a/b/c，可以以/开头结尾
 * @param filename {string} 文件名
 * @param toSave {String|File|Blob} 要保存的文件，或网络链接
 * @param option {Object} isCache保存到缓存位置 默认true，isPrivate是否应用私有(iOS始终私有) 默认true，isAppend追加写入 默认false
 * @param {function(Error, String)} cb(err,url) 返回保存后的文件url
 */
function saveFile(dir, filename, toSave, option, cb){
	if(dir.endsWith('/') == false){
		dir = dir + '/';
	}
	if(typeof option == 'function'){
		cb = option, option = {};
	}
	var isCache = typeof option.isTmp == 'boolean' ? option.isTmp : true;
	var isPrivate = typeof option.isPrivate == 'boolean' ? option.isPrivate : true;
	var isAppend = typeof option.isAppend == 'boolean' ? option.isAppend : false;
	var fsType;
	if(device.platform == 'iOS'){
		isPrivate = true;
	}
	switch((isCache ? '1' : '0') + (isPrivate ? '1' : '0')){
		case '01': fsType = LocalFileSystem.PERSISTENT; break;//cdvfile://localhost/persistent/
		case '11': fsType = LocalFileSystem.TEMPORARY; break; //cdvfile://localhost/cache/
		case '00': fsType = 5; break; //cdvfile://localhost/files-external/
		case '10': fsType = 9; break; //cdvfile://localhost/cache-external/
	}
	window.requestFileSystem(fsType, 0, function (fs) {
		mkdir(fs.root.toInternalURL(), dir, function (err) {
			if(err){
				cb(err);
			}else{
				fs.root.getFile(dir + filename, {create: true, exclusive: false}, function (fileEntry) {
					if(typeof toSave == 'string' && toSave.indexOf('http') == 0){
						var fileTransfer = new FileTransfer();
						fileTransfer.download(toSave, fileEntry.toURL(), function (entry) {
								cb(null, entry.toInternalURL());
							}, function (err) {
								cb(new Error(err.exception));
							}, false, {
								//headers: {
								//    "Authorization": ""
								//}
							}
						);
					}else{
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function() {
								cb(null, fileWriter.localURL);
							};
							fileWriter.onerror = function (e) {
								cb(e);
							};
							if(isAppend){
								fileWriter.seek(fileWriter.length);
							}
							fileWriter.write(toSave);
						}, function (err) {
							cb(handleFileError(err));
						});
					}
				}, function (err) {
					cb(handleFileError(err));
				});
			}
		});
	}, function (err) {
		cb(handleFileError(err));
	});
}
/**
 * 删除文件，支持批量
 * @param paths {Array.<string>} 文件或目录的路径，必须是全路径
 */
function del(paths){
	paths.forEach(function (path) {
		window.resolveLocalFileSystemURL(path, function (entry) {
			if(entry.isFile){
				entry.remove();
			}else{
				entry.removeRecursively();
			}
		});
	});
}
/**
 * 创建目录
 * @param root {string} 目录根
 * @param dirs {string} 目录相对根的路径，不以.开头
 * @param cb {function(Error)}
 */
function mkdir(root, dirs, cb){
	if(root.endsWith('/') == false){
		root = root + '/';
	}
	dirs = dirs.split('/');
	recurMkdir(root, dirs, cb);
	function recurMkdir(root, dirs, cb){
		if(dirs.length == 0){
			return cb(null);
		}
		window.resolveLocalFileSystemURL(root, function (dirEntry) {
			dirEntry.getDirectory(dirs[0], {create: true}, function () {
				recurMkdir(root + dirs.shift() + '/', dirs, cb);
			}, function (err) {
				cb(handleFileError(err));
			});
		}, function (err) {
			cb(handleFileError(err));
		});
	}
}
/**
 * 将本地链接解析为cdvfile链接
 * @param url {String} file://开头的链接
 * @param cb {function(Error, String)} 返回cdvfile链接
 */
function resolveURLToCdv(url, cb){
	if(url.startsWith('file://') || url.startsWith('assets-library://')){
		window.resolveLocalFileSystemURL(url, function (entry) {
			cb(null, entry.toInternalURL());
		}, function (err) {
			cb(handleFileError(err));
		});
	}else{
		cb(new Error('错误的url格式'));
	}
}
/**
 * 处理File错误
 * @param err
 * @returns {Error}
 */
function handleFileError(err){
	for(var k in err.constructor){
		if(err.constructor[k] == err.code){
			var _err = new Error(k);
			_err.code = err.code;
			return _err;
		}
	}
	var _err = new Error('未知错误');
	_err.code = err.code;
	return _err;
}
/**
 * 获得当前位置的坐标信息，编码为WGS-84
 * @param {number} accuracyLimit = 0 定位要求精度。默认为0，不限制
 * @param {function(Error, Position)} cb(err, position) 返回err，或position，包括coords坐标信息(accuracy精度、latitude纬度、longitude经度等)和timestamp
 */
function currentPosition(accuracyLimit, cb){
	var geolocation = navigator.geolocation;
	if(!geolocation){
		return cb(new Error('位置服务尚未准备好'));
	}
	accuracyLimit = accuracyLimit || 0;
	var attempTimes = 3;
	_getCurrentPosition(_cb);
	function _cb(err, position){
		if(err){
			cb(err);
		}else{
			if(accuracyLimit == 0 || position.coords.accuracy <= accuracyLimit){
				cb(null, position);
			}else{
				if(--attempTimes <= 0){
					cb(new Error('定位精度不满足要求'));
				}else{
					_getCurrentPosition(_cb);
				}
			}
		}
	}
	function _getCurrentPosition(cb){
		geolocation.getCurrentPosition(function (position) {
			cb(null, position);
		}, function (err) {
			var err_msg;
			switch (err.code) {
				case err.PERMISSION_DENIED:
					err_msg = '禁止获取位置信息';
					break;
				case err.POSITION_UNAVAILABLE:
					err_msg = '位置信息获取失败';
					break;
				case err.TIMEOUT:
					err_msg = '位置信息获取超时';
					break;
				default:
					err_msg = err.message;
			}
			cb(new Error(err_msg));
		}, {
			enableHighAccuracy: true,
			timeout: 7000
		});
	}
}

var notification = window.notification = {};
/**
 * 返回的notify，有title、content、msg_id、optional等字段。注意，ios没有title。
 * Android的receiveNotification，可以在后台触发。iOS的receiveNotification不会在后台触发，因此要根据msd_id来判断是否处理重复。
 * 初始化失败抛出错误
 * @param openNotificationCallback {function} 打开通知回调，返回notify。
 * @param receiveNotificationCallback {function} 收到通知回调，返回notify
 * @param receiveMessageCallback {function} 收到自定义消息回调，返回notify。ios没有msg_id
 */
function initNotification(openNotificationCallback, receiveNotificationCallback, receiveMessageCallback){
	var jpush = window.plugins && window.plugins.jPushPlugin;
	if(!jpush){
		throw new Error('JPush Plugin is not ready');
	}
	var stopPush = localStorage.getItem('stopPush');
	if(stopPush != '1'){//init只需要第一次调用
		jpush.init();
		jpush.resumePush();
	}
	//点击通知
	document.addEventListener("jpush.openNotification", function (event) {
		var notify_obj;
		var notify = {
			msg_id: null,
			title: undefined,
			content: null,
			optional: null
		};
		if(device.platform == "Android") {
			notify_obj = jpush.openNotification;
			notify.msg_id = notify_obj.extras['cn.jpush.android.MSG_ID'];
			notify.title = notify_obj.title;
			notify.content = notify_obj.alert;
			notify.optional = notify_obj.extras['cn.jpush.android.EXTRA'];
		} else {
			notify_obj = event;
			notify.msg_id = notify_obj._j_msgid;
			notify.content = notify_obj.aps.alert;
			notify.optional = notify_obj;
			setBadge(notify_obj.aps.badge);
		}
		typeof openNotificationCallback == 'function' && openNotificationCallback(notify);
	}, false);
	//接收通知
	document.addEventListener("jpush.receiveNotification", function (event) {
		var notify_obj;
		var notify = {
			msg_id: null,
			title: undefined,
			content: null,
			optional: null
		};
		if(device.platform == "Android") {
			notify_obj = jpush.receiveNotification;
			notify.msg_id = notify_obj.extras['cn.jpush.android.MSG_ID'];
			notify.title = notify_obj.title;
			notify.content = notify_obj.alert;
			notify.optional = notify_obj.extras['cn.jpush.android.EXTRA'];
		} else {
			notify_obj = event;
			notify.msg_id = notify_obj._j_msgid;
			notify.content = notify_obj.aps.alert;
			notify.optional = notify_obj;
			setBadge(notify_obj.aps.badge);
			//apple bug，可能重复收到通知
			var local_msgid = localStorage.getItem('lastMsg');
			localStorage.setItem('lastMsg', notify.msg_id);
			if(local_msgid == notify.msg_id){
				return;
			}
		}
		typeof receiveNotificationCallback == 'function' && receiveNotificationCallback(notify);
	}, false);
	//接收自定义消息
	document.addEventListener("jpush.receiveMessage", function (event) {
		var notify_obj;
		var notify = {
			msg_id: null,
			title: undefined,
			content: null,
			optional: null
		};
		if(device.platform == "Android") {
			notify_obj = window.plugins.jPushPlugin.receiveMessage;
			notify.msg_id = notify_obj.extras['cn.jpush.android.MSG_ID'];
			notify.content = notify_obj.message;
			notify.optional = notify_obj.extras['cn.jpush.android.EXTRA'];
		} else {
			notify_obj = event;
			notify.msg_id = notify_obj._j_msgid;
			notify.content = notify_obj.content;
			notify.optional = notify_obj.extras;
		}
		typeof receiveMessageCallback == 'function' && receiveMessageCallback(notify);
	}, false);
}
notification.initNotification = initNotification;
/**
 * 停止推送通知
 */
function stopPush(){
	localStorage.setItem('stopPush', 1);
	window.plugins.jPushPlugin.stopPush();
}
notification.stopPush = stopPush;
/**
 * 恢复推送通知
 */
function resumePush(){
	localStorage.setItem('stopPush', 0);
	window.plugins.jPushPlugin.resumePush();
}
notification.resumePush = resumePush;
/**
 * 获取推送设备id
 * @param cb {function(string)} 返回id
 */
function getPushID(cb){
	window.plugins.jPushPlugin.getRegistrationID(function(id){
		typeof cb == 'function' && cb(id);
	});
}
notification.getPushID = getPushID;
/**
 * 是否服务器停止推送
 * @param cb {function(boolean)} true为关闭
 */
function isPushStopped(cb){
	window.plugins.jPushPlugin.isPushStopped(function(r){
		typeof cb == 'function' && cb(r > 0 ? true : false);
	});
}
notification.isPushStopped = isPushStopped;
/**
 * 是否本地禁止通知
 * @param cb {function(boolean)} true为禁止
 */
function isPushDenied(cb){
	window.plugins.jPushPlugin.getUserNotificationSettings(function (r) {
		typeof cb == 'function' && cb(r == 0 ? true : false);
	});
}
notification.isPushDenied = isPushDenied;

/**
 * 设置本地的角标值。仅限iOS。私有接口
 */
function setBadge(num){
	if(device.platform != 'iOS'){
		return;
	}
	num = parseInt(num);
	if(isNaN(num)){
		num = 0;
	}
	window.plugins.jPushPlugin.setApplicationIconBadgeNumber(num);
	localStorage.setItem('badgeNum', num);
}
/**
 * 获取当本地的角标数。仅限iOS
 * @returns {number}
 */
function getBadge(){
	if(device.platform != 'iOS'){
		return;
	}
	var badgeNum = +localStorage.getItem('badgeNum');
	isNaN(badgeNum) && (badgeNum = 0);
	return badgeNum;
}
notification.getBadge = getBadge;
/**
 * 角标数字减去一定数量。仅限iOS
 * @param num {number} 默认为1，大于0的整数
 */
function reduceBadge(num){
	if(device.platform != 'iOS'){
		return;
	}
	num = parseInt(num);
	if(isNaN(num) || num <= 0){
		num = 1;
	}
	var jpush = window.plugins.jPushPlugin;
	var badgeNum = Math.max(getBadge() - num, 0);
	jpush.setApplicationIconBadgeNumber(badgeNum);
	jpush.setBadge(badgeNum);
	setBadge(badgeNum);
}
notification.reduceBadge = reduceBadge;


/**
 * 捕获音频
 * @param cb {function(Error, audio)} 回调。audio包含url、type、size
 */
function captureAudio(cb){
	var c = navigator.device && navigator.device.capture;
	if(!c){
		return cb(new Error('音频捕获没有准备好'));
	}
	c.captureAudio(function (audios) {
		audios = audios.map(function (o) {
			return {
				url: o.localURL,
				type: o.type,
				size: o.size
			}
		});
		cb(null, audios[0]);
	}, function (err) {
		cb(handleMediaCaptureErr(err));
	});
}

/**
 * 捕获视频
 * @param duration {Number} 录制时长，单位s。不一定生效
 * @param cb {function(Error, video)} 回调。video包含url、type、size
 */
function captureVideo(duration, cb){
	var c = navigator.device && navigator.device.capture;
	if(!c){
		return cb(new Error('视频捕获没有准备好'));
	}
	duration = +duration;
	if(isNaN(duration)){
		duration = 0;
	}
	c.captureVideo(function (videos) {
		videos = videos.map(function (o) {
			return {
				url: o.localURL,
				type: o.type,
				size: o.size
			}
		});
		cb(null, videos[0]);
	}, function (err) {
		cb(handleMediaCaptureErr(err));
	}, {
		duration: duration
	});
}
/**
 * 统一处理MediaCapture的错误信息
 * @param err
 * @returns {Error}
 */
function handleMediaCaptureErr(err){
	var msg;
	switch (err.code){
		case CaptureError.CAPTURE_INTERNAL_ERR: msg = '捕获失败';break;
		case CaptureError.CAPTURE_APPLICATION_BUSY: msg = '捕获设备正忙';break;
		case CaptureError.CAPTURE_INVALID_ARGUMENT: msg = '调用错误';break;
		case CaptureError.CAPTURE_NO_MEDIA_FILES: msg = '捕获取消';break;
		case CaptureError.CAPTURE_PERMISSION_DENIED: msg = '没有权限';break;
		case CaptureError.CAPTURE_NOT_SUPPORTED: msg = '不支持捕获';break;
		default: {
			if(err.toString().startsWith('No Activity found')){
				msg = '请安装用于捕获音频或视频的应用';
			}else{
				msg = '未知错误';
			}
		}
	}
	var e = new Error(msg);
	e.code = err.code;
	return e;
}
/**
 * 注册分享内容处理器
 * @param handle {function(Error, Object)} 返回结果包括type(可能为image, video, text, url, message, file或未知), value(text,url,message的内容), subject(url或message的主题，可能没有), items(包含mimetype,uri,extension)，注意uri要使用需要先解析为cdvfile协议url
 */
function initShare(handle){
	var intentPlugin = window.plugins && window.plugins.intent;
	if(!intentPlugin){
		throw new Error('intent plugin is not ready');
	}
	intentPlugin.initShare(handle);
}

/**
 * 对外分享
 * @param option {Object} 视情况传入相应字段，可能包含 message 文本, subject 主题(一般没用), files 文件路径(字符串或数组), url 链接。
 * @param cb {function(Error)}
 */
function share(option, cb){
	var ss = window.plugins && window.plugins.socialsharing;
	if(!ss){
		return cb(new Error('share is not ready'));
	}
	ss.shareWithOptions({
		message: option.message,
		subject: option.subject,
		files: option.files,
		url: option.url,
	}, function(result){
		// result.completed, result.app
		cb();
	}, function (msg) {
		cb(new Error(msg));
	});
}

//WavAudioEncoder.js
;(function(self) {
	var min = Math.min,
		max = Math.max;

	var setString = function(view, offset, str) {
		var len = str.length;
		for (var i = 0; i < len; ++i)
			view.setUint8(offset + i, str.charCodeAt(i));
	};

	var Encoder = function(sampleRate, numChannels) {
		this.sampleRate = sampleRate;
		this.numChannels = numChannels;
		this.numSamples = 0;
		this.dataViews = [];
	};

	Encoder.prototype.encode = function(buffer) {
		var len = buffer[0].length,
			nCh = this.numChannels,
			view = new DataView(new ArrayBuffer(len * nCh * 2)),
			offset = 0;
		for (var i = 0; i < len; ++i)
			for (var ch = 0; ch < nCh; ++ch) {
				var x = buffer[ch][i] * 0x7fff;
				view.setInt16(offset, x < 0 ? max(x, -0x8000) : min(x, 0x7fff), true);
				offset += 2;
			}
		this.dataViews.push(view);
		this.numSamples += len;
	};

	Encoder.prototype.finish = function(mimeType) {
		var dataSize = this.numChannels * this.numSamples * 2,
			view = new DataView(new ArrayBuffer(44));
		setString(view, 0, 'RIFF');
		view.setUint32(4, 36 + dataSize, true);
		setString(view, 8, 'WAVE');
		setString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, this.numChannels, true);
		view.setUint32(24, this.sampleRate, true);
		view.setUint32(28, this.sampleRate * 4, true);
		view.setUint16(32, this.numChannels * 2, true);
		view.setUint16(34, 16, true);
		setString(view, 36, 'data');
		view.setUint32(40, dataSize, true);
		this.dataViews.unshift(view);
		var blob = new Blob(this.dataViews, { type: 'audio/wav' });
		this.cleanup();
		return blob;
	};

	Encoder.prototype.cancel = Encoder.prototype.cleanup = function() {
		this.numSamples = 0;
		this.dataViews = [];
	};

	self.WavAudioEncoder = Encoder;
})(self);

/*
 * AudioRecorder
 * 使用audioinput本地接口
 */
(function () {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	/**
	 * 录音器
	 * @constructor
	 */
	function AudioRecorder(){
		if(!window.audioinput){
			throw new Error('audioinput is not ready');
		}
		this.cfg = {
			sampleRate: device.platform == 'iOS' ? audioinput.SAMPLERATE.CD_HALF_22050Hz : audioinput.SAMPLERATE.TELEPHONE_8000Hz,//TODO 等待修复
			channels: audioinput.CHANNELS.MONO,
			format: audioinput.FORMAT.PCM_16BIT,
			normalize: true,
			normalizationFactor: 32767.0,
			audioSourceType: audioinput.AUDIOSOURCE_TYPE.DEFAULT
		};
		this.cfg.bufferSize = 0.5 * this.cfg.channels * this.cfg.sampleRate;
		//是否震动提示
		this.isVibrate = false;
		this.noiseThreshold = 0;
		//多个声道在一个数组交错
		this.data = [];
		this.audioContext = null;
		this.source = null;
		this.wav;
		this.destroyed = false;
		Object.defineProperty(this, 'isCapturing', {
			get: function () {
				return audioinput.isCapturing();
			}
		});
		Object.defineProperty(this, 'duration', {
			get: function () {
				return this.data.length / this.cfg.channels / this.cfg.sampleRate;
			}
		});
		var _this = this;
		this.audioinput = function (event) {
			var data = event.data;
			_this.data = _this.data.concat(data);
			if(typeof _this.ondata == 'function'){
				_this.ondata(data.slice(0));
			}

			//声音检测震动
			if(_this.isVibrate == true){
				_this.noiseThreshold = device.platform == 'iOS' ? 0.008 : 0.015;
				// if(_this.noiseThreshold == 0){
				// 	var offset = -1, length = Math.max(Math.min(50, data.length), 1), filterArr = [];
				// 	for (var i = 0; i < data.length; i++) {
				// 		if (offset == -1 && data[i] != 0) {
				// 			offset = i;
				// 		}
				// 		if(offset != -1){
				// 			if(i >= offset + length){
				// 				break;
				// 			}
				// 			filterArr.push(Math.abs(data[i]));
				// 		}
				// 	}
				// 	//求其中最大的一部分的平均值作为阈值
				// 	var sliceLen = Math.min(Math.max(parseInt(filterArr.length / 10), 5), filterArr.length);
				// 	_this.noiseThreshold = filterArr.sort(function (o1, o2) {
				// 			return o1 < o2;
				// 		}).slice(0, sliceLen).reduce(function (d, o, i) {
				// 		return d + o;
				// 	}) / sliceLen * 2;
				// }
				var dataLen = data.length, _duration = dataLen / _this.cfg.channels / _this.cfg.sampleRate * 1000, interval = 50, step = parseInt(dataLen / (_duration / interval));
				var i = 0;
				while (i < dataLen) {
					var subArr = data.slice(i, i + step);
					subArr = subArr.sort(function (o1, o2) {
						return Math.abs(o1) < Math.abs(o2);
					}).slice(0, Math.max(parseInt(step / 10), 40));
					var average = subArr.reduce(function (sum, o) {
							return sum + Math.abs(o);
						}, 0) / subArr.length;
					console.log(average)
					if (average >= _this.noiseThreshold) {
						vibrate(10);
						break;
					}
					i += step;
				}
				// data.reduce(function (sum, o, i) {
				// 	if(i % step == 0){
				// 		if(sum / step >= _this.noiseThreshold){
				// 			vibrate(interval);
				// 		}
				// 		return 0;
				// 	}else{
				// 		return sum + Math.abs(o);
				// 	}
				// }, 0);
			}
		};
		this.audioinputerror = function (event) {
			if(typeof _this.onerror == 'function'){
				_this.onerror(new Error(event.message));
			}
		}
		window.addEventListener("audioinput", this.audioinput, false);
		window.addEventListener("audioinputerror", this.audioinputerror, false);
	}
	/**
	 * 接收错误
	 */
	AudioRecorder.prototype.onerror = null;
	/**
	 * 接收录音数据
	 */
	AudioRecorder.prototype.ondata = null;

	/**
	 * 开始录音
	 * @param isVibrate {boolean} 是否震动
	 */
	AudioRecorder.prototype.start = function (isVibrate) {
		if(this.destroyed){
			throw new Error('this instance has been destroyed');
		}
		this.clean();
		audioinput.start(this.cfg);
		if(this.isVibrate = isVibrate == true){
			vibrate();
		}
	}
	/**
	 * 停止录音
	 */
	AudioRecorder.prototype.stop = function () {
		if(this.isCapturing){
			audioinput.stop();
		}
	}
	/**
	 * 开始播放
	 */
	AudioRecorder.prototype.play = function () {
		var data = this.data;
		if(data.length > 0){
			var cfg = this.cfg,
				channels = cfg.channels,
				audioContext = this.audioContext ? this.audioContext : (this.audioContext = new AudioContext()),
				source = this.source = audioContext.createBufferSource(),
				audioBuffer = audioContext.createBuffer(channels, data.length / channels, cfg.sampleRate);
			if (channels > 1) {
				for (var i = 0; i < channels; i++) {
					var chdata = [], index = 0;
					while (index < data.length) {
						chdata.push(data[index + i]);
						index += channels;
					}
					audioBuffer.getChannelData(i).set(chdata);
				}
			} else {
				audioBuffer.getChannelData(0).set(data);
			}
			source.buffer = audioBuffer;
			source.connect(audioContext.destination);
			source.start(0);
		}
	}
	/**
	 * 停止播放
	 */
	AudioRecorder.prototype.stopPlay = function () {
		var source = this.source;
		if(source != null){
			source.stop();
		}
	}
	/**
	 * 获得录音wav文件
	 * @return {Blob} 录音文件
	 */
	AudioRecorder.prototype.toWAV = function () {
		if(this.data.length > 0){
			var data = [this.data];
			if(this.cfg.channels == 2){
				data = data[0].reduce(function (des, o, i) {
					des[i % 2][(i - i % 2) / 2] = o;
					return des;
				}, [[], []]);
			}
			var e = new WavAudioEncoder(this.cfg.sampleRate, this.cfg.channels);
			e.encode(data);
			return this.wav = e.finish();
		}
	}
	/**
	 * 清理录音数据
	 */
	AudioRecorder.prototype.clean = function () {
		this.data = [];
		this.source = null;
		this.audioContext = null;
		this.wav = null;
		this.isVibrate = false;
		this.noiseThreshold = 0;
	}
	/**
	 * 销毁录音器
	 */
	AudioRecorder.prototype.destroy = function () {
		if(!this.destroyed){
			this.destroyed = true;
			this.stop();
			this.stopPlay();
			this.clean();
			window.removeEventListener("audioinput", this.audioinput, false);
			window.removeEventListener("audioinputerror", this.audioinputerror, false);
		}
	}

	self.AudioRecorder = AudioRecorder;
})(self);

//CameraPreviewer
;(function () {
	var VideoSource = {
		environment: null,
		user: null
	};
	window.MediaStreamTrack && MediaStreamTrack.getSources(function(sources){
		sources.forEach(function (source) {
			if(source.kind == 'video'){
				VideoSource[source.facing] = source.id;
			}
		});
	});
	/**
	 * 相机预览
	 * @param div {HTMLDivElement} 用于预览摄像头画面，宽高须和option中相同，内部为空。iOS不需要
	 * @param option {object} height,width(最小宽高，Android为div的宽高) facing(front|back)摄像头方向 offsetX,offsetY(iOS下用于屏幕定位，注意预览框不随滚动条移动)。设备不满足要求会报错
	 * @constructor
	 */
	function CameraPreviewer(div, option) {
		if(!window.device){
			throw new Error('device is not ready');
		}
		Object.defineProperty(this, 'isIOS', {value: device.platform == 'iOS'});
		if(this.isIOS){
			var cp = cordova.plugins && cordova.plugins.camerapreview;
			if(!cp){
				throw new Error('CameraPreview is not ready');
			}
			Object.defineProperty(this, 'cp', {value: cordova.plugins.camerapreview});
		}else{
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
			if (!navigator.getUserMedia) {
				throw new Error('GetUserMedia not be supported');
			}
			Object.defineProperty(this, 'stream', {value: null, writable: true});
			if (div instanceof HTMLDivElement == false) {
				throw new Error('div requries HTMLDivElement');
			}
			div.style.overflow = 'hidden';
			var video = document.createElement('video');
			video.style.position = 'relative';
			div.appendChild(video);
			Object.defineProperties(this, {
				'div': {value: div},
				'video': {value: video}
			});
		}
		var option = option || {};
		Object.defineProperties(this, {
			'height': {value: option.height || 480},
			'width': {value: option.width || 320},
			'facing': {value: option.facing == 'front' ? 'front' : 'back', writable: true}
		});
		if(this.isIOS){
			Object.defineProperties(this, {
				'offsetX': {value: typeof option.offsetX == 'number' ? option.offsetX : 0},
				'offsetY': {value: typeof option.offsetY == 'number' ? option.offsetY : 0}
			});
		}else{
			Object.defineProperties(this, {
				'originHeight': {
					value: null,
					writable: true
				}, 'originWidth': {
					value: null,
					writable: true
				}
			});
			div.style.width = this.width + 'px', div.style.height = this.height + 'px';
		}
		Object.defineProperty(this, '_onerror', {
			value: function (err) {
				if(typeof this.onerror == 'function'){
					this.onerror(err);
				}
			}
		});
	}
	CameraPreviewer.prototype.onerror = null;
	CameraPreviewer.prototype.start = function() {
		var _this = this;
		if(this.isIOS){
			this.cp.startCamera({
				x: this.offsetX, y: this.offsetY, width: this.width, height: this.height
			}, this.facing, false, false, true);
		}else{
			navigator.getUserMedia({
					video: {
						width: {min: Math.max(this.width, this.height), ideal: Math.max(this.width, this.height)},
						height: {min: Math.min(this.width, this.height), ideal: Math.min(this.width, this.height)},
						mandatory: {
							sourceId: VideoSource[this.facing == 'front' ? 'user' : 'environment'],
						}
					}
				}, function (stream) {
					_this.stream = stream;
					var video = _this.video;
					video.src = window.URL.createObjectURL(stream);
					video.onloadedmetadata = function () {
						video.play();
						_this.originHeight = video.videoHeight, _this.originWidth = video.videoWidth;
						video.style.top = (_this.originHeight <= _this.height ? 0 : ((_this.height - _this.originHeight) / 2)) + 'px';
						video.style.left = (_this.originWidth <= _this.width ? 0 : ((_this.width - _this.originWidth) / 2)) + 'px';
					};
				}, function (err) {
					if(err.constructor.name == 'NavigatorUserMediaError' && err.message == ''){
						var _err = new Error();
						_err.name = err.name, err.constraintName = _err.constraintName;
						if(err.name == 'ConstraintNotSatisfiedError'){
							_err.message = 'Camera cannot satisfy required value of ' + err.constraintName;
						}else if(err.name == 'PermissionDeniedError'){
							_err.message = 'Camera permission denied';
						}else if(err.name == 'DevicesNotFoundError'){
							_err.message = 'Camera not found, maybe permission denied';
						}else{
							_err.message = err.message || err.name;
						}
						err = _err;
					}
					_this._onerror(err);
				}
			);
		}
	}
	CameraPreviewer.prototype.stop = function () {
		if(this.isIOS){
			this.cp.stopCamera();
		}else{
			if(this.stream && this.stream.active){
				this.stream.getTracks().forEach(function (track) {
					track.stop();
				});
				this.stream = null;
			}
		}
	}
	/**
	 * 捕获预览照片
	 * @param cb {function(String)} 返回dataURL(Android)或cdvfile url(iOS)。错误由onerror返回
	 */
	CameraPreviewer.prototype.capture = function (cb) {
		var _this = this;
		if(this.isIOS){
			this.cp.setOnPictureTakenHandler(function(result){
				resolveURLToCdv(result[1], function(err, url){
					if(err){
						_this._onerror(err);
					}else{
						cb(url);
					}
				});
			});
			this.cp.takePicture();
		}else{
			if(this.stream == null){
				return this._onerror(new Error('Camera has stoped'));
			}
			var canvas = document.createElement('canvas');
			canvas.width = this.width, canvas.height = this.height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(this.video, -parseFloat(this.video.style.left), -parseFloat(this.video.style.top), this.width, this.height, 0, 0, this.width, this.height);
			cb(canvas.toDataURL('image/jpeg', 0.7));
		}
	}
	CameraPreviewer.prototype.switchFacing = function () {
		if(this.isIOS){
			this.cp.switchCamera();
		}else{
			if(this.stream == null){
				return;
			}
			this.facing = this.facing == 'back' ? 'front' : 'back';
			this.stop();
			this.start();
		}
	}

	self.CameraPreviewer = CameraPreviewer;
})(self);
/**
 * 震动
 * @param duration {number} 时长，单位ms，默认10ms
 */
function vibrate(duration){
	if(!navigator.vibrate){
		throw new Error('vibrate is not ready');
	}
	if(typeof duration != 'number' || duration <= 0){
		duration = 10;
	}
	navigator.vibrate(duration);
}
/**
 * 切换音源
 * @param from {string} speaker 喇叭, earpiece 听筒
 */
function toggleAudioSource(from){
	if(!window.AudioToggle){
		throw new Error('toggleAudioSource is not ready');
	}
	if(from == 'speaker'){
		AudioToggle.setAudioMode(AudioToggle.SPEAKER);
	}else{
		AudioToggle.setAudioMode(AudioToggle.EARPIECE);
	}
}
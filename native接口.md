### 所有联系人
```
/**
 * 让用户选取一个联系人
 * @param {function(Error, Object)} cb(err, contact) 返回err或联系人。contact：name(String),birthday(Date),address(Array),phone(Array),email(Array)
 */
function pickContact(cb)
```

### 列出所有联系人
```
/**
 * 列出所有联系人
 * @param {function(Error, Array)} cb(err ,contacts) 返回err，或者联系人数组。contact：name(String),birthday(Date),address(Array),phone(Array),email(Array)
 */
function listContact(cb)
```

### 从图片库选取图片
```
/**
 * 从图片库选取图片。height和width控制图片缩放，不会改变比例
 * @param {number} height 图片缩放高度
 * @param {number} width 图片缩放宽度
 * @param {function(Error, string)} cb(err, url) 返回err，或图片url(可能为dataurl或cdvfile)
 */
function selectPicFromLibrary(height, width, cb) 
```

### 使用相机捕获图片
```
/**
 * 使用相机捕获图片。height和width控制图片缩放，不会改变比例
 * @param {number} height 捕获图像高度
 * @param {number} width 捕获图像宽度
 * @param {string} direction front则使用前置摄像头，安卓无效
 * @param {function(Error, string])} cb(err, url) 返回err，或图片url(可能为dataurl或cdvfile)
 */
function capturePic(height, width, direction, cb) 
```

### 将url转换为文件
```
/**
 * 将url转换为文件
 * @param {string} url 文件的url，可接受data:image/的dataUrl或file:///或cdvfile://协议的文件
 * @param {function(Error, File)} cb(err, file) 返回err或file
 */
function getFile(url, cb) {
```

### 保存文件
```
/**
 * 保存文件到指定位置
 * @param dir {string} 目录。形如a/b/c，可以以/开头结尾
 * @param filename {string} 文件名
 * @param toSave {String|File|Blob} 要保存的文件，或网络链接
 * @param option {Object} isCache保存到缓存位置 默认true，isPrivate是否应用私有(iOS始终私有) 默认true，isAppend追加写入 默认false
 * @param {function(Error, String)} cb(err,url) 返回保存后的文件url
 */
function saveFile(dir, filename, toSave, option, cb)
```

### 删除文件或目录
```
/**
 * 删除文件，支持批量
 * @param paths {Array.<string>} 文件或目录的路径，必须是全路径
 */
function del(paths)
```

### 解析本地链接
```
/**
 * 将本地链接解析为cdvfile链接
 * @param url {String} file://开头的链接
 * @param cb {function(Error, String)} 返回cdvfile链接
 */
function resolveURLToCdv(url, cb)
```

### 获得当前位置的坐标信息
```
/**
 * 获得当前位置的坐标信息，编码为WGS-84
 * @param {number} accuracyLimit = 0 定位要求精度。默认为0，不限制
 * @param {function(Error, Position)} cb(err, position) 返回err，或position，包括coords坐标信息(accuracy精度、latitude纬度、longitude经度等)和timestamp
 */
function currentPosition(accuracyLimit, cb)
```

### 初始化通知
```
/**
 * 返回的notify，有title、content、msg_id、optional等字段。注意，ios没有title。
 * Android的receiveNotification，可以在后台触发。iOS的receiveNotification不会在后台触发，因此要根据msd_id来判断是否处理重复。
 * 初始化失败抛出错误
 * @param openNotificationCallback {function} 打开通知回调，返回notify。
 * @param receiveNotificationCallback {function} 收到通知回调，返回notify
 * @param receiveMessageCallback {function} 收到自定义消息回调，返回notify。ios没有msg_id
 */
notification.initNotification(openNotificationCallback, receiveNotificationCallback, receiveMessageCallback)
```

### 停止通知
```
/**
 * 停止推送通知
 */
notification.stopPush()
```

### 恢复通知
```
/**
 * 恢复推送通知
 */
notification.resumePush()
```

### 获取推送设备id
```
/**
 * 获取推送设备id
 * @param cb {function(string)} 返回id
 */
notification.getPushID(cb)
```

### 是否服务器关闭推送
```
/**
 * 是否服务器停止推送
 * @param cb {function(boolean)} true为关闭
 */
function isPushStopped(cb)
```

### 是否本地禁止通知
```
/**
 * 是否本地禁止通知
 * @param cb {function(boolean)} true为禁止
 */
function isPushDenied(cb)
```

### iOS获取当前角标数
```
/**
 * 获取当前通知角标数。仅限iOS
 * @returns {number}
 */
notification.getBadge()
```

### iOS减角标数
```
/**
 * 角标数字减去一定数量。仅限iOS
 * @param num {number} 默认为1，大于0的整数
 */
notification.reduceBadge(num)
```

### 捕获音频
```
/**
 * 捕获音频
 * @param cb {function(Error, audio)} 回调。audio包含url、type、size
 */
function captureAudio(cb)
```

### 捕获视频
```
/**
 * 捕获视频
 * @param duration {Number} 录制时长，单位s。不一定生效
 * @param cb {function(Error, video)} 回调。video包含url、type、size
 */
function captureVideo(duration, cb)
```

### 处理分享
```
/**
 * 注册分享处理器
 * @param handle {function(Error, Object)} 返回结果包括type(可能为image, video, text, url, message, file或未知), value(text,url,message的内容), subject(url或message的主题，可能没有), items(包含mimetype,uri,extension)，注意uri要使用需要先解析为cdvfile协议url
 */
function initShare(handle)
```

### 对外分享
```
/**
 * 对外分享
 * @param option {Object} 视情况传入相应字段，可能包含 message 文本, subject 主题(一般没用), files 文件路径(字符串或数组), url 链接。
 * @param cb {function(Error)}
 */
function share(option, cb)
```

### 实时录音
```
/**
 * 录音器
 * @param sampleRate {int} 频率，默认22050，最小22050
 * @param isStereo {boolean} 是否立体声
 * @constructor
 */
function AudioRecorder(sampleRate, isStereo)

//接收数据
AudioRecorder.ondata = function(data)
//接收错误
AudioRecorder.onerror = function(err)
//开始录制
AudioRecorder.start(isVibrate)
//停止录制
AudioRecorder.stop
//开始播放
AudioRecorder.play
//停止播放
AudioRecorder.stopPlay
//获取wav
AudioRecorder.toWAV
//清除录音数据
AudioRecorder.clean
//销毁实例
AudioRecorder.destroy
```

### 预览截取摄像头
```
/**
 * 相机预览
 * @param div {HTMLDivElement} 用于预览摄像头画面，宽高须和option中相同，内部为空。iOS不需要
 * @param option {object} height,width(最小宽高，Android为div的宽高) facing(front|back)摄像头方向 offsetX,offsetY(iOS下用于屏幕定位，注意预览框不随滚动条移动)。设备不满足要求会报错
 * @constructor
 */
function CameraPreviewer(div, option) {

//接收错误
CameraPreviewer.onerror = function(err);
//开始预览
CameraPreviewer.start
//停止预览
CameraPreviewer.stop
/**
 * 捕获预览照片
 * @param cb {function(String)} 返回dataURL(Android)或cdvfile url(iOS)。错误由onerror返回
 */
CameraPreviewer.capture(cb)
```

### 震动
```
/**
 * 震动
 * @param duration {number} 时长，单位ms，默认10ms
 */
function vibrate(duration)
```

### 切换音源
```
/**
 * 切换音源
 * @param from {string} speaker 喇叭, earpiece 听筒
 */
function toggleAudioSource(from)
```
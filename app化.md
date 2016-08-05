### 支持的本地接口
文档查看 _native接口.md _。
> 注意，所有本地接口的调用，都需要确保在document上的`deviceready`事件触发后。

* 相机：照相、选择图片
* 地理位置：获取当前位置
* 通讯录：选取联系人、所有联系人
* 推送通知：极光推送消息，需要全局加载（ios关闭推送同时需要提示用户关闭设置-通知<!--，silent-push功能无用-->）
* 支付：beecloud支付，仅限于安卓
* 媒体捕获：录制视频、录制音频、实时录制音频（暂时Audio.src不支持设置为cdvfile，需要转换为DataURL）、预览截取摄像头
* 对外分享
* 处理分享：仅限于Android，需要全局加载
* IM：融云cordova插件。相关接口自行调用。
* 存储：保存文件、获取本地文件、删除文件、解析本地链接
* 其他：震动、切换音源、平台相关接口

<a name="支持静态资源打包到 app 的特性"></a>
### 支持静态资源打包到 app 的特性
静态资源放入www下对应的文件夹，html中引用路径改为`cdvfile://localhost/<%=locals.cdv_appDir%>/www/path_to_file`。
>由于Android和iOS平台的appDir描述符不同，所以服务器需要根据userAgent指定。服务器代码：
```
//判断app来源平台
app.use('/', function (req, res, next) {
	var cdv_appDir;
	var userAgent = req.headers['user-agent'];
	if(userAgent.search(/iphone/i) >= 0){
		cdv_appDir = 'bundle';
	}else if(userAgent.search(/android/i) >= 0){
		cdv_appDir = 'assets';
	}else{
		//按需修改
		return res.send('错误请求');
	}
	res.locals.cdv_appDir = cdv_appDir;
	next();
});

```

> 要支持cdvfile协议url，Android平台需修改cordova-file插件的`AssetFilesystem.java`文件的下面方法为下述形式，并在config.xml添加`<access origin="cdvfile://*" />`，后者的缺失会导致error url schema

```
@Override
String filesystemPathForURL(LocalFilesystemURL url) {
    return new File(rootUri.getPath(), url.path).toString();
}
```

### 页面修改
__关于`<%=locals.cdv_appDir%>`，参照[上述][#支持静态资源打包到 app 的特性]。__

* 引入cordova.js `src='cdvfile://localhost/<%=locals.cdv_appDir%>/www/cordova.js'`
* 引入本地接口js `src='cdvfile://localhost/<%=locals.cdv_appDir%>/www/native.js'`
* app中打包的静态资源引用路径，css、js、img等，均为`cdvfile://`协议url
* CSP修改。加入标准的CSP（并包含`cdvfile:`协议），如果有其他需要修改的根据具体情况。
```
<meta http-equiv="Content-Security-Policy" content="default-src 'self' cdvfile: http: ws: data: gap: https://ssl.gstatic.com 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src * data: blob:">
```
* 控制页面UI的meta
```
	<meta name="format-detection" content="telephone=no">
	<meta name="msapplication-tap-highlight" content="no">
	<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">

```

### Cordova构建准备工作及注意事项
* config.xml的content设置为网站入口地址，并根据whitelist规定添加网站目录根路径和其他可能需要的部分
* 安装本地接口对应的插件
* 放入静态资源
* 支持cdvfile://引用静态资源特性。Android需要修改上面提到的File插件代码（未来可能修复此bug）
* build.json中放入应用签名信息
* AndroidManifest.xml添加Camera权限来支持WebRTC的getUserMedia
```
            <uses-permission android:name="android.permission.CAMERA" />
            <uses-feature android:name="android.hardware.camera" />
            <uses-feature android:name="android.hardware.camera.autofocus" />
```
* iOS必须有启动画面，否则屏幕尺寸有问题。包括contents.json和图片
* iOS无法使用也不需要amrnb.js来转换amr
const express = require('express');
const router = express.Router();
const cheerio = require('cheerio')
const request = require('superagent'); // 引入SuperAgent
require('superagent-proxy')(request);

const cn_ip = require('./catchIP')
const redis = require('./redis')
const uuid = require('uuid')
const crypto = require('crypto')

// const gulpfile = require('../gulpfile')
const domainUrl = "http://cshayne.cn"
const ENTER_KEY = ['19940815','zlywanan0115','a123456','cccccc']


const callbackModel = () => {
	return {
		flag: false,
		message: '',
		data: null
	}
}

router.use((req, res, next) => {
	// 中间件 - 指定的路由都将经过这里
	// 做访问拦截 - token验证等
	if ((req.url.indexOf('/login') !== -1) || req.session.user) {
		next()
		return
	}
	res.render('login', {
		title: '视频资源分享站',
		staticUrl: '/video_spider/vs',
		apiUrl: '/video_player'
	})
})


router.post('/login', function(req, res, next) {
	let info = callbackModel()
	let login_key = req.body.key
	console.log(req.body)
	console.log(login_key.indexOf(ENTER_KEY))
	if (ENTER_KEY.indexOf(login_key) !== -1) {
		req.session.user = {
			name: 'admin'
		}
		info.flag = true
		info.message = "登录成功"
		res.send(info)
		return false;
	}
	info.message = "密码错误!"
	res.send(info)
});



global.verifyKey = uuid.v4()

redis.getData('ipList').then((result) => {
	let ipArr
	if (!result) {
		ipArr = []
	} else {
		ipArr = result
		ipArr = JSON.parse(ipArr)
	}
	return cn_ip(ipArr)
}).then((info) => {
	let ipList = info.data
	console.log("==========================>")
	console.log(info.message)
	console.log("==========================>")
	generateKey()
	redis.setData('ipList', JSON.stringify(ipList))
		/* GET home page. */
	router.get('/', function(req, res, next) {
		res.render('index', {
			title: '视频资源站',
			staticUrl: '/video_spider/vs',
			apiUrl: '/video_player',
			verifyKey: global.verifyKey
		});
	});

	router.post('/gen_video', function(req, res, next) {
		let exTime = 24 * 60 * 60
		console.log(req.body.videoName)
		let key = crypto.createHash('sha1').update(req.body.videoName).digest('hex')
		redis.setData(key, req.body.data, exTime)
		res.send({
			url: domainUrl + '/video_player/video?key=' + key
		})
	});

	router.post('/searchVideo', function(req, res, next) {
		let videoName = req.body.videoName
		let info = callbackModel()
		if (!videoName) {
			info.message = "视频名称不能为空"
			res.send(info)
			return false
		} else {
			request // 发起请求
				.get('http://www.soku.com/search_video/q_' + encodeURI(videoName))
				.proxy(ipList[0] ? ipList[0] : null)
				.timeout({
					response: 5000, // Wait 5 seconds for the server to start sending,
					deadline: 20000, // but allow 1 minute for the file to finish loading.
				})
				.end((err, respons) => {
					if (err) {
						info.message = '服务器连接出错' + err + "\n请重试一下哦～"
						console.log("搜索引擎响应错误---------，\n请重试一下哦～");
						ipList.splice(0, 1)
						res.send(info)
					} else {
						let body = respons.text;
						const $ = cheerio.load(body)
						let videoList = []
						let re = /http/
						$(".s_dir").each(function(index, el) {
							// console.log('==================>')
							// console.log(index)
							// console.log('==================>')
							if (!$(el).find(".base_name").length) {
								return true;
							}
							let videoData = {
								name: $(el).find(".base_name").html().replace(/<[^>]+>/g, ""),
								list: [],
								thumb: $(el).find(".s_target>img").length ? $(el).find(".s_target>img").attr('src') : null
							}
							let items = $(el).find(".s_items")
							let movies = $(el).find(".s_act")
							if (items.length) {
								items.each(function(index, el) {
									videoData.list[index] = []
									$(el).find('ul li a').each(function(index2, el2) {
										let vu = $(el2).attr('href')
										videoData.list[index].push({
											num: $(el2).find('span').html(),
											url: new Buffer(re.test(vu) ? vu : ('http://' + vu.replace(/\/\//, ''))).toString('base64'),
											verifyKey: global.verifyKey
										})
									});
								});
							} else if (movies.length) {
								movies.each(function(index, el) {
									videoData.list[index] = []
									$(el).find('.btn_play').each(function(index2, el2) {
										let vu = $(el2).attr('href')
										videoData.list[index].push({
											num: $(el2).attr('_log_title'),
											url: new Buffer(re.test(vu) ? vu : ('http://' + vu.replace(/\/\//, ''))).toString('base64'),
											verifyKey: global.verifyKey
										})
									});
								});
							}
							videoList.push(videoData)
						});
						if (!videoList.length) {
							if ($(".sk_null").length) {
								info.message = '服务器连接出错---被屏蔽，\n请重试一下哦～'
								console.log("搜索引擎响应错误---------被屏蔽，\n请重试一下哦～");
								ipList.splice(0, 1)
								res.send(info)
								return
							}
							info.flag = true
							info.message = "获取成功"
							info.data = videoList
							res.send(info)
							return
						}
						console.log(videoList)
						info.flag = true
						info.message = "获取成功"
						info.data = videoList
						res.send(info)
					}
				});
		}
	});
	// 15分钟更新一次ip池
	setInterval(() => {
		cn_ip(ipList).then((info) => {
			ipList = info.data
			redis.setData('ipList', JSON.stringify(ipList))
		}).catch((info) => {
			console.log("==========================>")
			console.log(info.message)
			console.log("==========================>")
		})
	}, 1000 * 60 * 15)

}).catch((info) => {
	console.log("==========================>")
	console.log(info)
	console.log("==========================>")
})

// 24小时更新一次key
setInterval(() => {
	generateKey()
}, 1000 * 60 * 60 * 24)

function generateKey() {
	global.verifyKey = uuid.v4()
	let time = 24 * 60 * 60 * 3
	redis.setData(global.verifyKey, global.verifyKey, time)
	console.log("秘钥生成完成..")
}


module.exports = router;
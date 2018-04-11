const express = require('express');
const router = express.Router();
// const request = require('request')
const cheerio = require('cheerio')

const request = require('superagent'); // 引入SuperAgent
require('superagent-proxy')(request);

const cn_ip = require('./catchIP')

// const gulpfile = require('../gulpfile')


const callbackModel = () => {
	return {
		flag: false,
		message: '',
		data: null
	}
}

global.verifyKey = new Buffer(Math.random() * 99999999 + '').toString('base64')


cn_ip([]).then((info) => {
	let ipList = info.data
		/* GET home page. */
	router.get('/', function(req, res, next) {
		res.render('index', {
			title: '视频资源站',
			staticUrl: '/video_spider/vs',
			apiUrl: '/video_player',
			verifyKey: global.verifyKey
		});
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
				.end((err, respons) => {
					if (err) {
						info.message = '服务器连接出错' + err
						console.log("错误")
						ipList.splice(0, 1)
						res.send(info)
					} else {
						let body = respons.text;
						const $ = cheerio.load(body)
						let videoList = []
						let re = /http/
						$(".s_dir").each(function(index, el) {
							console.log('==================>')
							console.log(index)
							console.log('==================>')
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
											verifyKey: verifyKey
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
											verifyKey: verifyKey
										})
									});
								});
							}
							videoList.push(videoData)
						});
						info.flag = true
						info.message = "获取成功"
						info.data = videoList
						res.send(info)
					}
				});
		}
	});
	// 三小时更新一次ip池
	setInterval(() => {
		cn_ip(ipList).then((info) => {
			ipList = info.data
		}).catch((info) => {
			console.log("==========================>")
			console.log(info.message)
			console.log("==========================>")
		})
	}, 1000 * 60 * 60 * 3)

}).catch((info) => {
	console.log("==========================>")
	console.log(info.message)
	console.log("==========================>")
})


// 24小时更新一次key
setInterval(() => {
	global.verifyKey = new Buffer(Math.random() * 99999999 + '').toString('base64')
}, 1000 * 60 * 60 * 24)



module.exports = router;
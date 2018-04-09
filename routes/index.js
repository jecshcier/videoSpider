const express = require('express');
const router = express.Router();
// const request = require('request')
const cheerio = require('cheerio')

const request = require('superagent'); // 引入SuperAgent
require('superagent-proxy')(request);

// const gulpfile = require('../gulpfile')

const callbackModel = () => {
	return {
		flag: false,
		message: '',
		data: null
	}
}

global.verifyKey = new Buffer(Math.random() * 99999999 + '').toString('base64')

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: '视频资源站',
		staticUrl: '/video_spider/vs',
		apiUrl: '/video_player/'
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
			// .proxy("http://117.185.105.114:8060")
			.end((err, respons) => {
				if (err) {
					info.message = err
					console.log("错误")
					res.send(info)
				} else {
					let body = respons.text;
					console.log(body)
					const $ = cheerio.load(body)
					let videoList = []
					let re = /http/
					$(".s_dir").each(function(index, el) {
						console.log('==================>')
						console.log(index)
						console.log('==================>')
						console.log($(el).html())
						if (!$(el).find(".base_name").length) {
							return true;
						}
						let videoData = {
							name: $(el).find(".base_name").html().replace(/<[^>]+>/g, ""),
							list: [],
							thumb: $(el).find(".s_target>img").length ? $(el).find(".s_target>img").attr('src') : null
						}
						$(el).find(".s_items").each(function(index, el) {
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

setInterval(() => {
	global.verifyKey = new Buffer(Math.random() * 99999999 + '').toString('base64')
}, 1000 * 60 * 60 * 24)



module.exports = router;
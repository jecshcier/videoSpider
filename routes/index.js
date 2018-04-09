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

/* GET home page. */
router.get('/index', function(req, res, next) {
	res.render('index', {
		title: '视频资源站',
		staticUrl: '/video_spider/vs',
		apiUrl: '/video_spider/video_player/'
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
								videoData.list[index].push({
									num: $(el2).find('span').html(),
									url: new Buffer($(el2).attr('href')).toString('base64')
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

/* GET home page. */
router.get('/video_player/:line/:url', function(req, res, next) {
	let lineNum = req.params.line
	let videoUrl = req.params.url
	let line = ["http://api.baiyug.cn/vip/index.php?url=",
		"http://jx.vgoodapi.com/jx.php?url=",
		"http://000o.cc/jx/ty.php?url=",
		"http://www.dgua.xyz/webcloud/?url=",
		"http://player.jidiaose.com/supapi/iframe.php?v=",
		"http://jx.ejiafarm.com/x/jiexi.php?url=",
		"http://api.wlzhan.com/sudu/?url="
	]
	console.log(videoUrl)

	res.render('video_player', {
		title: '--视频播放--',
		staticUrl: '/video_spider/vs',
		videoUrl: line[lineNum] + new Buffer(videoUrl, 'base64').toString()
	});
});


module.exports = router;
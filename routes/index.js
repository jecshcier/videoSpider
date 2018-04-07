const express = require('express');
const router = express.Router();
const request = require('request')
const cheerio = require('cheerio')

// const gulpfile = require('../gulpfile')

const callbackModel = () => {
	return {
		flag: false,
		message: '',
		data: null
	}
}

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {
		title: '视频资源站',
		staticUrl: '/vs',
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
		request.get({
			url: 'http://www.soku.com/search_video/q_' + encodeURI(videoName)
		}, function optionalCallback(err, httpResponse, body) {
			if (err) {
				info.message = err
				console.log("错误")
				res.send(info)
			} else {
				console.log(body)
				const $ = cheerio.load(body)
				let videoList = []
				$(".s_dir").each(function(index, el) {
					console.log(index)
					if(!$(el).find(".base_name").length){
						return true;
					}
					let videoData = {
						name: $(el).find(".base_name").html().replace(/<[^>]+>/g, ""),
						list: [],
						thumb:$(el).find(".s_target>img").length ? $(el).find(".s_target>img").attr('src'):null
					}
					$(el).find(".s_items").each(function(index, el) {
						videoData.list[index] = []
						$(el).find('ul li a').each(function(index2, el2) {
							videoData.list[index].push({
								num:$(el2).find('span').html(),
								url:$(el2).attr('href')
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
		})
	}
});

module.exports = router;
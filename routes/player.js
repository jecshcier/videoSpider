const express = require('express');
const router = express.Router();
const redis = require('./redis')

/* GET home page. */
router.get('/', function(req, res, next) {
	let lineNum = req.query.line
	let videoUrl = req.query.key
	let verifyKey = req.query.v
	redis.getData(verifyKey).then((result) => {
		if (!result || (verifyKey !== result)) {
			res.send({
				message: '页面已过期'
			})
			return;
		}
		let line = ["http://api.baiyug.cn/vip/index.php?url=",
			"http://jx.vgoodapi.com/jx.php?url=",
			"http://000o.cc/jx/ty.php?url=",
			"http://www.dgua.xyz/webcloud/?url=",
			"http://player.jidiaose.com/supapi/iframe.php?v=",
			"http://jx.ejiafarm.com/x/jiexi.php?url=",
			"http://api.wlzhan.com/sudu/?url="
		]
		console.log(new Buffer(videoUrl, 'base64').toString())
		res.render('video_player', {
			title: '--视频播放--',
			staticUrl: '/video_spider/vs',
			videoUrl: line[lineNum] + new Buffer(videoUrl, 'base64').toString()
		});
	}).catch((e) => {
		res.send({
			message: '页面已过期'
		})
	})

});

router.get('/video', function(req, res, next) {
	let key = req.query.key
	redis.getData(key).then((result) => {
		if (result) {
			let data = JSON.parse(result)
			res.render('video_share', {
				title: data.name,
				staticUrl: '/video_spider/vs',
				data: data.data
			});
			return;
		}
		res.send("error")
	}).catch((e) => {
		res.send("error" + e)
	})
});


module.exports = router
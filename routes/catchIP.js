const request = require('superagent'); // 引入SuperAgent
require('superagent-proxy')(request);
const cheerio = require('cheerio')

const callbackModel = () => {
	return {
		flag: false,
		message: '',
		data: null
	}
}

const cn_ip = (ipList) => {
	let info = callbackModel()
	return new Promise((resolve, reject) => {
		verifyIP(ipList).then(() => {
			if (ipList.length >= 20) {
				info.message = "当前ip数量" + ipList.length + "----->ip资源充足，不需要爬取"
				reject(info)
				return;
			}
			catchIP(ipList, 1, (ok, data) => {
				if (ok) {
					console.log("ip爬取完成 -> 共计" + data.length + '个IP')
					info.flag = true
					info.message = "ip爬取完成 -> 共计" + data.length + '个IP'
					info.data = data
					resolve(info)
				} else {
					info.message = data
					reject(info)
				}
			})
		}).catch((e) => {
			console.log(e)
		})
	})
}

function catchIP(ipList, page, callback) {
	request // 发起请求
		.get('http://free-proxy.cz/zh/proxylist/country/CN/all/uptime/all/' + page)
		.end((err, respons) => {
			if (err || !respons) {
				console.log(err)
				console.log(respons)
				callback(false, '错误：' + err + '--响应：' + respons)
				return;
			}
			let body = respons.text;
			const $ = cheerio.load(body)
			let currentIPList = []
				// console.log($("#proxy_list > tbody > tr").length)
			$("#proxy_list > tbody > tr").each(function(index, el) {
				let ipTd = $(el).find("td").eq(0).children('script')
				let ipPort = $(el).find("td").eq(1).children('.fport').html()
					// console.log(ipTd)
				if (ipTd.length) {
					let ipProtocol = $(el).find("td").eq(2).children('small').html().toLowerCase()
					if (ipProtocol === 'http' || ipProtocol === 'https') {
						let ipUrl = ipTd.html().replace(/document\.write\(Base64\.decode\(\"/, '').replace(/\"\)\)/, '')
						ipUrl = new Buffer(ipUrl, 'base64').toString()
						currentIPList.push(ipProtocol + '://' + ipUrl + ':' + ipPort)
					}
					return true
				}
			});
			// 获取可用ip
			console.log(currentIPList)
				// 过滤ip

			verifyIP(currentIPList).then((vedIPList) => {
				page++;
				ipList = ipList.concat(vedIPList)
				ipList = Array.from(new Set(ipList));
				(page > 5) ? callback(true, ipList): ((ipList.length < 20) ? catchIP(ipList, page, callback) : (callback(true, ipList)))
			}).catch((e) => {
				console.log(e)
			})

			// setTimeout(() => {
			// 	// ip不足时，继续爬取
			// }, 5000)
		})
}


// 验证IP
function verifyIP(ipList) {
	let vedIP = []
	for (let i = 0; i < ipList.length; i++) {
		request // 发起请求
			.get('http://ip.chinaz.com/getip.aspx')
			.proxy(ipList[i])
			.timeout({
				response: 3000, // Wait 5 seconds for the server to start sending,
				deadline: 60000, // but allow 1 minute for the file to finish loading.
			})
			.end((err, respons) => {
				if (err || !respons) {
					console.log("----------------------------------->")
					console.log(ipList[i] + "的测试结果：")
					console.log("------------无效-------------->")
					console.log(err)
					console.log(respons)
				}
				console.log("----------------------------------->")
				console.log(ipList[i] + "的测试结果：")
				console.log("------------通过-------------->")
				vedIP.push(ipList[i])
			})
	}

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(vedIP)
		}, 5000)
	})
}


module.exports = cn_ip
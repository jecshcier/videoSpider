const request = require('superagent'); // 引入SuperAgent
require('superagent-proxy')(request);
const cheerio = require('cheerio')
const redis = require('./redis')
const ipMaxLen = 100

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
		verifyIP(ipList).then((vedIP) => {
			ipList = vedIP
			if (ipList.length >= ipMaxLen) {
				console.log("当前ip池---")
				console.log(ipList)
				info.flag = true
				info.data = ipList
				info.message = "当前ip数量" + ipList.length + "----->ip资源充足，不需要爬取"
				resolve(info)
				return;
			}
			console.log("ip数量不足----剩余--" + ipList.length + "个")
			catchIP(ipList, 1, (ok, data) => {
				if (ok) {
					console.log("ip爬取完成 -> 共计" + data.length + '个IP')
					console.log("当前ip池---")
					console.log(data)
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
		.timeout({
			response: 5000, // Wait 5 seconds for the server to start sending,
			deadline: 10000, // but allow 1 minute for the file to finish loading.
		})
		.end((err, respons) => {
			if (err || !respons) {
				console.log(err)
				console.log(respons)
					// callback(false, '错误：' + err + '--响应：' + respons)
				catchIP2(ipList, 1, callback)
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

			// 验证当前页面的ip队列，验证成功后拼接到ip地址池中。
			verifyIP(currentIPList).then((vedIPList) => {
				page++;
				ipList = ipList.concat(vedIPList)
				ipList = Array.from(new Set(ipList));
				(page > 5) ? callback(true, ipList): ((ipList.length < ipMaxLen) ? catchIP(ipList, page, callback) : (callback(true, ipList)))
			}).catch((e) => {
				console.log(e)
			})
		})
}

function catchIP2(ipList, page, callback) {
	request // 发起请求
		.get('http://proxy-list.org/english/search.php?search=CN&country=CN&type=any&port=any&ssl=any&p=' + page)
		.timeout({
			response: 10000, // Wait 5 seconds for the server to start sending,
			deadline: 60000, // but allow 1 minute for the file to finish loading.
		})
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
			$(".table").eq(0).find('ul').each(function(index, el) {
				let ipTd = $(el).find(".proxy").children('script')
				if (ipTd.length) {
					let ipProtocol = $(el).find(".https").html().toLowerCase()
					if (ipProtocol === 'http' || ipProtocol === 'https') {
						let ipUrl = ipTd.html().replace(/Proxy\(\'/, '').replace(/'\)/, '')
						ipUrl = new Buffer(ipUrl, 'base64').toString()
						currentIPList.push(ipProtocol + '://' + ipUrl)
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
				(page > 2) ? callback(true, ipList): ((ipList.length < ipMaxLen) ? catchIP2(ipList, page, callback) : (callback(true, ipList)))
			}).catch((e) => {
				console.log(e)
			})
		})
}


// 验证IP
function verifyIP(ipList) {
	return new Promise((resolve, reject) => {
		let vedIP = []
		let ipNum = 0
		let count = 0
		let verInt = setInterval(() => {
			let currentN = ipNum
			if (ipNum === ipList.length) {
				clearInterval(verInt)
				return;
			}
			request // 发起请求
				.get('http://ip.chinaz.com/getip.aspx')
				.proxy(ipList[ipNum])
				.timeout({
					response: 8000, // Wait 5 seconds for the server to start sending,
					deadline: 60000, // but allow 1 minute for the file to finish loading.
				})
				.end((err, respons) => {
					if (err || !respons) {
						console.log("----------------------------------->")
						console.log(ipList[currentN] + "的测试结果：")
						console.log("------------无效-------------->")
							// console.log(err)
							// console.log(respons)
					} else {
						console.log("----------------------------------->")
						console.log(ipList[currentN] + "的测试结果：")
						console.log("------------通过-------------->")
						vedIP.push(ipList[currentN])
					}
					if (count === ipList.length - 1) {
						resolve(vedIP)
						console.log("push")
					}
					count++;
				})
			ipNum++
		}, 100)
	})
}


module.exports = cn_ip
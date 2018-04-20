var lineNum = 0
$("input[name=changeLine]").change(function(event) {
	lineNum = parseInt($(this).attr('url'));
	if (!$(".list>li>a").length) {
		return;
	}
	alert("切换线路中，请稍后!")

	$(".list>li>a").each(function(index, el) {
		var url = $(this).attr('url')
		$(this).attr('href', apiUrl + '?line=' + (lineNum - 1) + '&key=' + url + '&v=' + verifyKey);
	});
	alert("线路切换完成！播放视频试试吧！")
});


function share(_this) {
	var videoClass = $(_this).attr('rel');
	var videoName = $(_this).attr('videoName');
	var videoData = {
		name: videoName,
		data: []
	}
	console.log(videoClass)
	$("." + videoClass + ">li").each(function(index, el) {
		videoData.data.push({
			num: $(el).find('a').html(),
			url: $(el).find('a').attr('href')
		})
	});
	$.ajax({
			url: '/video_spider/gen_video',
			type: 'POST',
			dataType: 'json',
			data: {
				data: JSON.stringify(videoData)
			},
		})
		.done(function(data) {
			$("." + videoClass).after('<p>分享成功！分享链接为:' + data.url + '</p>')
		})
		.fail(function() {
			alert("服务器连接失败!")
		})
		.always(function() {
			console.log("complete");
		});

}

function startSearch(_this) {
	$(_this).addClass('searching')
	$(_this).html('搜索中')

	if (!$("#videoName").val().replace(/ /g, '').length) {
		alert("请输入视频名称！")
		$(_this).removeClass('searching')
		$(_this).html('搜索')
		return;
	}
	$.ajax({
			url: '/video_spider/searchVideo',
			type: 'POST',
			dataType: 'json',
			data: {
				videoName: $("#videoName").val()
			},
		})
		.done(function(result) {
			console.log(result)
			$(_this).removeClass('searching')
			$(_this).html('搜索')
			if (result.flag) {
				var videoData = result.data
				var re = /http/
				$(".video-list").empty()
				if (!result.data.length) {
					$(".video-list").append('<p style="font-size:18px;color:red;">暂无此视频，我们后续会更新收录哦！</p>');
					return;
				}
				for (var i = 0; i < videoData.length; i++) {
					$(".video-list").append('<h2>' + videoData[i].name + '</h2><img width="200" height="300" src="' + videoData[i].thumb + '">')
					for (var j = 0; j < videoData[i].list.length; j++) {
						$(".video-list").append('<h3>列表' + j + '</h3>')
						$(".video-list").append('<ul class="list type_' + i + '_list_' + j + '">')
						for (var k = 0; k < videoData[i].list[j].length; k++) {
							var vi = videoData[i].list[j]
							var viUrl = vi[k].url
							$(".type_" + i + "_list_" + j).append('<li><a target="_blank" href="' + apiUrl + '?line=' + lineNum + '&key=' + viUrl + '&v=' + verifyKey + '" url="' + viUrl + '">' + vi[k].num + '</a></li>')
						}
						$(".video-list").append('</ul>')
						$(".video-list").append('<button rel="type_' + i + '_list_' + j + '" class="share" onclick="share(this)" videoName="' + videoData[i].name + '">一键分享</button>')
					}
				}
			} else {
				alert(result.message)
			}
		})
		.fail(function() {
			$(_this).removeClass('searching')
			$(_this).html('搜索')
			alert("服务器连接失败")
		})
		.always(function() {
			console.log("complete");
		});

}
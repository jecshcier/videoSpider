var lineNum = 0
$("input[name=changeLine]").change(function(event) {
	lineNum = parseInt($(this).attr('url'));
	console.log(lineNum - 1)
	if (!$(".list>li>a").length) {
		return;
	}
	alert("切换线路中，请稍后!")

	$(".list>li>a").each(function(index, el) {
		var url = $(this).attr('url')
		$(this).attr('href', apiUrl + (lineNum - 1) + '/' + url);
	});
	alert("线路切换完成！播放视频试试吧！")
});

function startSearch() {
	if (!$("#videoName").val().replace(/ /g, '').length) {
		alert("请输入视频名称！")
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
			if (result.flag) {
				var videoData = result.data
				var re = /http/
				$(".video-list").empty()
				for (var i = 0; i < videoData.length; i++) {
					$(".video-list").append('<h2>' + videoData[i].name + '</h2><img width="200" height="300" src="' + videoData[i].thumb + '">')
					for (var j = 0; j < videoData[i].list.length; j++) {
						$(".video-list").append('<h3>列表' + j + '</h3>')
						$(".video-list").append('<ul class="list type_' + i + '_list_' + j + '">')
						for (var k = 0; k < videoData[i].list[j].length; k++) {
							var vi = videoData[i].list[j]
							var viUrl = vi[k].url
							$(".type_" + i + "_list_" + j).append('<li><a target="_blank" href="' + apiUrl + lineNum + '/' + viUrl + '" url="' + viUrl + '">' + vi[k].num + '</a></li>')
						}
						$(".video-list").append('</ul>')
					}
				}
			} else {
				alert(result.message)
			}
		})
		.fail(function() {
			alert("服务器连接失败")
		})
		.always(function() {
			console.log("complete");
		});

}
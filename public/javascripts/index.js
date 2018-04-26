function login(_this){
	var key = $(".key").val()
	if(key === "" || !key){
		alert("密码不能为空!");
		return;
	}
	$.ajax({
		url: '/video_spider/login',
		type: 'POST',
		dataType: 'JSON',
		data: {key: key},
	})
	.done(function(result) {
		if (result.flag) {
			window.location.reload();
			return
		}
		alert(result.message)
	})
	.fail(function() {
		alert("服务器连接失败!")
	})
	.always(function() {
		console.log("complete");
	});
	

}